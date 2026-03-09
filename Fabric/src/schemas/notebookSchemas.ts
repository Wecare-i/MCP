import { z } from "zod";

export const NotebookListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const NotebookGetSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    notebook_id: z.string().min(1).describe("ID của notebook"),
});

export const NotebookRunSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    notebook_id: z.string().min(1).describe("ID của notebook cần chạy"),
    parameters: z.record(z.string()).optional().describe("Parameters truyền vào notebook (key-value)"),
});

export const NotebookGetStatusSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    notebook_id: z.string().min(1).describe("ID của notebook"),
});
