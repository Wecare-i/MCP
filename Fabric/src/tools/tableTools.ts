/**
 * Table Tools - Liệt kê, xem schema, preview, tìm kiếm tables
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FabricClient } from "../services/fabricClient.js";
import {
    ListTablesInputSchema,
    GetTableSchemaInputSchema,
    PreviewTableInputSchema,
    SearchTablesInputSchema,
} from "../schemas/tableSchemas.js";
import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Đăng ký tất cả table tools vào MCP server
 */
export function registerTableTools(
    server: McpServer,
    getClient: () => FabricClient
): void {
    // ─── fabric_list_tables ───────────────────────────────────
    server.registerTool(
        "fabric_list_tables",
        {
            title: "Liệt kê Tables trong Lakehouse",
            description: `Liệt kê tất cả tables và views trong Fabric Lakehouse database.
Trả về danh sách với tên, schema, loại (TABLE/VIEW).
Dùng schema_filter để lọc theo schema cụ thể.

Ví dụ:
- Liệt kê toàn bộ tables: không cần tham số
- Lọc tables trong schema dbo: schema_filter = "dbo"`,
            inputSchema: ListTablesInputSchema.shape,
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
                let tables = await client.getTables(params.sql_endpoint, params.database);

                if (params.schema_filter) {
                    tables = tables.filter(
                        (t) =>
                            t.schema.toLowerCase() === params.schema_filter!.toLowerCase()
                    );
                }

                const result = {
                    totalTables: tables.length,
                    tables: tables.map((t) => ({
                        fullName: t.fullName,
                        schema: t.schema,
                        name: t.name,
                        type: t.type,
                    })),
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

    // ─── fabric_get_table_schema ──────────────────────────────
    server.registerTool(
        "fabric_get_table_schema",
        {
            title: "Xem Schema của Table",
            description: `Xem chi tiết cấu trúc (schema) của một table: tên cột, kiểu dữ liệu, nullable, precision.
Dùng để hiểu cấu trúc dữ liệu trước khi query.

Ví dụ: table_name = "users", schema_name = "dbo"`,
            inputSchema: GetTableSchemaInputSchema.shape,
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
                const columns = await client.getTableSchema(
                    params.table_name,
                    params.schema_name,
                    params.sql_endpoint,
                    params.database
                );

                if (columns.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Không tìm thấy table '${params.schema_name}.${params.table_name}'. Hãy dùng fabric_list_tables để xem danh sách tables.`,
                            },
                        ],
                    };
                }

                const result = {
                    table: `${params.schema_name}.${params.table_name}`,
                    columnCount: columns.length,
                    columns: columns.map((c) => ({
                        name: c.name,
                        type: c.dataType,
                        nullable: c.isNullable,
                        maxLength: c.maxLength,
                        precision: c.precision,
                        scale: c.scale,
                    })),
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

    // ─── fabric_preview_table ─────────────────────────────────
    server.registerTool(
        "fabric_preview_table",
        {
            title: "Preview Dữ liệu Table",
            description: `Xem dữ liệu mẫu (SELECT TOP N) từ một table trong Lakehouse.
Hữu ích để hiểu nội dung dữ liệu thực tế trước khi viết query phức tạp.

Ví dụ: table_name = "orders", limit = 5`,
            inputSchema: PreviewTableInputSchema.shape,
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
                const result = await client.previewTable(
                    params.table_name,
                    params.schema_name,
                    params.limit,
                    params.sql_endpoint,
                    params.database
                );

                const output = {
                    table: `${params.schema_name}.${params.table_name}`,
                    rowsReturned: result.rowCount,
                    columns: result.columns,
                    data: result.rows,
                    executionTimeMs: result.executionTimeMs,
                };

                const text = JSON.stringify(output, null, 2).slice(0, CHARACTER_LIMIT);
                return { content: [{ type: "text", text }] };
            } catch (error) {
                return {
                    content: [{ type: "text", text: handleError(error) }],
                    isError: true,
                };
            }
        }
    );

    // ─── fabric_search_tables ─────────────────────────────────
    server.registerTool(
        "fabric_search_tables",
        {
            title: "Tìm kiếm Tables",
            description: `Tìm kiếm tables theo tên (pattern matching, LIKE).
Ví dụ: pattern = "order" sẽ tìm tất cả tables có chứa "order" trong tên.`,
            inputSchema: SearchTablesInputSchema.shape,
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
                const tables = await client.searchTables(params.pattern, params.sql_endpoint, params.database);

                if (tables.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Không tìm thấy table nào khớp với '${params.pattern}'.`,
                            },
                        ],
                    };
                }

                const result = {
                    pattern: params.pattern,
                    matchCount: tables.length,
                    tables: tables.map((t) => ({
                        fullName: t.fullName,
                        type: t.type,
                    })),
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
