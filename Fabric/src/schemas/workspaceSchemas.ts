import { z } from "zod";

export const WorkspaceListSchema = z.object({});

export const WorkspaceGetSchema = z.object({
    workspace_id: z.string().optional().describe("ID cụ thể của workspace. Nếu bỏ trống sẽ dùng workspace mặc định từ .env"),
});

export const WorkspaceListItemsSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
    type: z.string().optional().describe("Lọc theo loại item: Lakehouse, Notebook, SemanticModel, Report, Dataflow, etc."),
});

export const WorkspaceFindByNameSchema = z.object({
    name: z.string().min(1).describe("Tên workspace cần tìm (tìm kiếm không phân biệt hoa thường, chứa từ khóa)"),
});
