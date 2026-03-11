/**
 * Analysis Tools - Thống kê cột, tổng quan table
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FabricClient } from "../services/fabricClient.js";
import {
    GetColumnStatsInputSchema,
    GetTableSummaryInputSchema,
} from "../schemas/analysisSchemas.js";
import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Đăng ký tất cả analysis tools vào MCP server
 */
export function registerAnalysisTools(
    server: McpServer,
    getClient: () => FabricClient
): void {
    // ─── fabric_get_column_stats ──────────────────────────────
    server.registerTool(
        "fabric_get_column_stats",
        {
            title: "Thống kê Column",
            description: `Lấy thống kê chi tiết của một column trong table:
- Tổng số rows, số NULL, số giá trị distinct
- Giá trị MIN, MAX
Hữu ích để hiểu phân bố dữ liệu, kiểm tra data quality.

Ví dụ: table_name = "orders", column_name = "total_amount"`,
            inputSchema: GetColumnStatsInputSchema.shape,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (params) => {
            try {
                const client = getClient();

                // Lấy thống kê column
                const stats = await client.getColumnStats(
                    params.table_name,
                    params.column_name,
                    params.schema_name,
                    params.sql_endpoint,
                    params.database
                );

                const result = {
                    table: `${params.schema_name}.${params.table_name}`,
                    column: params.column_name,
                    statistics: stats,
                };

                const text = JSON.stringify(result, null, 2).slice(0, CHARACTER_LIMIT);
                return { content: [{ type: "text", text }] };
            } catch (error) {
                return {
                    content: [{ type: "text", text: handleError(error) }],
                    isError: true,
                };
            }
        }
    );

    // ─── fabric_get_table_summary ─────────────────────────────
    server.registerTool(
        "fabric_get_table_summary",
        {
            title: "Tổng quan Table",
            description: `Xem tổng quan một table: số rows, số columns, cấu trúc columns, và 3 dòng dữ liệu mẫu.
Giúp nhanh chóng hiểu table chứa gì mà không cần gọi nhiều tools riêng lẻ.

Ví dụ: table_name = "users"`,
            inputSchema: GetTableSummaryInputSchema.shape,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (params) => {
            try {
                const client = getClient();

                // Lấy song song: schema, row count, sample data
                const [columns, rowCount, preview] = await Promise.all([
                    client.getTableSchema(params.table_name, params.schema_name, params.sql_endpoint, params.database),
                    client.getRowCount(params.table_name, params.schema_name, params.sql_endpoint, params.database),
                    client.previewTable(params.table_name, params.schema_name, 3, params.sql_endpoint, params.database),
                ]);

                const result = {
                    table: `${params.schema_name}.${params.table_name}`,
                    rowCount,
                    columnCount: columns.length,
                    columns: columns.map((c) => ({
                        name: c.name,
                        type: c.dataType,
                        nullable: c.isNullable,
                    })),
                    sampleData: preview.rows,
                };

                const text = JSON.stringify(result, null, 2).slice(0, CHARACTER_LIMIT);
                return { content: [{ type: "text", text }] };
            } catch (error) {
                return {
                    content: [{ type: "text", text: handleError(error) }],
                    isError: true,
                };
            }
        }
    );
}

function handleError(error: unknown): string {
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return `Error: ${String(error)}`;
}
