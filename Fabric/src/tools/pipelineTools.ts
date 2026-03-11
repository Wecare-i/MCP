/**
 * Data Pipeline Tools
 *
 * Tools cho phép AI quản lý và chạy Fabric Data Pipelines.
 * Sử dụng Fabric REST API (api.fabric.microsoft.com/v1).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FabricRestClient } from "../services/fabricRestClient.js";
import {
    PipelineListSchema,
    PipelineGetSchema,
    PipelineRunSchema,
    PipelineGetStatusSchema,
    PipelineFindByNameSchema,
} from "../schemas/pipelineSchemas.js";

type ClientGetter = () => FabricRestClient;

export function registerPipelineTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Pipelines ──────────────────────────────────
    server.tool(
        "pipeline_list",
        "Liệt kê tất cả Data Pipelines trong workspace",
        PipelineListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/dataPipelines`);
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

    // ─── Get Pipeline ────────────────────────────────────
    server.tool(
        "pipeline_get",
        "Lấy thông tin chi tiết một Data Pipeline",
        PipelineGetSchema.shape,
        async ({ workspace_id, pipeline_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(`/workspaces/${wsId}/dataPipelines/${pipeline_id}`);
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

    // ─── Run Pipeline ────────────────────────────────────
    server.tool(
        "pipeline_run",
        "Kích hoạt chạy (trigger) một Data Pipeline. ⚠️ Thao tác này sẽ thực sự chạy pipeline trên Fabric.",
        PipelineRunSchema.shape,
        async ({ workspace_id, pipeline_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.post(
                    `/workspaces/${wsId}/items/${pipeline_id}/jobs/instances?jobType=Pipeline`
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                message: "Pipeline run triggered successfully",
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

    // ─── Get Pipeline Run Status ─────────────────────────
    server.tool(
        "pipeline_get_status",
        "Xem trạng thái chạy (job instances) của một Data Pipeline",
        PipelineGetStatusSchema.shape,
        async ({ workspace_id, pipeline_id }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get(
                    `/workspaces/${wsId}/items/${pipeline_id}/jobs/instances`
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

    // ─── Find Pipeline by Name ───────────────────────────
    server.tool(
        "pipeline_find_by_name",
        "Tìm Data Pipeline theo tên (không phân biệt hoa thường). Trả về ID và thông tin pipeline khớp.",
        PipelineFindByNameSchema.shape,
        async ({ workspace_id, name }) => {
            try {
                const client = getClient();
                const wsId = workspace_id || client.getWorkspaceId();
                const data = await client.get<{ value: Array<{ id: string; displayName: string;[key: string]: unknown }> }>(`/workspaces/${wsId}/dataPipelines`);
                const matches = (data.value || []).filter(
                    (p) => p.displayName?.toLowerCase().includes(name.toLowerCase())
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                searchTerm: name,
                                matchCount: matches.length,
                                pipelines: matches,
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
