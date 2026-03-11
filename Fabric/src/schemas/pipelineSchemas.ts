import { z } from "zod";

export const PipelineListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const PipelineGetSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    pipeline_id: z.string().min(1).describe("ID của Data Pipeline"),
});

export const PipelineRunSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    pipeline_id: z.string().min(1).describe("ID của Data Pipeline cần chạy"),
});

export const PipelineGetStatusSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    pipeline_id: z.string().min(1).describe("ID của Data Pipeline"),
});

export const PipelineFindByNameSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    name: z.string().min(1).describe("Tên pipeline cần tìm (không phân biệt hoa thường)"),
});
