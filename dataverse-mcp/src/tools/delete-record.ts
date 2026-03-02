/**
 * Tool: delete_record
 * Xóa một bản ghi bất kỳ trong Dataverse bằng EntitySetName + ID
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "delete_record",
    description:
        "⚠️ XÓA một bản ghi khỏi Dataverse (không thể hoàn tác). Cần cung cấp EntitySetName và GUID của record. Dùng để xóa các records như appmodulecomponents, savedqueries, v.v.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entitySetName: {
                type: "string",
                description:
                    "EntitySetName (plural form, ví dụ: accounts, appmodulecomponents, savedqueries)",
            },
            id: {
                type: "string",
                description:
                    "GUID của record cần xóa (ví dụ: 00000000-0000-0000-0000-000000000001)",
            },
        },
        required: ["entitySetName", "id"],
    },
};

export async function handler(
    args: { entitySetName: string; id: string },
    client: DataverseClient
): Promise<ToolResult> {
    await client.delete(`/${args.entitySetName}(${args.id})`);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        entitySet: args.entitySetName,
                        recordId: args.id,
                        message: "✅ Record đã được xóa thành công.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
