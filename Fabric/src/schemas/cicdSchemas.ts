import { z } from "zod";

export const CicdListPipelinesSchema = z.object({});

export const CicdGetPipelineSchema = z.object({
    pipeline_id: z.string().min(1).describe("ID của Deployment Pipeline"),
});

export const CicdGetStagesSchema = z.object({
    pipeline_id: z.string().min(1).describe("ID của Deployment Pipeline"),
});

export const CicdDeploySchema = z.object({
    pipeline_id: z.string().min(1).describe("ID của Deployment Pipeline"),
    source_stage_id: z.string().min(1).describe("ID của stage nguồn (ví dụ: Development)"),
    target_stage_id: z.string().min(1).describe("ID của stage đích (ví dụ: Test hoặc Production)"),
    items: z.array(
        z.object({
            sourceItemId: z.string().min(1).describe("ID của item cần deploy"),
        })
    ).optional().describe("Danh sách items cần deploy. Bỏ trống = deploy tất cả items"),
    note: z.string().optional().describe("Ghi chú cho lần deploy này"),
});
