/**
 * Zod Schemas cho Query Tools
 */

import { z } from "zod";

export const ExecuteQueryInputSchema = z.object({
    sql: z
        .string()
        .min(1)
        .describe(
            "Câu lệnh SQL SELECT hoặc WITH để thực thi. Chỉ hỗ trợ đọc dữ liệu, không cho phép INSERT/UPDATE/DELETE/DROP."
        ),
    max_rows: z
        .number()
        .int()
        .min(1)
        .max(10000)
        .default(1000)
        .describe("Số dòng tối đa trả về (1-10000, mặc định: 1000)"),
});

export const GetRowCountInputSchema = z.object({
    table_name: z
        .string()
        .min(1)
        .describe("Tên table cần đếm số rows"),
    schema_name: z
        .string()
        .default("dbo")
        .describe("Tên schema chứa table (mặc định: 'dbo')"),
});
