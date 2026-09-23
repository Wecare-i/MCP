/**
 * Ghi snapshot M code của Dataflow Gen1 vào vault Obsidian, theo "Quy ước ghi note" của vault:
 * YAML ở dòng đầu, có type + tags + updated, có khối "## For future agent", có MOC trỏ tới,
 * note dài hơn 400 dòng thì tách.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
    GENERATED_BY, START, END, toSafeName, cell, codeBlock, countLines, findMarkerLine,
    readIfExists, formatDate, formatDateTime, formatHuman, formatHumanDate,
} from "./markdown.js";

export { GENERATED_BY, START, END } from "./markdown.js";
export const toNoteName = toSafeName;
export const DEFAULT_FOLDER = "20 Areas/Wecare/Power BI Dataflow";
export const MOC_NAME = "Power BI Dataflow — MOC";

/** Quy ước của vault: note dài hơn mức này thì tách */
const MAX_NOTE_LINES = 400;
/** Khi phải tách, query dài hơn mức này được ghi thành note riêng */
const INLINE_QUERY_LINES = 50;

// Key frontmatter do tool ghi. Key khác (ví dụ relations) được giữ lại khi export lại
const TOOL_KEYS = new Set([
    "type", "tags", "updated", "workspace", "workspace_id", "dataflow", "dataflow_id",
    "dataflow_modified", "query", "exported", "url", "generated_by",
]);

/**
 * @typedef {{ name: string, expression: string, loadEnabled: boolean, queryGroup: string | null }} DataflowQuery
 * @typedef {{
 *   vaultDir: string,
 *   folder?: string,
 *   workspaceName: string,
 *   workspaceId: string,
 *   dataflowId: string,
 *   model: { name: string, modifiedTime?: string },
 *   queries: DataflowQuery[],
 *   exportedAt: Date,
 * }} DataflowExport
 */

/**
 * Ghi note của một dataflow và cập nhật MOC.
 * Dataflow nhỏ: một note chứa mọi query. Note dài hơn MAX_NOTE_LINES: query dài hơn
 * INLINE_QUERY_LINES được ghi thành note riêng trong thư mục cùng tên với dataflow.
 * @param {DataflowExport} input
 * @returns {Promise<{ note: string, queryNotes: string[], staleQueryNotes: string[], moc: string }>}
 *   Đường dẫn tương đối so với vault root.
 */
export async function writeDataflowNotes(input) {
    const { vaultDir, folder = DEFAULT_FOLDER, workspaceName, model, queries } = input;
    const workspaceFolder = `${folder}/${toNoteName(workspaceName)}`;
    const notePath = `${workspaceFolder}/${toNoteName(model.name)}.md`;
    const queryFolder = `${workspaceFolder}/${toNoteName(model.name)}`;

    const existing = await readIfExists(join(vaultDir, notePath));
    const kept = existing === null ? { frontmatter: [], userSection: "## Ghi chú\n" } : keepUserParts(existing);

    /** @type {Map<string, string>} tên query → đường dẫn note riêng */
    let separate = new Map();
    let content = renderDataflowNote(input, separate, kept);
    if (countLines(content) > MAX_NOTE_LINES) {
        const longQueries = queries.filter((q) => countLines(q.expression) > INLINE_QUERY_LINES);
        separate = assignQueryNotePaths(longQueries, queryFolder);
        content = renderDataflowNote(input, separate, kept);
    }

    for (const query of queries) {
        const path = separate.get(query.name);
        if (path) await writeGeneratedNote(vaultDir, path, renderQueryNote(input, query, notePath));
    }
    await writeGeneratedNote(vaultDir, notePath, content);

    const staleQueryNotes = await listStaleQueryNotes(vaultDir, queryFolder, new Set(separate.values()));
    const moc = await updateMoc(vaultDir, folder, input.exportedAt);
    return { note: notePath, queryNotes: [...separate.values()], staleQueryNotes, moc };
}

/**
 * @param {DataflowExport} input
 * @param {Map<string, string>} separate
 * @param {{ frontmatter: string[], userSection: string }} kept
 */
function renderDataflowNote(input, separate, kept) {
    const { workspaceName, workspaceId, dataflowId, model, queries, exportedAt } = input;
    const lines = [
        "---",
        "type: reference",
        "tags: [reference, wecare, power-bi, dataflow]",
        `updated: ${formatDate(exportedAt)}`,
        `workspace: ${yaml(workspaceName)}`,
        `workspace_id: ${workspaceId}`,
        `dataflow: ${yaml(model.name)}`,
        `dataflow_id: ${dataflowId}`,
        `dataflow_modified: ${yaml(model.modifiedTime ?? "TBD")}`,
        `exported: ${formatDateTime(exportedAt)}`,
        `url: https://app.powerbi.com/groups/${workspaceId}/dataflows/${dataflowId}`,
        `generated_by: ${GENERATED_BY}`,
        ...kept.frontmatter,
        "---",
        "",
        `# ${model.name}`,
        "",
        "## For future agent",
        "",
        `Snapshot M code của Dataflow Gen1 \`${model.name}\` trong workspace ${workspaceName}, export lúc ${formatHuman(exportedAt)} bằng \`${GENERATED_BY}\`. ` +
            "Dataflow trên Power BI Service có thể đã đổi sau lúc export, nên export lại trước khi trích dẫn code. " +
            `Tool ghi lại mọi thứ phía trên dòng \`${END}\` mỗi lần export; ghi chú tay đặt dưới mục \`## Ghi chú\`.`,
        "",
        START,
        "## Danh sách query",
        "",
        "Query có Load ✅ được load thành entity. Semantic model và dataflow khác đọc dữ liệu từ entity.",
        "",
        "| Query | Load | Query group | Code |",
        "|---|---|---|---|",
        ...queries.map((q) => {
            const code = separate.has(q.name) ? wikilink(separate.get(q.name), "note riêng", true) : `[[#${q.name}]]`;
            return `| ${cell(q.name)} | ${q.loadEnabled ? "✅" : ""} | ${cell(q.queryGroup ?? "")} | ${code} |`;
        }),
    ];
    for (const query of queries) {
        if (separate.has(query.name)) continue;
        lines.push("", `## ${query.name}`, "", ...codeBlock(query.expression));
    }
    lines.push(END, "", kept.userSection.trimEnd(), "");
    return lines.join("\n");
}

/**
 * Note riêng của một query dài. Tool ghi lại toàn bộ note này mỗi lần export.
 * @param {DataflowExport} input
 * @param {DataflowQuery} query
 * @param {string} dataflowNotePath
 */
function renderQueryNote(input, query, dataflowNotePath) {
    const { workspaceName, dataflowId, model, exportedAt } = input;
    return [
        "---",
        "type: reference",
        "tags: [reference, wecare, power-bi, dataflow, power-query]",
        `updated: ${formatDate(exportedAt)}`,
        `workspace: ${yaml(workspaceName)}`,
        `dataflow: ${yaml(model.name)}`,
        `dataflow_id: ${dataflowId}`,
        `query: ${yaml(query.name)}`,
        `exported: ${formatDateTime(exportedAt)}`,
        `generated_by: ${GENERATED_BY}`,
        "---",
        "",
        `# ${query.name}`,
        "",
        "## For future agent",
        "",
        `M code của query \`${query.name}\` trong dataflow ${wikilink(dataflowNotePath, model.name)}, export lúc ${formatHuman(exportedAt)} bằng \`${GENERATED_BY}\`. ` +
            "Tool ghi lại toàn bộ note này mỗi lần export, nên ghi chú tay đặt trong note của dataflow.",
        "",
        `Load: ${query.loadEnabled ? "✅ (entity)" : "không"} · Query group: ${query.queryGroup ?? "không có"}`,
        "",
        ...codeBlock(query.expression),
        "",
    ].join("\n");
}

/**
 * Liệt kê note dataflow do tool tạo trong <folder>/<workspace>/, ghi vào vùng giữa START và END của MOC.
 * @param {string} vaultDir
 * @param {string} folder
 * @param {Date} now
 */
async function updateMoc(vaultDir, folder, now) {
    const mocPath = `${folder}/${MOC_NAME}.md`;

    /** @type {Map<string, Array<{ path: string, dataflow: string, exported: string | undefined }>>} */
    const byWorkspace = new Map();
    for (const workspaceDir of await readdir(join(vaultDir, folder), { withFileTypes: true })) {
        if (!workspaceDir.isDirectory()) continue;
        for (const file of await readdir(join(vaultDir, folder, workspaceDir.name), { withFileTypes: true })) {
            if (!file.isFile() || !file.name.endsWith(".md")) continue;
            const path = `${folder}/${workspaceDir.name}/${file.name}`;
            const frontmatter = readFrontmatter(await readFile(join(vaultDir, path), "utf8"));
            if (frontmatterValue(frontmatter, "generated_by") !== GENERATED_BY) continue;
            const workspace = frontmatterValue(frontmatter, "workspace") ?? workspaceDir.name;
            const items = byWorkspace.get(workspace) ?? [];
            items.push({
                path,
                dataflow: frontmatterValue(frontmatter, "dataflow") ?? file.name.slice(0, -3),
                exported: frontmatterValue(frontmatter, "exported"),
            });
            byWorkspace.set(workspace, items);
        }
    }

    const region = [START];
    for (const workspace of [...byWorkspace.keys()].sort((a, b) => a.localeCompare(b))) {
        region.push(`## ${workspace}`, "");
        const items = byWorkspace.get(workspace).sort((a, b) => a.dataflow.localeCompare(b.dataflow));
        for (const item of items) {
            region.push(`- ${wikilink(item.path, item.dataflow)} — export ${formatHumanDate(item.exported)}`);
        }
        region.push("");
    }
    region.push(END);

    const existing = await readIfExists(join(vaultDir, mocPath));
    let content;
    if (existing === null) {
        content = [
            "---",
            "type: moc",
            "tags: [moc, wecare, power-bi, dataflow]",
            `updated: ${formatDate(now)}`,
            "---",
            "",
            `# ${MOC_NAME}`,
            "",
            "## For future agent",
            "",
            "Danh sách note snapshot M code của Dataflow Gen1, nhóm theo workspace. " +
                `Tool \`${GENERATED_BY}\` ghi lại phần giữa hai dòng \`${START}\` và \`${END}\` mỗi lần export. ` +
                "Ngày ở cuối mỗi dòng là ngày export dataflow đó.",
            "",
            ...region,
            "",
        ].join("\n");
    } else {
        const start = findMarkerLine(existing, START);
        const end = findMarkerLine(existing, END);
        if (start === -1 || end < start) {
            throw new Error(`MOC "${mocPath}" thiếu hai dòng ${START} và ${END}. Tool không sửa MOC này.`);
        }
        content = existing.slice(0, start) + region.join("\n") + existing.slice(end + END.length);
        content = setFrontmatterValue(content, "updated", formatDate(now));
    }
    await mkdir(dirname(join(vaultDir, mocPath)), { recursive: true });
    await writeFile(join(vaultDir, mocPath), content, "utf8");
    return mocPath;
}

/**
 * Note query cũ trong thư mục của dataflow nhưng không còn được dùng.
 * Tool không xoá các note này, chỉ báo lại để người dùng quyết định.
 * @param {string} vaultDir
 * @param {string} queryFolder
 * @param {Set<string>} keep
 */
async function listStaleQueryNotes(vaultDir, queryFolder, keep) {
    let entries;
    try {
        entries = await readdir(join(vaultDir, queryFolder), { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => `${queryFolder}/${entry.name}`)
        .filter((path) => !keep.has(path));
}

/**
 * @param {DataflowQuery[]} queries
 * @param {string} queryFolder
 */
function assignQueryNotePaths(queries, queryFolder) {
    /** @type {Map<string, string>} */
    const paths = new Map();
    const usedNames = new Set();
    for (const query of queries) {
        // Hai tên query khác nhau có thể ra cùng tên note sau khi thay ký tự không hợp lệ
        const baseName = toNoteName(query.name);
        let name = baseName;
        for (let suffix = 2; usedNames.has(name.toLowerCase()); suffix++) {
            name = `${baseName} (${suffix})`;
        }
        usedNames.add(name.toLowerCase());
        paths.set(query.name, `${queryFolder}/${name}.md`);
    }
    return paths;
}

/**
 * Chỉ ghi đè note do tool tạo. Note người dùng tự tạo ở cùng đường dẫn thì báo lỗi.
 * @param {string} vaultDir
 * @param {string} path
 * @param {string} content
 */
async function writeGeneratedNote(vaultDir, path, content) {
    const absolutePath = join(vaultDir, path);
    const existing = await readIfExists(absolutePath);
    if (existing !== null && frontmatterValue(readFrontmatter(existing), "generated_by") !== GENERATED_BY) {
        throw new Error(`Note "${path}" đã có và không do ${GENERATED_BY} tạo. Tool không ghi đè note này.`);
    }
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
}

/**
 * Phần người dùng tự thêm vào note dataflow: key frontmatter ngoài TOOL_KEYS và mọi thứ sau dòng END.
 * @param {string} text
 */
function keepUserParts(text) {
    /** @type {string[]} */
    const frontmatter = [];
    let keep = false;
    for (const line of readFrontmatter(text)) {
        const key = /^([A-Za-z0-9_-]+):/.exec(line);
        if (key) keep = !TOOL_KEYS.has(key[1]);
        if (keep) frontmatter.push(line);
    }
    const end = findMarkerLine(text, END);
    const userSection = end === -1 ? "" : text.slice(end + END.length).replace(/^\s*\n/, "");
    return { frontmatter, userSection: userSection.trim() ? userSection : "## Ghi chú\n" };
}

function readFrontmatter(text) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    return match ? match[1].split(/\r?\n/) : [];
}

/**
 * @param {string[]} lines
 * @param {string} key
 * @returns {string | undefined}
 */
function frontmatterValue(lines, key) {
    const line = lines.find((l) => l.startsWith(`${key}:`));
    if (line === undefined) return undefined;
    const raw = line.slice(key.length + 1).trim();
    if (raw.startsWith('"')) {
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    }
    return raw;
}

/**
 * Đổi giá trị một key trong frontmatter, không đụng tới phần thân note.
 * @param {string} text
 * @param {string} key
 * @param {string} value
 */
function setFrontmatterValue(text, key, value) {
    const match = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
    if (!match) return text;
    const pattern = new RegExp(`^${key}:.*$`, "m");
    const frontmatter = pattern.test(match[0])
        ? match[0].replace(pattern, `${key}: ${value}`)
        : match[0].replace(/\r?\n---(\r?\n|$)/, `\n${key}: ${value}\n---$1`);
    return frontmatter + text.slice(match[0].length);
}

/**
 * @param {string} path Đường dẫn note tương đối so với vault root
 * @param {string} alias
 * @param {boolean} [inTable] Trong bảng Markdown, dấu | của wikilink phải viết là \|
 */
function wikilink(path, alias, inTable = false) {
    const target = path.replace(/\.md$/, "");
    const label = alias.replace(/[|\]]/g, "_");
    return `[[${target}${inTable ? "\\|" : "|"}${label}]]`;
}

/** @param {string} value */
function yaml(value) {
    // Chuỗi JSON cũng là chuỗi YAML hợp lệ trong dấu ngoặc kép
    return JSON.stringify(value);
}
