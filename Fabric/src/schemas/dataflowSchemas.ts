import { z } from "zod";

export const DataflowListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const DataflowGetSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    dataflow_id: z.string().min(1).describe("ID của Dataflow Gen2"),
});

export const DataflowRunSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    dataflow_id: z.string().min(1).describe("ID của Dataflow Gen2 cần chạy"),
});

export const DataflowGetStatusSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    dataflow_id: z.string().min(1).describe("ID của Dataflow Gen2"),
});

export const DataflowFindByNameSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    name: z.string().min(1).describe("Tên dataflow cần tìm (không phân biệt hoa thường)"),
});
