/**
 * Zod Schemas cho Table Tools
 * Mỗi schema có sql_endpoint + database optional để hỗ trợ multi-database.
 */

import { z } from "zod";

const sqlConnectionParams = {
    sql_endpoint: z.string().optional().describe("SQL Endpoint (bỏ trống = dùng mặc định từ .env)"),
    database: z.string().optional().describe("Database name (bỏ trống = dùng mặc định từ .env)"),
};

export const ListTablesInputSchema = z.object({
    schema_filter: z
        .string()
        .optional()
        .describe(
            "Lọc theo schema name (ví dụ: 'dbo'). Bỏ trống để xem tất cả schemas."
        ),
    ...sqlConnectionParams,
});

export const GetTableSchemaInputSchema = z.object({
    table_name: z
        .string()
        .min(1)
        .describe("Tên table cần xem schema (ví dụ: 'users', 'orders')"),
    schema_name: z
        .string()
        .default("dbo")
        .describe("Tên schema chứa table (mặc định: 'dbo')"),
    ...sqlConnectionParams,
});

export const PreviewTableInputSchema = z.object({
    table_name: z
        .string()
        .min(1)
        .describe("Tên table cần preview dữ liệu"),
    schema_name: z
        .string()
        .default("dbo")
        .describe("Tên schema chứa table (mặc định: 'dbo')"),
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .describe("Số dòng cần lấy (1-100, mặc định: 10)"),
    ...sqlConnectionParams,
});

export const SearchTablesInputSchema = z.object({
    pattern: z
        .string()
        .min(1)
        .describe(
            "Pattern tìm kiếm tên table (ví dụ: 'order' sẽ tìm tất cả tables chứa 'order')"
        ),
    ...sqlConnectionParams,
});
