/**
 * Tạo MCP server với tool dataflow_gen1_export.
 */

import { stat } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PowerBIClient } from "./powerbi.js";
import { getQueryGroupNames, parseMashupDocument } from "./mashup.js";
import { DEFAULT_FOLDER, writeDataflowNotes } from "./obsidian.js";
import { writeRepoFiles } from "./repo.js";

/** Giới hạn ký tự output để không làm tràn context của AI */
const CHARACTER_LIMIT = 50_000;
const GUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Hai cách ghi file:
 * - obsidian: note Markdown trong vault Obsidian, có wikilink và MOC. Cần OBSIDIAN_VAULT_DIR.
 * - repo: thư mục thường, mỗi query một file .pq kèm README. Cần DATAFLOW_OUTPUT_DIR.
 *   Dành cho người không dùng Obsidian, và cho repo git của team.
 *
 * @param {{
 *   client?: Pick<PowerBIClient, "getText" | "getJson">,
 *   vaultDir?: string,
 *   outputDir?: string,
 *   format?: "obsidian" | "repo",
 *   folder?: string,
 *   now?: () => Date,
 * }} [options]
 */
export function createServer({ client, vaultDir, outputDir, format, folder, now = () => new Date() } = {}) {
    // Tạo client không đăng nhập ngay. Trình duyệt chỉ mở khi tool gọi API lần đầu
    const powerbi = client ?? new PowerBIClient();
    const vault = vaultDir || process.env.OBSIDIAN_VAULT_DIR;
    const output = outputDir || process.env.DATAFLOW_OUTPUT_DIR;
    const vaultFolder = folder || process.env.OBSIDIAN_DATAFLOW_FOLDER || DEFAULT_FOLDER;
    // Cấu hình nào có thì dùng cái đó. Có cả hai thì DATAFLOW_FORMAT quyết định, mặc định obsidian
    const mode = format || process.env.DATAFLOW_FORMAT || (vault ? "obsidian" : "repo");
    const targetDir = mode === "repo" ? output : vault;
    const targetEnv = mode === "repo" ? "DATAFLOW_OUTPUT_DIR (thư mục lưu M code)" : "OBSIDIAN_VAULT_DIR (thư mục gốc của vault Obsidian)";

    /** @type {Map<string, string>} workspace ID (chữ thường) → tên workspace */
    const workspaceNames = new Map();

    /** @param {string} workspaceId */
    async function getWorkspaceName(workspaceId) {
        if (!workspaceNames.has(workspaceId)) {
            const groups = await powerbi.getJson("/groups?$top=5000");
            for (const group of groups.value ?? []) {
                workspaceNames.set(String(group.id).toLowerCase(), group.name);
            }
        }
        const name = workspaceNames.get(workspaceId);
        if (!name) {
            throw new Error(`Không tìm thấy workspace ${workspaceId}, hoặc tài khoản đang đăng nhập không có quyền vào workspace đó.`);
        }
        return name;
    }

    const server = new McpServer({ name: "powerbi-dataflow-mcp", version: "0.2.0" });

    server.registerTool(
        "dataflow_gen1_export",
        {
            title: "Export Dataflow Gen1",
            description: `Export một Dataflow Gen1 (Power BI dataflow) theo workspace ID và dataflow ID ra file, rồi trả về M code của từng query.
${mode === "repo"
    ? `File được ghi vào <thư mục lưu>/<tên workspace>/<tên dataflow>/: mỗi query một file .pq, kèm README.md liệt kê query. README gốc liệt kê mọi dataflow đã export.`
    : `Note được ghi vào <vault>/${vaultFolder}/<tên workspace>/<tên dataflow>.md và được liệt kê trong MOC cùng thư mục.`}
Export lại thì file cũ được cập nhật, mục "## Ghi chú" viết tay được giữ nguyên.
Lần gọi đầu tiên trong phiên sẽ mở trình duyệt tới trang đăng nhập Microsoft. Báo người dùng đăng nhập trước khi gọi.
Lấy hai ID từ M code của bảng trong semantic model: PowerPlatform.Dataflows(...){[workspaceId="..."]}[Data]{[dataflowId="..."]},
hoặc từ URL https://app.powerbi.com/groups/<workspace_id>/dataflows/<dataflow_id>.`,
            inputSchema: {
                workspace_id: z.string().regex(GUID_PATTERN, "workspace_id phải là GUID").describe("ID của workspace chứa dataflow"),
                dataflow_id: z.string().regex(GUID_PATTERN, "dataflow_id phải là GUID").describe("ID của dataflow"),
                query_name: z.string().optional().describe("Chỉ trả M code của query này (không phân biệt hoa thường). Note vẫn chứa mọi query. Tên entity mà semantic model dùng chính là tên query"),
            },
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
        },
        async ({ workspace_id, dataflow_id, query_name }) => {
            try {
                // Kiểm cấu hình trước khi gọi API, để cấu hình sai thì không bắt người dùng đăng nhập
                if (!targetDir) {
                    return errorResult(`Error: Chưa cấu hình ${targetEnv} cho powerbi-dataflow-mcp.`);
                }
                if (!(await isDirectory(targetDir))) {
                    return errorResult(`Error: Không thấy thư mục "${targetDir}". Kiểm lại ${targetEnv}.`);
                }

                const workspaceId = workspace_id.toLowerCase();
                const dataflowId = dataflow_id.toLowerCase();
                const workspaceName = await getWorkspaceName(workspaceId);
                const model = JSON.parse(await powerbi.getText(`/groups/${workspaceId}/dataflows/${dataflowId}`));
                const mashup = model["pbi:mashup"];
                if (!mashup) {
                    throw new Error("API không trả về model.json của Dataflow Gen1 (thiếu field 'pbi:mashup').");
                }

                const metadata = mashup.queriesMetadata ?? {};
                const groupNames = getQueryGroupNames(model);
                const queries = parseMashupDocument(mashup.document ?? "").map((q) => {
                    const meta = metadata[q.name] ?? {};
                    return {
                        ...q,
                        loadEnabled: meta.loadEnabled ?? false,
                        queryGroup: meta.queryGroupId ? groupNames.get(meta.queryGroupId) ?? meta.queryGroupId : null,
                    };
                });

                const common = { workspaceName, workspaceId, dataflowId, model, queries, exportedAt: now() };
                const written = mode === "repo"
                    ? await writeRepoFiles({ outputDir: targetDir, ...common })
                    : await writeDataflowNotes({ vaultDir: targetDir, folder: vaultFolder, ...common });

                let shown = queries;
                if (query_name) {
                    shown = queries.filter((q) => q.name.toLowerCase() === query_name.toLowerCase());
                    if (shown.length === 0) {
                        return errorResult(`Error: Đã export dataflow '${model.name}' vào note ${written.note}, nhưng dataflow không có query '${query_name}'. Các query hiện có: ${queries.map((q) => q.name).join(", ")}`);
                    }
                }

                const summary = {
                    workspace: workspaceName,
                    workspaceId,
                    dataflow: model.name,
                    dataflowId,
                    modifiedTime: model.modifiedTime,
                    format: mode,
                    ...(mode === "repo"
                        ? {
                            outputDir: targetDir,
                            note: written.note,
                            queryFiles: written.queryFiles,
                            staleQueryFiles: written.staleQueryFiles,
                            index: written.index,
                        }
                        : {
                            vault: targetDir,
                            note: written.note,
                            queryNotes: written.queryNotes,
                            staleQueryNotes: written.staleQueryNotes,
                            moc: written.moc,
                        }),
                    queries: queries.map(({ name, loadEnabled, queryGroup }) => ({ name, loadEnabled, queryGroup })),
                };

                // M code để dạng text thường, không đưa vào JSON, để khỏi escape dấu " và xuống dòng
                const parts = [
                    JSON.stringify(summary, null, 2),
                    ...shown.map((q) => `// ===== ${q.name} =====\n${q.expression}`),
                ];
                return { content: [{ type: "text", text: limitText(parts.join("\n\n")) }] };
            } catch (error) {
                return errorResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );

    return server;
}

/** @param {string} path */
async function isDirectory(path) {
    try {
        return (await stat(path)).isDirectory();
    } catch {
        return false;
    }
}

/** @param {string} text */
function errorResult(text) {
    return { content: [{ type: "text", text }], isError: true };
}

/**
 * Cắt output theo CHARACTER_LIMIT và ghi chú lý do cắt
 * @param {string} text
 */
function limitText(text) {
    if (text.length <= CHARACTER_LIMIT) return text;
    return `${text.slice(0, CHARACTER_LIMIT)}\n\n... [Đã cắt: output dài ${text.length} ký tự, giới hạn ${CHARACTER_LIMIT}. Dùng query_name để lấy từng query, hoặc đọc note trong vault]`;
}
