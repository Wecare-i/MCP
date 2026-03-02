/**
 * Tool: create_record
 * Tạo bản ghi mới trong Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "create_record",
    description:
        "Tạo một bản ghi mới trong Dataverse. Cần cung cấp EntitySetName (ví dụ: accounts) và dữ liệu JSON của record. Trả về ID của record vừa tạo.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entitySetName: {
                type: "string",
                description:
                    "EntitySetName (plural form, ví dụ: accounts, contacts, cr_projects)",
            },
            data: {
                type: "object",
                description:
                    'JSON object chứa dữ liệu record. Ví dụ: {"name": "Contoso", "revenue": 5000000}',
                additionalProperties: true,
            },
        },
        required: ["entitySetName", "data"],
    },
};

export async function handler(
    args: { entitySetName: string; data: Record<string, unknown> },
    client: DataverseClient
): Promise<ToolResult> {
    const result = await client.post<{ entityId?: string }>(
        `/${args.entitySetName}`,
        args.data
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        entitySet: args.entitySetName,
                        entityId: result.entityId || "Created (ID in OData-EntityId header)",
                        message: "Record đã được tạo thành công.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
