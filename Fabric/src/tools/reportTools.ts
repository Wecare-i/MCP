/**
 * Reports & Dashboards Tools
 *
 * Tools cho phép AI khám phá Reports và Dashboards trong Power BI / Fabric.
 * Sử dụng Power BI REST API.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PowerBIClient } from "../services/powerbiClient.js";
import {
    ReportListSchema,
    ReportGetSchema,
    ReportGetPagesSchema,
    DashboardListSchema,
    DashboardGetTilesSchema,
    ReportFindByNameSchema,
} from "../schemas/reportSchemas.js";

type ClientGetter = () => PowerBIClient;

export function registerReportTools(server: McpServer, getClient: ClientGetter) {
    // ─── List Reports ────────────────────────────────────
    server.tool(
        "reports_list",
        "Liệt kê tất cả Reports trong workspace",
        ReportListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/reports`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── Get Report ──────────────────────────────────────
    server.tool(
        "reports_get",
        "Lấy thông tin chi tiết một Report (tên, URL embed, dataset ID...)",
        ReportGetSchema.shape,
        async ({ workspace_id, report_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/reports/${report_id}`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── Get Report Pages ────────────────────────────────
    server.tool(
        "reports_get_pages",
        "Liệt kê tất cả pages (trang) trong một Report",
        ReportGetPagesSchema.shape,
        async ({ workspace_id, report_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/reports/${report_id}/pages`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── List Dashboards ─────────────────────────────────
    server.tool(
        "dashboards_list",
        "Liệt kê tất cả Dashboards trong workspace",
        DashboardListSchema.shape,
        async ({ workspace_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/dashboards`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── Get Dashboard Tiles ─────────────────────────────
    server.tool(
        "dashboards_get_tiles",
        "Liệt kê tất cả tiles (visual elements) trong một Dashboard",
        DashboardGetTilesSchema.shape,
        async ({ workspace_id, dashboard_id }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get(`/groups/${groupId}/dashboards/${dashboard_id}/tiles`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─── Find Report by Name ─────────────────────────────
    server.tool(
        "reports_find_by_name",
        "Tìm Report theo tên (không phân biệt hoa thường). Trả về ID và thông tin report khớp.",
        ReportFindByNameSchema.shape,
        async ({ workspace_id, name }) => {
            try {
                const client = getClient();
                const groupId = workspace_id || client.getGroupId();
                const data = await client.get<{ value: Array<{ id: string; name: string;[key: string]: unknown }> }>(`/groups/${groupId}/reports`);
                const matches = (data.value || []).filter(
                    (r) => r.name?.toLowerCase().includes(name.toLowerCase())
                );
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                searchTerm: name,
                                matchCount: matches.length,
                                reports: matches,
                            }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
