/**
 * Ghi snapshot M code của Dataflow Gen1 vào một thư mục thường, cho người không dùng Obsidian.
 *
 * Bố cục:
 *   <outputDir>/README.md                            danh sách dataflow đã export
 *   <outputDir>/<workspace>/<dataflow>/README.md     bảng query + link tới từng file .pq
 *   <outputDir>/<workspace>/<dataflow>/<query>.pq    M code của một query
 *
 * File .pq xem được trong VS Code và diff được bằng git. README dùng link Markdown thường
 * nên GitHub, VS Code và cả Obsidian đều mở được.
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
    GENERATED_BY, START, END, toSafeName, cell, findMarkerLine, link,
    readIfExists, formatDate, formatDateTime, formatHuman,
} from "./markdown.js";

/** Dòng đầu của file .pq do tool ghi. Thiếu dòng này thì tool không ghi đè */
const PQ_MARKER = `// ${GENERATED_BY}`;
/** Dòng đầu của README do tool ghi */
const README_MARKER = `<!-- ${GENERATED_BY} -->`;

/**
 * Ghi file của một dataflow và cập nhật README gốc.
 * @param {import("./obsidian.js").DataflowExport & { outputDir: string }} input
 * @returns {Promise<{ note: string, queryFiles: string[], staleQueryFiles: string[], index: string }>}
 *   Đường dẫn tương đối so với outputDir.
 */
export async function writeRepoFiles(input) {
    const { outputDir, workspaceName, model, queries, exportedAt } = input;
    const folder = `${toSafeName(workspaceName)}/${toSafeName(model.name)}`;
    const readmePath = `${folder}/README.md`;

    /** @type {Map<string, string>} tên query → đường dẫn file .pq */
    const files = new Map();
    const used = new Set();
    for (const query of queries) {
        let name = toSafeName(query.name);
        while (used.has(name.toLowerCase())) name += "_";
        used.add(name.toLowerCase());
        files.set(query.name, `${folder}/${name}.pq`);
    }

    for (const query of queries) {
        await writeGenerated(outputDir, files.get(query.name), renderQueryFile(input, query), PQ_MARKER);
    }

    const existing = await readIfExists(join(outputDir, readmePath));
    await writeGenerated(outputDir, readmePath, renderDataflowReadme(input, files, keepUserSection(existing)), README_MARKER);

    const staleQueryFiles = await listStaleFiles(outputDir, folder, new Set(files.values()));
    const index = await updateIndex(outputDir, exportedAt);
    return { note: readmePath, queryFiles: [...files.values()], staleQueryFiles, index };
}

/**
 * @param {import("./obsidian.js").DataflowExport} input
 * @param {import("./obsidian.js").DataflowQuery} query
 */
function renderQueryFile(input, query) {
    const { workspaceName, model, exportedAt } = input;
    return [
        `${PQ_MARKER} — đừng sửa tay, file này bị ghi đè mỗi lần export`,
        `// Dataflow: ${model.name} · Workspace: ${workspaceName} · Query: ${query.name}`,
        `// Load: ${query.loadEnabled ? "có (entity)" : "không"} · Query group: ${query.queryGroup ?? "không có"}`,
        `// Export lúc ${formatHuman(exportedAt)}`,
        "",
        query.expression,
        "",
    ].join("\n");
}

/**
 * @param {import("./obsidian.js").DataflowExport} input
 * @param {Map<string, string>} files
 * @param {string} userSection
 */
function renderDataflowReadme(input, files, userSection) {
    const { workspaceName, workspaceId, dataflowId, model, queries, exportedAt } = input;
    const folder = dirname(files.values().next().value ?? "x/y");
    const lines = [
        README_MARKER,
        `# ${model.name}`,
        "",
        `Snapshot M code của Dataflow Gen1 \`${model.name}\` trong workspace ${workspaceName}, export lúc ${formatHuman(exportedAt)} bằng \`${GENERATED_BY}\`. ` +
            "Dataflow trên Power BI Service có thể đã đổi sau lúc export, nên export lại trước khi trích dẫn code.",
        "",
        `Tool ghi lại mọi thứ phía trên dòng \`${END}\` mỗi lần export. Ghi chú tay đặt dưới mục \`## Ghi chú\`.`,
        "",
        START,
        "| | |",
        "|---|---|",
        `| Workspace | ${cell(workspaceName)} |`,
        `| Workspace ID | \`${workspaceId}\` |`,
        `| Dataflow ID | \`${dataflowId}\` |`,
        `| Sửa lần cuối trên Service | ${cell(model.modifiedTime ?? "TBD")} |`,
        `| Export lúc | ${formatDateTime(exportedAt)} |`,
        `| Mở trên Service | ${link(`https://app.powerbi.com/groups/${workspaceId}/dataflows/${dataflowId}`, "app.powerbi.com")} |`,
        "",
        "## Danh sách query",
        "",
        "Query có Load ✅ được load thành entity. Semantic model và dataflow khác đọc dữ liệu từ entity.",
        "",
        "| Query | Load | Query group | M code |",
        "|---|---|---|---|",
        ...queries.map((q) => {
            const file = files.get(q.name).slice(folder.length + 1);
            return `| ${cell(q.name)} | ${q.loadEnabled ? "✅" : ""} | ${cell(q.queryGroup ?? "")} | ${link(file, file)} |`;
        }),
        END,
        "",
        userSection.trimEnd(),
        "",
    ];
    return lines.join("\n");
}

/**
 * Liệt kê mọi dataflow đã export trong outputDir, ghi vào vùng giữa START và END của README gốc.
 * @param {string} outputDir
 * @param {Date} now
 */
async function updateIndex(outputDir, now) {
    /** @type {Map<string, Array<{ path: string, dataflow: string, exported: string }>>} */
    const byWorkspace = new Map();
    for (const workspaceDir of await readdir(outputDir, { withFileTypes: true })) {
        if (!workspaceDir.isDirectory()) continue;
        for (const dataflowDir of await readdir(join(outputDir, workspaceDir.name), { withFileTypes: true })) {
            if (!dataflowDir.isDirectory()) continue;
            const path = `${workspaceDir.name}/${dataflowDir.name}/README.md`;
            const text = await readIfExists(join(outputDir, path));
            if (text === null || !text.startsWith(README_MARKER)) continue;
            const exported = /^\| Export lúc \| (.+) \|$/m.exec(text)?.[1] ?? "TBD";
            const rows = byWorkspace.get(workspaceDir.name) ?? [];
            rows.push({ path, dataflow: dataflowDir.name, exported });
            byWorkspace.set(workspaceDir.name, rows);
        }
    }

    const region = [START, ""];
    for (const workspace of [...byWorkspace.keys()].sort()) {
        region.push(`## ${workspace}`, "");
        for (const item of byWorkspace.get(workspace).sort((a, b) => a.dataflow.localeCompare(b.dataflow))) {
            region.push(`- ${link(item.path, item.dataflow)} — export ${item.exported}`);
        }
        region.push("");
    }
    region.push(END);

    const indexPath = "README.md";
    const existing = await readIfExists(join(outputDir, indexPath));
    const content = existing === null
        ? [
            README_MARKER,
            "# Power BI Dataflow",
            "",
            `Snapshot M code của Dataflow Gen1, export bằng \`${GENERATED_BY}\`. Mỗi dataflow một thư mục, mỗi query một file \`.pq\`.`,
            "",
            `Tool ghi lại phần giữa \`${START}\` và \`${END}\` mỗi lần export. Viết gì thêm thì đặt ngoài hai dòng đó.`,
            "",
            `Cập nhật: ${formatDate(now)}`,
            "",
            ...region,
            "",
        ].join("\n")
        : replaceRegion(existing, region.join("\n"));
    await writeGenerated(outputDir, indexPath, content, README_MARKER);
    return indexPath;
}

/**
 * Thay vùng giữa START và END, giữ nguyên phần ngoài.
 * @param {string} text
 * @param {string} region
 */
function replaceRegion(text, region) {
    const start = findMarkerLine(text, START);
    const end = findMarkerLine(text, END);
    if (start === -1 || end === -1 || end < start) return `${text.trimEnd()}\n\n${region}\n`;
    return text.slice(0, start) + region + text.slice(end + END.length);
}

/**
 * Phần người dùng tự viết: mọi thứ sau dòng END.
 * @param {string | null} text
 */
function keepUserSection(text) {
    if (text === null) return "## Ghi chú\n";
    const end = findMarkerLine(text, END);
    const section = end === -1 ? "" : text.slice(end + END.length).replace(/^\s*\n/, "");
    return section.trim() ? section : "## Ghi chú\n";
}

/**
 * Chỉ ghi đè file do tool tạo. File người dùng tự tạo ở cùng đường dẫn thì báo lỗi.
 * @param {string} outputDir
 * @param {string} path
 * @param {string} content
 * @param {string} marker Dòng đầu bắt buộc của file do tool tạo
 */
async function writeGenerated(outputDir, path, content, marker) {
    const absolutePath = join(outputDir, path);
    const existing = await readIfExists(absolutePath);
    if (existing !== null && !existing.startsWith(marker)) {
        throw new Error(`File "${path}" đã có và không do ${GENERATED_BY} tạo. Tool không ghi đè file này.`);
    }
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
}

/**
 * File .pq do tool tạo nhưng query không còn nữa. Tool không xoá, chỉ liệt kê.
 * @param {string} outputDir
 * @param {string} folder
 * @param {Set<string>} keep
 */
async function listStaleFiles(outputDir, folder, keep) {
    /** @type {string[]} */
    const stale = [];
    let entries;
    try {
        entries = await readdir(join(outputDir, folder), { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") return stale;
        throw error;
    }
    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".pq")) continue;
        const path = `${folder}/${entry.name}`;
        if (keep.has(path)) continue;
        const text = await readIfExists(join(outputDir, path));
        if (text !== null && text.startsWith(PQ_MARKER)) stale.push(path);
    }
    return stale;
}
