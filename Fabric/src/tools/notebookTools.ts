/**
 * Notebooks & Spark Tools
 *
 * Tools cho phép AI quản lý và chạy Fabric Notebooks.
 * Sử dụng Fabric REST API.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FabricRestClient } from "../services/fabricRestClient.js";
import {
    NotebookListSchema,
    NotebookGetSchema,
    NotebookRunSchema,
    NotebookGetStatusSchema,
} from "../schemas/notebookSchemas.js";

type ClientGetter = () => FabricRestClient;

export function registerNotebookTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Notebooks ──────────────────────────────────
    server.tool(
        "notebook_list",
        "Liệt kê tất cả Notebooks trong workspace",
        NotebookListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/notebooks`);
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

    // ─── Get Notebook ────────────────────────────────────
    server.tool(
        "notebook_get",
        "Lấy thông tin chi tiết một Notebook",
        NotebookGetSchema.shape,
        async ({ workspace_id, notebook_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/notebooks/${notebook_id}`);
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

    // ─── Run Notebook ────────────────────────────────────
    server.tool(
        "notebook_run",
        "Kích hoạt chạy (execute) một Notebook trên Spark. ⚠️ Thao tác này sẽ thực sự chạy notebook trên Fabric Spark compute.",
        NotebookRunSchema.shape,
        async ({ workspace_id, notebook_id, parameters }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const body: Record<string, unknown> = {};
                if (parameters && Object.keys(parameters).length > 0) {
                    body.executionData = { parameters };
                }
                const data = await client.post(
                    `/workspaces/${wsId}/items/${notebook_id}/jobs/instances?jobType=RunNotebook`,
                    Object.keys(body).length > 0 ? body : undefined
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                message: "Notebook run triggered successfully",
                                response: data,
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

    // ─── Get Notebook Run Status ─────────────────────────
    server.tool(
        "notebook_get_status",
        "Xem trạng thái chạy (job instances) của một Notebook",
        NotebookGetStatusSchema.shape,
        async ({ workspace_id, notebook_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(
                    `/workspaces/${wsId}/items/${notebook_id}/jobs/instances`
                );
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
}
