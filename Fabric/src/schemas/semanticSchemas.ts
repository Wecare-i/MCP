import { z } from "zod";

export const SemanticListModelsSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const SemanticGetModelSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    model_id: z.string().min(1).describe("ID của semantic model"),
});

export const SemanticExecuteDaxSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    model_id: z.string().min(1).describe("ID của semantic model (dataset)"),
    dax_query: z.string().min(1).describe("Câu lệnh DAX query. Ví dụ: EVALUATE TOPN(10, Sales)"),
});
