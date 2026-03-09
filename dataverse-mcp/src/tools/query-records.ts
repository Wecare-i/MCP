/**
 * Tool: query_records
 * Truy vấn dữ liệu từ Dataverse bằng OData filter
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "query_records",
    description:
        "Truy vấn dữ liệu thực tế từ Dataverse bằng OData. Hỗ trợ $filter, $select, $top, $orderby, $expand. Trả về danh sách records.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entitySetName: {
                type: "string",
                description:
                    "EntitySetName (plural form, ví dụ: accounts, contacts, cr_projects)",
            },
            select: {
                type: "string",
                description:
                    "Comma-separated OData $select columns (ví dụ: name,revenue,telephone1)",
            },
            filter: {
                type: "string",
                description:
                    "OData $filter string (ví dụ: revenue gt 1000000 and statecode eq 0)",
            },
            orderby: {
                type: "string",
                description: "OData $orderby (ví dụ: name asc, createdon desc)",
            },
            top: {
                type: "number",
                description: "Số lượng records tối đa trả về (mặc định 50, max 5000)",
            },
            expand: {
                type: "string",
                description:
                    "OData $expand cho navigation properties (ví dụ: primarycontactid($select=fullname))",
            },
        },
        required: ["entitySetName"],
    },
};

export async function handler(
    args: {
        entitySetName: string;
        select?: string;
        filter?: string;
        orderby?: string;
        top?: number;
        expand?: string;
    },
    client: DataverseClient
): Promise<ToolResult> {
    const params: string[] = [];

    if (args.select) params.push(`$select=${args.select}`);
    if (args.filter) params.push(`$filter=${encodeURIComponent(args.filter)}`);
    if (args.orderby) params.push(`$orderby=${encodeURIComponent(args.orderby)}`);
    if (args.expand) params.push(`$expand=${encodeURIComponent(args.expand)}`);

    const top = Math.min(args.top || 50, 5000);
    params.push(`$top=${top}`);
    params.push(`$count=true`);

    const query = params.length > 0 ? `?${params.join("&")}` : "";
    const data = await client.get<ODataResponse<Record<string, unknown>>>(
        `/${args.entitySetName}${query}`
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entitySet: args.entitySetName,
                        totalCount: data["@odata.count"] ?? data.value.length,
                        returnedCount: data.value.length,
                        records: data.value,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
