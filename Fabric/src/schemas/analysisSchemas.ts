/**
 * Zod Schemas cho Analysis Tools
 */

import { z } from "zod";

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
});
