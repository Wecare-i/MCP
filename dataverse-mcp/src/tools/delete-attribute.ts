/**
 * Tool: delete_attribute
 * Xóa một custom column (attribute) khỏi Dataverse entity.
 *
 * ⚠️  HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC — toàn bộ dữ liệu trong cột sẽ mất.
 * Chỉ xóa được custom attributes (IsCustomAttribute = true).
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

interface AttributeMetadata {
    MetadataId: string;
    LogicalName: string;
    SchemaName: string;
    AttributeType: string;
    IsCustomAttribute: boolean;
    DisplayName?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
}

export const definition = {
    name: "delete_attribute",
    description:
        "⚠️ XÓA COLUMN khỏi Dataverse table (không thể hoàn tác). Chỉ xóa được custom attributes. Tự động kiểm tra IsCustomAttribute trước khi thực thi. Dùng khi cần drop column không còn sử dụng.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description:
                    "Logical name của entity chứa column cần xóa (ví dụ: ai_table, account)",
            },
            attributeName: {
                type: "string",
                description:
                    "Logical name của column cần xóa (ví dụ: ai_filter, cr_oldcolumn)",
            },
        },
        required: ["entityName", "attributeName"],
    },
};

export async function handler(
    args: { entityName: string; attributeName: string },
    client: DataverseClient
): Promise<ToolResult> {
    const { entityName, attributeName } = args;

    // 1. Lấy attribute metadata
    let attribute: AttributeMetadata;
    try {
        attribute = await client.get<AttributeMetadata>(
            `/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')?$select=MetadataId,LogicalName,SchemaName,AttributeType,IsCustomAttribute,DisplayName`
        );
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Column "${attributeName}" không tồn tại trong table "${entityName}". Kiểm tra lại tên.`,
                },
            ],
            isError: true,
        };
    }

    // 2. Kiểm tra IsCustomAttribute
    if (!attribute.IsCustomAttribute) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: false,
                            reason: "Không thể xóa system attribute.",
                            attribute: attributeName,
                            attributeType: attribute.AttributeType,
                            suggestion:
                                "Chỉ có thể xóa custom attributes (IsCustomAttribute = true). System attributes là một phần của Microsoft schema.",
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    // 3. Thực hiện xóa
    await client.delete(
        `/EntityDefinitions(LogicalName='${entityName}')/Attributes(${attribute.MetadataId})`
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        entity: entityName,
                        attribute: attributeName,
                        displayName:
                            attribute.DisplayName?.UserLocalizedLabel?.Label ??
                            attributeName,
                        attributeType: attribute.AttributeType,
                        metadataId: attribute.MetadataId,
                        message: `✅ Column "${attributeName}" đã được xóa vĩnh viễn khỏi table "${entityName}".`,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
