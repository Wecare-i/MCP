/**
 * Dataflow Gen1 Tools
 *
 * Tools cho phép AI đọc Dataflow Gen1 (Power BI dataflow): liệt kê dataflow
 * và export definition (model.json) kèm M code của từng query.
 * Sử dụng Power BI REST API. Dataflow Gen2 dùng Fabric REST API, xem dataflowTools.ts.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PowerBIClient } from "../services/powerbiClient.js";
import { CHARACTER_LIMIT } from "../constants.js";
import {
    DataflowGen1ListSchema,
    DataflowGen1GetDefinitionSchema,
} from "../schemas/dataflowGen1Schemas.js";

type ClientGetter = () => PowerBIClient;

/** Các field cần dùng trong model.json của Dataflow Gen1 */
interface DataflowGen1Model {
    name: string;
    description?: string;
    modifiedTime?: string;
    annotations?: Array<{ name: string; value: string }>;
    "pbi:mashup"?: {
        document?: string;
        queriesMetadata?: Record<string, { queryGroupId?: string; loadEnabled?: boolean }>;
    };
}

/** Một query (section member) trong mashup document */
export interface MashupQuery {
    name: string;
    expression: string;
}

export function registerDataflowGen1Tools(server: McpServer, getClient: ClientGetter) {
    // ─── List Dataflow Gen1 ──────────────────────────────
    server.tool(
        "dataflow_gen1_list",
        "Liệt kê tất cả Dataflow Gen1 (Power BI dataflow) trong workspace. Field objectId là dataflow_id",
        DataflowGen1ListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/dataflows`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── Get Dataflow Gen1 Definition ────────────────────
    server.tool(
        "dataflow_gen1_get_definition",
        "Export definition (model.json) của một Dataflow Gen1 và trả về M code của từng query. Dataflow lớn thì dùng query_name để lấy từng query",
        DataflowGen1GetDefinitionSchema.shape,
        async ({ workspace_id, dataflow_id, query_name, include_raw }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const model = await client.get<DataflowGen1Model>(`/groups/${groupId}/dataflows/${dataflow_id}`);

                const mashup = model["pbi:mashup"];
                let queries = parseMashupDocument(mashup?.document ?? "");
                if (query_name) {
                    queries = queries.filter((q) => q.name.toLowerCase() === query_name.toLowerCase());
                    if (queries.length === 0) {
                        return {
                            content: [{ type: "text" as const, text: `Error: Không tìm thấy query '${query_name}' trong dataflow '${model.name}'` }],
                            isError: true,
                        };
                    }
                }

                const groupNames = getQueryGroupNames(model);
                const summary = {
                    dataflow: model.name,
                    description: model.description,
                    modifiedTime: model.modifiedTime,
                    queryCount: queries.length,
                    queries: queries.map((q) => {
                        const meta = mashup?.queriesMetadata?.[q.name];
                        return {
                            name: q.name,
                            loadEnabled: meta?.loadEnabled ?? false,
                            queryGroup: meta?.queryGroupId ? groupNames.get(meta.queryGroupId) ?? meta.queryGroupId : null,
                        };
                    }),
                };

                // M code để dạng text thường, không đưa vào JSON, để khỏi escape dấu " và xuống dòng
                const parts = [
                    JSON.stringify(summary, null, 2),
                    ...queries.map((q) => `// ===== ${q.name} =====\n${q.expression}`),
                ];
                if (include_raw) {
                    parts.push(`// ===== model.json =====\n${JSON.stringify(model, null, 2)}`);
                }

                return {
                    content: [{ type: "text" as const, text: limitText(parts.join("\n\n")) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}

/**
 * Tách section document ("section Section1; shared A = ...; shared B = ...;") thành từng query.
 * Chỉ cắt ở dấu ; ngoài text, quoted identifier (#"...") và comment.
 */
export function parseMashupDocument(document: string): MashupQuery[] {
    const members: string[] = [];
    const n = document.length;
    let start = 0;
    let i = 0;
    while (i < n) {
        const ch = document[i];
        const next = document[i + 1];
        if (ch === '"') {
            // Text hoặc quoted identifier. Hai dấu "" liền nhau là một dấu " đã escape
            i++;
            while (i < n) {
                if (document[i] === '"') {
                    if (document[i + 1] === '"') {
                        i += 2;
                        continue;
                    }
                    break;
                }
                i++;
            }
            i++;
        } else if (ch === "/" && next === "/") {
            const end = document.indexOf("\n", i);
            i = end === -1 ? n : end + 1;
        } else if (ch === "/" && next === "*") {
            const end = document.indexOf("*/", i + 2);
            i = end === -1 ? n : end + 2;
        } else if (ch === ";") {
            members.push(document.slice(start, i));
            start = i + 1;
            i++;
        } else {
            i++;
        }
    }
    if (document.slice(start).trim()) {
        members.push(document.slice(start));
    }

    const queries: MashupQuery[] = [];
    for (const member of members) {
        // Dòng "section Section1" không có dấu = nên không khớp
        const match = /^\s*(?:\[[\s\S]*?\]\s*)?(?:shared\s+)?(#"(?:[^"]|"")*"|[^\s=]+)\s*=\s*([\s\S]*)$/.exec(member);
        if (!match) continue;
        const rawName = match[1];
        const name = rawName.startsWith('#"') ? rawName.slice(2, -1).replace(/""/g, '"') : rawName;
        queries.push({ name, expression: match[2].trim() });
    }
    return queries;
}

/** Map queryGroupId → tên nhóm, lấy từ annotation pbi:QueryGroups. Nhóm con có dạng "Cha/Con" */
function getQueryGroupNames(model: DataflowGen1Model): Map<string, string> {
    const names = new Map<string, string>();
    const annotation = model.annotations?.find((a) => a.name === "pbi:QueryGroups");
    if (!annotation) return names;

    let groups: Array<{ id: string; name: string; parentId?: string | null }>;
    try {
        groups = JSON.parse(annotation.value);
    } catch {
        return names;
    }
    if (!Array.isArray(groups)) return names;

    const byId = new Map(groups.map((g) => [g.id, g]));
    for (const group of groups) {
        const path: string[] = [];
        let current: (typeof groups)[number] | undefined = group;
        // Giới hạn số vòng lặp phòng khi parentId trỏ thành vòng
        while (current && path.length < groups.length) {
            path.unshift(current.name);
            current = current.parentId ? byId.get(current.parentId) : undefined;
        }
        names.set(group.id, path.join("/"));
    }
    return names;
}

/** Cắt output theo CHARACTER_LIMIT và ghi chú lý do cắt */
function limitText(text: string): string {
    if (text.length <= CHARACTER_LIMIT) return text;
    return `${text.slice(0, CHARACTER_LIMIT)}\n\n... [Đã cắt: output dài ${text.length} ký tự, giới hạn ${CHARACTER_LIMIT}. Dùng query_name để lấy từng query]`;
}
