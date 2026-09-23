// Test tool dataflow_gen1_export bằng Power BI client giả lập và vault tạm, không gọi API thật
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { parseMashupDocument } from "../src/mashup.js";
import { END, MOC_NAME, START } from "../src/obsidian.js";
import { createServer } from "../src/server.js";

const WORKSPACE_ID = "bc7d8dc1-92fd-4b56-b5f7-c0c720e8462e";
const DATAFLOW_ID = "9cbea0d4-1bc6-4fcd-990d-6c34404aca6f";
const FOLDER = "20 Areas/Wecare/Power BI Dataflow";
const NOTE = `${FOLDER}/Accounting dataflow-PROD/CNKH (_7-2025).md`;
const EXPORTED_AT = new Date(2026, 8, 22, 14, 5);

const DOCUMENT = [
    "section Section1;",
    'shared #"CNKH (<7-2025)" = let',
    '    // comment có dấu ; và "ngoặc',
    '    Source = "text ; // không phải comment",',
    "    /* block ; comment */",
    "    Chia = 10 / 2",
    "in",
    "    Source;",
    "shared Helper = 1;",
    "",
].join("\r\n");

function makeModel(document = DOCUMENT, queriesMetadata = { "CNKH (<7-2025)": { loadEnabled: true }, Helper: { queryGroupId: "g1" } }) {
    return {
        name: "CNKH (<7-2025)",
        modifiedTime: "2025-10-01T07:55:20.1588002+00:00",
        annotations: [{ name: "pbi:QueryGroups", value: JSON.stringify([{ id: "g1", name: "Nhóm phụ", parentId: null }]) }],
        "pbi:mashup": { document, queriesMetadata },
    };
}

function fakeClient(model = makeModel()) {
    const client = {
        model,
        calls: [],
        async getText(path) {
            client.calls.push(path);
            if (path === "/groups?$top=5000") return JSON.stringify({ value: [{ id: WORKSPACE_ID, name: "Accounting dataflow-PROD" }] });
            if (path === `/groups/${WORKSPACE_ID}/dataflows/${DATAFLOW_ID}`) return JSON.stringify(client.model);
            throw new Error(`Power BI API Error 404 Not Found: ${path}`);
        },
        async getJson(path) {
            return JSON.parse(await client.getText(path));
        },
    };
    return client;
}

async function setup(client = fakeClient(), options = {}) {
    const vault = await mkdtemp(join(tmpdir(), "vault-"));
    const server = createServer({ client, vaultDir: vault, now: () => EXPORTED_AT, ...options });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const mcp = new Client({ name: "test", version: "1.0.0" });
    await mcp.connect(clientTransport);
    return { mcp, vault, client };
}

/** Gọi tool; lỗi validate tham số có thể trả về dạng exception hoặc dạng isError tuỳ bản SDK */
async function callTool(mcp, args) {
    try {
        return await mcp.callTool({ name: "dataflow_gen1_export", arguments: args });
    } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error.message) }] };
    }
}

const ARGS = { workspace_id: WORKSPACE_ID, dataflow_id: DATAFLOW_ID };
const read = (vault, path) => readFile(join(vault, path), "utf8");

test("parseMashupDocument chỉ cắt ở dấu ; ngoài text và comment", () => {
    const queries = parseMashupDocument(DOCUMENT);
    assert.deepEqual(queries.map((q) => q.name), ["CNKH (<7-2025)", "Helper"]);
    assert.ok(queries[0].expression.startsWith("let"));
    assert.ok(queries[0].expression.endsWith("Source"));
    assert.equal(queries[1].expression, "1");
});

test("export ghi note dataflow theo quy ước vault và cập nhật MOC", async () => {
    const { mcp, vault } = await setup();
    const result = await callTool(mcp, { ...ARGS, workspace_id: WORKSPACE_ID.toUpperCase() });
    assert.equal(result.isError, undefined);

    const text = result.content[0].text;
    const summary = JSON.parse(text.slice(0, text.indexOf("\n\n// =====")));
    assert.equal(summary.note, NOTE);
    assert.equal(summary.moc, `${FOLDER}/${MOC_NAME}.md`);
    assert.deepEqual(summary.queryNotes, []);
    assert.deepEqual(summary.queries, [
        { name: "CNKH (<7-2025)", loadEnabled: true, queryGroup: null },
        { name: "Helper", loadEnabled: false, queryGroup: "Nhóm phụ" },
    ]);
    assert.ok(text.includes("// ===== CNKH (<7-2025) =====\nlet"));

    const note = await read(vault, NOTE);
    assert.ok(note.startsWith("---\ntype: reference\ntags: [reference, wecare, power-bi, dataflow]\nupdated: 2026-09-22\n"));
    assert.ok(note.includes('dataflow: "CNKH (<7-2025)"'));
    assert.ok(note.includes(`url: https://app.powerbi.com/groups/${WORKSPACE_ID}/dataflows/${DATAFLOW_ID}`));
    assert.ok(note.includes("exported: 2026-09-22T14:05"));
    assert.ok(note.includes("generated_by: powerbi-dataflow-mcp"));
    assert.ok(note.includes("\n## For future agent\n\nSnapshot M code của Dataflow Gen1 `CNKH (<7-2025)` trong workspace Accounting dataflow-PROD, export lúc 22/09/2026 14:05"));
    assert.ok(note.includes("| CNKH (<7-2025) | ✅ |  | [[#CNKH (<7-2025)]] |"));
    assert.ok(note.includes("| Helper |  | Nhóm phụ | [[#Helper]] |"));
    assert.ok(note.includes("## Helper\n\n```powerquery\n1\n```"));
    assert.ok(note.endsWith(`${END}\n\n## Ghi chú\n`));

    const moc = await read(vault, `${FOLDER}/${MOC_NAME}.md`);
    assert.ok(moc.startsWith("---\ntype: moc\n"));
    assert.ok(moc.includes("## For future agent"));
    assert.ok(moc.includes(`## Accounting dataflow-PROD\n\n- [[${NOTE.slice(0, -3)}|CNKH (<7-2025)]] — export 22/09/2026`));
});

test("export lại giữ ghi chú tay và key frontmatter người dùng thêm", async () => {
    const { mcp, vault } = await setup();
    await callTool(mcp, ARGS);
    const first = await read(vault, NOTE);

    const edited = first
        .replace("generated_by: powerbi-dataflow-mcp\n", 'generated_by: powerbi-dataflow-mcp\nrelations:\n  relates_to: ["[[WEC-484 — 19 dataflow folder 3521 trỏ lại NewCo]]"]\n')
        .replace("## Ghi chú\n", "## Ghi chú\n\nCột cr44a_taikhoan1 cần kiểm lại.\n");
    await writeFile(join(vault, NOTE), edited, "utf8");

    await callTool(mcp, ARGS);
    const second = await read(vault, NOTE);
    assert.equal(second, edited);
});

test("không ghi đè note do người dùng tự tạo", async () => {
    const { mcp, vault, client } = await setup();
    await mkdir(join(vault, FOLDER, "Accounting dataflow-PROD"), { recursive: true });
    const own = "---\ntype: reference\ntags: [x]\n---\n\nNote tự viết\n";
    await writeFile(join(vault, NOTE), own, "utf8");

    const result = await callTool(mcp, ARGS);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /không do powerbi-dataflow-mcp tạo/);
    assert.equal(await read(vault, NOTE), own);
    assert.equal(client.calls.length, 2);
});

test("note dài hơn 400 dòng thì tách query dài ra note riêng", async () => {
    const longCode = ["let", ...Array.from({ length: 120 }, (_, i) => `    Step${i} = ${i},`), "    Done = 1", "in", "    Done"].join("\n");
    const names = ["Q1", "Q2", "Q3", "Q4"];
    const document = ["section Section1;", ...names.map((n) => `shared ${n} = ${longCode};`), "shared Small = 1;", ""].join("\r\n");
    const client = fakeClient(makeModel(document, { Q1: { loadEnabled: true } }));
    const { mcp, vault } = await setup(client);

    const result = await callTool(mcp, ARGS);
    const text = result.content[0].text;
    const summary = JSON.parse(text.slice(0, text.indexOf("\n\n// =====")));
    const queryFolder = `${FOLDER}/Accounting dataflow-PROD/CNKH (_7-2025)`;
    assert.deepEqual(summary.queryNotes, names.map((n) => `${queryFolder}/${n}.md`));
    assert.deepEqual((await readdir(join(vault, queryFolder))).sort(), ["Q1.md", "Q2.md", "Q3.md", "Q4.md"]);

    const note = await read(vault, NOTE);
    assert.ok(note.split("\n").length <= 400);
    assert.ok(note.includes(`| Q1 | ✅ |  | [[${queryFolder}/Q1\\|note riêng]] |`));
    assert.ok(note.includes("## Small\n\n```powerquery\n1\n```"));

    const q1 = await read(vault, `${queryFolder}/Q1.md`);
    assert.ok(q1.startsWith("---\ntype: reference\n"));
    assert.ok(q1.includes('query: "Q1"'));
    assert.ok(q1.includes(`M code của query \`Q1\` trong dataflow [[${NOTE.slice(0, -3)}|CNKH (<7-2025)]]`));
    assert.ok(q1.includes("```powerquery\nlet\n    Step0 = 0,"));

    // Dataflow nhỏ lại: note query cũ không bị xoá, chỉ được báo lại
    client.model = makeModel();
    const again = await callTool(mcp, ARGS);
    const againText = again.content[0].text;
    const againSummary = JSON.parse(againText.slice(0, againText.indexOf("\n\n// =====")));
    assert.deepEqual(againSummary.queryNotes, []);
    assert.deepEqual(againSummary.staleQueryNotes.sort(), names.map((n) => `${queryFolder}/${n}.md`));
    assert.deepEqual((await readdir(join(vault, queryFolder))).sort(), ["Q1.md", "Q2.md", "Q3.md", "Q4.md"]);
});

test("export lại không đổi note và MOC nếu dataflow không đổi", async () => {
    const { mcp, vault } = await setup();
    const mocPath = `${FOLDER}/${MOC_NAME}.md`;
    await callTool(mcp, ARGS);
    const note = await read(vault, NOTE);
    const moc = await read(vault, mocPath);

    await callTool(mcp, ARGS);
    assert.equal(await read(vault, NOTE), note);
    assert.equal(await read(vault, mocPath), moc);
    assert.equal(moc.split(`\n${START}\n`).length, 2);
    assert.equal(moc.split(`\n${END}\n`).length, 2);
});

test("MOC giữ phần viết tay ngoài hai dòng đánh dấu", async () => {
    const { mcp, vault } = await setup();
    await callTool(mcp, ARGS);
    const mocPath = `${FOLDER}/${MOC_NAME}.md`;
    const withNotes = `${await read(vault, mocPath)}\n## Ghi chú\n\nViết tay.\n`;
    await writeFile(join(vault, mocPath), withNotes, "utf8");

    await callTool(mcp, ARGS);
    assert.equal(await read(vault, mocPath), withNotes);
});

test("bắt buộc workspace_id, dataflow_id dạng GUID và cấu hình vault", async () => {
    const { mcp, client } = await setup();

    const missing = await callTool(mcp, { workspace_id: WORKSPACE_ID });
    assert.equal(missing.isError, true);
    assert.match(missing.content[0].text, /dataflow_id/);

    const invalid = await callTool(mcp, { workspace_id: "Accounting dataflow-PROD", dataflow_id: DATAFLOW_ID });
    assert.equal(invalid.isError, true);
    assert.match(invalid.content[0].text, /workspace_id phải là GUID/);
    assert.deepEqual(client.calls, []);

    const noVault = await setup(fakeClient(), { vaultDir: join(tmpdir(), "khong-co-vault-nay") });
    const result = await callTool(noVault.mcp, ARGS);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Không thấy thư mục vault/);
    assert.deepEqual(noVault.client.calls, []);
});

test("workspace không có quyền và dataflow không tồn tại", async () => {
    const { mcp } = await setup();

    const noAccess = await callTool(mcp, { workspace_id: "99999999-9999-9999-9999-999999999999", dataflow_id: DATAFLOW_ID });
    assert.equal(noAccess.isError, true);
    assert.match(noAccess.content[0].text, /Không tìm thấy workspace 99999999/);

    const notFound = await callTool(mcp, { workspace_id: WORKSPACE_ID, dataflow_id: "11111111-1111-1111-1111-111111111111" });
    assert.equal(notFound.isError, true);
    assert.match(notFound.content[0].text, /404/);
});
