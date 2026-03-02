/**
 * Tool: update_record
 * Cập nhật bản ghi trong Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "update_record",
    description:
        "Cập nhật một bản ghi trong Dataverse. Cần cung cấp EntitySetName, ID record, và dữ liệu cần cập nhật. Chỉ update các fields được chỉ định, không ảnh hưởng fields khác.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entitySetName: {
                type: "string",
                description: "EntitySetName (plural form, ví dụ: accounts, contacts)",
            },
            id: {
                type: "string",
                description: "GUID của record cần cập nhật (ví dụ: 00000000-0000-0000-0000-000000000001)",
            },
            data: {
                type: "object",
                description:
                    'JSON object chứa các fields cần cập nhật. Ví dụ: {"revenue": 10000000, "telephone1": "0123456789"}',
                additionalProperties: true,
            },
        },
        required: ["entitySetName", "id", "data"],
    },
};

export async function handler(
    args: { entitySetName: string; id: string; data: Record<string, unknown> },
    client: DataverseClient
): Promise<ToolResult> {
    await client.patch(`/${args.entitySetName}(${args.id})`, args.data);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        entitySet: args.entitySetName,
                        recordId: args.id,
                        updatedFields: Object.keys(args.data),
                        message: "Record đã được cập nhật thành công.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
