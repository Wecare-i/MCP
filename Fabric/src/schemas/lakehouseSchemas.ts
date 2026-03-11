/**
 * Zod Schemas cho Lakehouse Management Tools
 */

import { z } from "zod";

export const LakehouseListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const LakehouseSwitchSchema = z.object({
    sql_endpoint: z.string().min(1).describe("SQL Endpoint mới (ví dụ: my-endpoint.datawarehouse.fabric.microsoft.com)"),
    database: z.string().min(1).describe("Database name mới"),
});

export const LakehouseFindByNameSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    name: z.string().min(1).describe("Tên Lakehouse cần tìm (không phân biệt hoa thường)"),
});
