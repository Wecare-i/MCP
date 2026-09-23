import { z } from "zod";

export const DataflowGen1ListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const DataflowGen1GetDefinitionSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    dataflow_id: z.string().min(1).describe("ID của Dataflow Gen1 (objectId trong kết quả dataflow_gen1_list)"),
    query_name: z.string().optional().describe("Tên query cần lấy M code (không phân biệt hoa thường). Bỏ trống = lấy tất cả query"),
    include_raw: z.boolean().optional().describe("true = trả thêm nguyên file model.json (entities, cột, annotations)"),
});
