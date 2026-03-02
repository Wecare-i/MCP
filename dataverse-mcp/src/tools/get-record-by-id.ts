/**
 * Tool: get_record_by_id
 * Lấy 1 record cụ thể từ Dataverse theo GUID
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "get_record_by_id",
    description:
        "Lấy 1 record cụ thể từ Dataverse bằng GUID. Hỗ trợ $select và $expand để chọn columns và expand navigation properties.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entitySetName: {
                type: "string",
                description:
                    "EntitySetName (plural form, ví dụ: accounts, contacts, cr_projects)",
            },
            id: {
                type: "string",
                description:
                    "GUID của record (ví dụ: 00000000-0000-0000-0000-000000000001)",
            },
            select: {
                type: "string",
                description:
                    "Comma-separated OData $select columns (ví dụ: name,revenue,telephone1)",
            },
            expand: {
                type: "string",
                description:
                    "OData $expand cho navigation properties (ví dụ: primarycontactid($select=fullname))",
            },
        },
        required: ["entitySetName", "id"],
    },
};

export async function handler(
    args: {
        entitySetName: string;
        id: string;
        select?: string;
        expand?: string;
    },
    client: DataverseClient
): Promise<ToolResult> {
    const params: string[] = [];

    if (args.select) params.push(`$select=${args.select}`);
    if (args.expand) params.push(`$expand=${args.expand}`);

    const query = params.length > 0 ? `?${params.join("&")}` : "";
    const data = await client.get<Record<string, unknown>>(
        `/${args.entitySetName}(${args.id})${query}`
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entitySet: args.entitySetName,
                        id: args.id,
                        record: data,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
