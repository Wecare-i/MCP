/**
 * Workspace Management Tools
 *
 * Tools cho phép AI quản lý và khám phá Fabric Workspaces.
 * Sử dụng Fabric REST API (api.fabric.microsoft.com/v1).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FabricRestClient } from "../services/fabricRestClient.js";
import {
    WorkspaceListSchema,
    WorkspaceGetSchema,
    WorkspaceListItemsSchema,
} from "../schemas/workspaceSchemas.js";

type ClientGetter = () => FabricRestClient;

export function registerWorkspaceTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Workspaces ─────────────────────────────────
    server.tool(
        "workspace_list",
        "Liệt kê tất cả workspaces mà Service Principal có quyền truy cập",
        WorkspaceListSchema.shape,
        async () => {
            try {
                const client = getClient();
                const data = await client.get<{ value: unknown[] }>("/workspaces");
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─── Get Workspace ───────────────────────────────────
    server.tool(
        "workspace_get",
        "Lấy thông tin chi tiết một workspace",
        WorkspaceGetSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}`);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─── List Items in Workspace ─────────────────────────
    server.tool(
        "workspace_list_items",
        "Liệt kê tất cả items (Lakehouse, Notebook, Report, SemanticModel, Dataflow...) trong một workspace. Có thể lọc theo type.",
        WorkspaceListItemsSchema.shape,
        async ({ workspace_id, type }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                let path = `/workspaces/${wsId}/items`;
                if (type) {
                    path += `?type=${encodeURIComponent(type)}`;
                }
                const data = await client.get(path);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}
