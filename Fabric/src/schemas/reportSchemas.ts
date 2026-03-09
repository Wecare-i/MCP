import { z } from "zod";

export const ReportListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID. Bỏ trống = dùng mặc định"),
});

export const ReportGetSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    report_id: z.string().min(1).describe("ID của report"),
});

export const ReportGetPagesSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    report_id: z.string().min(1).describe("ID của report"),
});

export const DashboardListSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
});

export const DashboardGetTilesSchema = z.object({
    workspace_id: z.string().optional().describe("Workspace ID"),
    dashboard_id: z.string().min(1).describe("ID của dashboard"),
});
