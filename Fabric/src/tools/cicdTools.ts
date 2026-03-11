/**
 * CI/CD Deployment Pipeline Tools
 *
 * Tools cho phép AI quản lý Fabric Deployment Pipelines (CI/CD).
 * Promote items giữa các stages: Development → Test → Production.
 * Sử dụng Fabric REST API (api.fabric.microsoft.com/v1).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FabricRestClient } from "../services/fabricRestClient.js";
import {
    CicdListPipelinesSchema,
    CicdGetPipelineSchema,
    CicdGetStagesSchema,
    CicdDeploySchema,
} from "../schemas/cicdSchemas.js";

type ClientGetter = () => FabricRestClient;

export function registerCicdTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Deployment Pipelines ───────────────────────
    server.tool(
        "cicd_list_pipelines",
        "Liệt kê tất cả Deployment Pipelines (CI/CD) mà Service Principal có quyền truy cập",
        CicdListPipelinesSchema.shape,
        async () => {
            try {
                const client = getClient();
                const data = await client.get("/deploymentPipelines");
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

    // ─── Get Deployment Pipeline ─────────────────────────
    server.tool(
        "cicd_get_pipeline",
        "Lấy thông tin chi tiết một Deployment Pipeline",
        CicdGetPipelineSchema.shape,
        async ({ pipeline_id }) => {
            try {
                const client = getClient();
                const data = await client.get(`/deploymentPipelines/${pipeline_id}`);
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

    // ─── Get Pipeline Stages ─────────────────────────────
    server.tool(
        "cicd_get_stages",
        "Liệt kê tất cả stages (Development, Test, Production) và items trong mỗi stage của Deployment Pipeline",
        CicdGetStagesSchema.shape,
        async ({ pipeline_id }) => {
            try {
                const client = getClient();
                const data = await client.get(`/deploymentPipelines/${pipeline_id}/stages`);
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

    // ─── Deploy (Promote) Items ──────────────────────────
    server.tool(
        "cicd_deploy",
        "Deploy (promote) items từ một stage sang stage khác trong Deployment Pipeline. ⚠️ Thao tác này sẽ thực sự deploy items trên Fabric.",
        CicdDeploySchema.shape,
        async ({ pipeline_id, source_stage_id, target_stage_id, items, note }) => {
            try {
                const client = getClient();
                const body: Record<string, unknown> = {
                    sourceStageId: source_stage_id,
                    targetStageId: target_stage_id,
                };
                if (items && items.length > 0) {
                    body.items = items;
                }
                if (note) {
                    body.note = note;
                }
                const data = await client.post(
                    `/deploymentPipelines/${pipeline_id}/deploy`,
                    body
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                message: "Deployment triggered successfully",
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
}
