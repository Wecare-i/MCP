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

export const SemanticFindByNameSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    name: z.string().min(1).describe("Tên semantic model cần tìm (không phân biệt hoa thường)"),
});

export const SemanticRefreshModelSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    model_id: z.string().min(1).describe("ID của semantic model cần refresh"),
});
