/**
 * Semantic Model Tools
 *
 * Tools cho phép AI truy vấn và khám phá Semantic Models (Power BI datasets).
 * Sử dụng Power BI REST API + DAX query execution.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PowerBIClient } from "../services/powerbiClient.js";
import {
    SemanticListModelsSchema,
    SemanticGetModelSchema,
    SemanticExecuteDaxSchema,
} from "../schemas/semanticSchemas.js";

type ClientGetter = () => PowerBIClient;

export function registerSemanticTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Semantic Models ────────────────────────────
    server.tool(
        "semantic_list_models",
        "Liệt kê tất cả Semantic Models (datasets) trong workspace",
        SemanticListModelsSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/datasets`);
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

    // ─── Get Semantic Model ──────────────────────────────
    server.tool(
        "semantic_get_model",
        "Lấy thông tin chi tiết một Semantic Model",
        SemanticGetModelSchema.shape,
        async ({ workspace_id, model_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/datasets/${model_id}`);
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

    // ─── Execute DAX Query ───────────────────────────────
    server.tool(
        "semantic_execute_dax",
        "Thực thi câu lệnh DAX query trên Semantic Model. Dùng để truy vấn dữ liệu đã được mô hình hóa. Ví dụ: EVALUATE TOPN(10, Sales)",
        SemanticExecuteDaxSchema.shape,
        async ({ workspace_id, model_id, dax_query }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.post(
                    `/groups/${groupId}/datasets/${model_id}/executeQueries`,
                    {
                        queries: [{ query: dax_query }],
                        serializerSettings: { includeNulls: true },
                    }
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
