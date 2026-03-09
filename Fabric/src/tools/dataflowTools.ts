/**
 * Dataflow Gen2 Tools
 *
 * Tools cho phép AI quản lý và chạy Dataflow Gen2.
 * Sử dụng Fabric REST API.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FabricRestClient } from "../services/fabricRestClient.js";
import {
    DataflowListSchema,
    DataflowGetSchema,
    DataflowRunSchema,
    DataflowGetStatusSchema,
} from "../schemas/dataflowSchemas.js";

type ClientGetter = () => FabricRestClient;

export function registerDataflowTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Dataflows ──────────────────────────────────
    server.tool(
        "dataflow_list",
        "Liệt kê tất cả Dataflow Gen2 trong workspace",
        DataflowListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/dataflows`);
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

    // ─── Get Dataflow ────────────────────────────────────
    server.tool(
        "dataflow_get",
        "Lấy thông tin chi tiết một Dataflow Gen2",
        DataflowGetSchema.shape,
        async ({ workspace_id, dataflow_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/dataflows/${dataflow_id}`);
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

    // ─── Run Dataflow ────────────────────────────────────
    server.tool(
        "dataflow_run",
        "Kích hoạt chạy (trigger refresh) một Dataflow Gen2. ⚠️ Thao tác này sẽ thực sự chạy dataflow trên Fabric capacity.",
        DataflowRunSchema.shape,
        async ({ workspace_id, dataflow_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.post(
                    `/workspaces/${wsId}/items/${dataflow_id}/jobs/instances?jobType=DefaultJob`
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                message: "Dataflow run triggered successfully",
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

    // ─── Get Dataflow Run Status ─────────────────────────
    server.tool(
        "dataflow_get_status",
        "Xem trạng thái chạy (job instances) của một Dataflow Gen2",
        DataflowGetStatusSchema.shape,
        async ({ workspace_id, dataflow_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(
                    `/workspaces/${wsId}/items/${dataflow_id}/jobs/instances`
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
