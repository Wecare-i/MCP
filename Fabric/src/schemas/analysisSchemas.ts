/**
 * Zod Schemas cho Analysis Tools
 * Mỗi schema có sql_endpoint + database optional để hỗ trợ multi-database.
 */

import { z } from "zod";

const sqlConnectionParams = {
    sql_endpoint: z.string().optional().describe("SQL Endpoint (bỏ trống = dùng mặc định từ .env)"),
    database: z.string().optional().describe("Database name (bỏ trống = dùng mặc định từ .env)"),
};

export const GetColumnStatsInputSchema = z.object({
    table_name: z
        .string()
        .min(1)
        .describe("Tên table chứa column cần thống kê"),
    column_name: z
        .string()
        .min(1)
        .describe("Tên column cần xem thống kê"),
    schema_name: z
        .string()
        .default("dbo")
        .describe("Tên schema chứa table (mặc định: 'dbo')"),
    ...sqlConnectionParams,
});

export const GetTableSummaryInputSchema = z.object({
    table_name: z
        .string()
        .min(1)
        .describe("Tên table cần xem tổng quan"),
    schema_name: z
        .string()
        .default("dbo")
        .describe("Tên schema chứa table (mặc định: 'dbo')"),
    ...sqlConnectionParams,
});
