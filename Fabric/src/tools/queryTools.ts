/**
 * Query Tools - Thực thi SQL query, đếm rows
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FabricClient } from "../services/fabricClient.js";
import {
    ExecuteQueryInputSchema,
    GetRowCountInputSchema,
} from "../schemas/querySchemas.js";
import { BLOCKED_SQL_KEYWORDS, CHARACTER_LIMIT } from "../constants.js";

/**
 * Đăng ký tất cả query tools vào MCP server
 */
export function registerQueryTools(
    server: McpServer,
    getClient: () => FabricClient
): void {
    // ─── fabric_execute_query ─────────────────────────────────
    server.registerTool(
        "fabric_execute_query",
        {
            title: "Thực thi SQL Query",
            description: `Thực thi câu lệnh SQL SELECT hoặc WITH trên Fabric Lakehouse.
Chỉ hỗ trợ đọc dữ liệu (read-only). Các lệnh INSERT, UPDATE, DELETE, DROP... bị chặn.
Tự động thêm TOP nếu query chưa có LIMIT/TOP để đảm bảo an toàn.

Ví dụ:
- "SELECT * FROM dbo.orders WHERE status = 'completed'"
- "SELECT TOP 100 name, email FROM dbo.users"
- "WITH cte AS (SELECT * FROM dbo.orders) SELECT * FROM cte"`,
            inputSchema: ExecuteQueryInputSchema.shape,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (params) => {
            try {
                // Validate: chỉ cho phép SELECT/WITH
                const validationError = validateReadOnlyQuery(params.sql);
                if (validationError) {
                    return {
                        content: [{ type: "text", text: validationError }],
                        isError: true,
                    };
                }

                // Thêm TOP nếu chưa có LIMIT/TOP
                let safeSql = params.sql.trim();
                if (!hasRowLimit(safeSql)) {
                    safeSql = addTopClause(safeSql, params.max_rows);
                }

                const client = getClient();
                const result = await client.executeQuery(safeSql, params.sql_endpoint, params.database);

                const output = {
                    sql: safeSql,
                    columns: result.columns,
                    rowCount: result.rowCount,
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

    // ─── fabric_get_row_count ─────────────────────────────────
    server.registerTool(
        "fabric_get_row_count",
        {
            title: "Đếm số Rows trong Table",
            description: `Đếm tổng số dòng dữ liệu trong một table.
Nhanh hơn SELECT COUNT(*) vì đã tối ưu sẵn.

Ví dụ: table_name = "orders"`,
            inputSchema: GetRowCountInputSchema.shape,
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
                const count = await client.getRowCount(
                    params.table_name,
                    params.schema_name,
                    params.sql_endpoint,
                    params.database
                );

                const result = {
                    table: `${params.schema_name}.${params.table_name}`,
                    rowCount: count,
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: handleError(error) }],
                    isError: true,
                };
            }
        }
    );
}

/**
 * Validate SQL chỉ cho phép SELECT/WITH (read-only)
 */
function validateReadOnlyQuery(sql: string): string | null {
    const trimmed = sql.trim().toUpperCase();

    // Phải bắt đầu bằng SELECT hoặc WITH
    if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
        return "Error: Chỉ cho phép câu lệnh SELECT hoặc WITH. Không được dùng INSERT, UPDATE, DELETE, DROP...";
    }

    // Kiểm tra các keyword bị chặn
    for (const keyword of BLOCKED_SQL_KEYWORDS) {
        // Tìm keyword ở đầu statement (sau semicolon) hoặc đứng một mình
        const regex = new RegExp(`(?:^|;)\\s*${keyword}\\b`, "i");
        if (
            regex.test(sql) &&
            keyword !== "EXEC" &&
            keyword !== "EXECUTE"
        ) {
            // Cho phép SELECT có chứa các từ này trong WHERE/column names
            if (keyword !== "INSERT" && keyword !== "UPDATE" && keyword !== "DELETE" &&
                keyword !== "DROP" && keyword !== "ALTER" && keyword !== "CREATE" &&
                keyword !== "TRUNCATE" && keyword !== "MERGE" && keyword !== "GRANT" &&
                keyword !== "REVOKE" && keyword !== "DENY") {
                continue;
            }
            return `Error: Lệnh '${keyword}' không được phép. Chỉ hỗ trợ SELECT/WITH (read-only).`;
        }
    }

    return null;
}

/**
 * Kiểm tra query đã có TOP hoặc LIMIT chưa
 */
function hasRowLimit(sql: string): boolean {
    const upper = sql.toUpperCase();
    return upper.includes("TOP") || upper.includes("LIMIT") || upper.includes("OFFSET");
}

/**
 * Thêm TOP clause vào SELECT query
 */
function addTopClause(sql: string, maxRows: number): string {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith("SELECT")) {
        // Thêm TOP sau SELECT
        return trimmed.replace(/^SELECT/i, `SELECT TOP (${maxRows})`);
    }

    return trimmed;
}

function handleError(error: unknown): string {
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return `Error: ${String(error)}`;
}
