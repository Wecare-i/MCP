/**
 * Zod Schemas cho Table Tools
 */

import { z } from "zod";

export const ListTablesInputSchema = z.object({
    schema_filter: z
        .string()
        .optional()
        .describe(
            "Lọc theo schema name (ví dụ: 'dbo'). Bỏ trống để xem tất cả schemas."
        ),
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
});

export const SearchTablesInputSchema = z.object({
    pattern: z
        .string()
        .min(1)
        .describe(
            "Pattern tìm kiếm tên table (ví dụ: 'order' sẽ tìm tất cả tables chứa 'order')"
        ),
});
