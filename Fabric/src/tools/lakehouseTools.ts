/**
 * Lakehouse Management Tools
 *
 * Tools cho phép AI quản lý Lakehouses: liệt kê, tìm kiếm, chuyển database.
 * Sử dụng Fabric REST API + FabricClient cho SQL connection switching.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FabricRestClient } from "../services/fabricRestClient.js";
import type { FabricClient } from "../services/fabricClient.js";
import {
    LakehouseListSchema,
    LakehouseSwitchSchema,
    LakehouseFindByNameSchema,
} from "../schemas/lakehouseSchemas.js";

type RestClientGetter = () => FabricRestClient;
type SqlClientGetter = () => FabricClient;

export function registerLakehouseTools(
    server: McpServer,
    getRestClient: RestClientGetter,
    getSqlClient: SqlClientGetter
) {
    // ─── List Lakehouses ─────────────────────────────────
    server.tool(
        "lakehouse_list",
        "Liệt kê tất cả Lakehouses trong workspace (bao gồm SQL Endpoint). Dùng kết quả này để biết sql_endpoint và database name khi query.",
        LakehouseListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getRestClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/lakehouses`);
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

    // ─── Switch Default Database ─────────────────────────
    server.tool(
        "lakehouse_switch",
        "Chuyển default SQL Endpoint + Database cho session hiện tại. Sau khi switch, các SQL tools sẽ tự dùng connection mới mà không cần truyền params.",
        LakehouseSwitchSchema.shape,
        async ({ sql_endpoint, database }) => {
            try {
                const client = getSqlClient();
                client.switchDefault(sql_endpoint, database);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                message: "Default connection switched successfully",
                                newEndpoint: sql_endpoint,
                                newDatabase: database,
                            }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── Find Lakehouse by Name ──────────────────────────
    server.tool(
        "lakehouse_find_by_name",
        "Tìm Lakehouse theo tên (không phân biệt hoa thường). Trả về ID, SQL Endpoint và thông tin chi tiết.",
        LakehouseFindByNameSchema.shape,
        async ({ workspace_id, name }) => {
            try {
                const client = getRestClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get<{ value: Array<{ id: string; displayName: string; [key: string]: unknown }> }>(`/workspaces/${wsId}/lakehouses`);
                const matches = (data.value || []).filter(
                    (lh) => lh.displayName?.toLowerCase().includes(name.toLowerCase())
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                searchTerm: name,
                                matchCount: matches.length,
                                lakehouses: matches,
                            }, null, 2),
                        },
                    ],
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
