/**
 * Tool: delete_attribute
 * Xóa một custom column (attribute) khỏi Dataverse entity.
 *
 * ⚠️  HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC — toàn bộ dữ liệu trong cột sẽ mất.
 * Chỉ xóa được custom attributes (IsCustomAttribute = true).
 *
 * Flow:
 * 1. Lấy attribute metadata + kiểm tra IsCustomAttribute
 * 2. Auto-resolve blocking dependencies (Views, Forms, Workflows...)
 * 3. PublishXml để refresh dependency graph
 * 4. Xóa column
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";
import { resolveBlockingDeps } from "./dependency-resolver.js";

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
        "⚠️ XÓA COLUMN khỏi Dataverse table (không thể hoàn tác). Tự động gỡ blocking dependencies (xóa column khỏi Views/Forms, deactivate+xóa Workflows) trước khi xóa. Nếu có dependency không thể auto-resolve (Canvas App, Plugin) sẽ báo lỗi và yêu cầu xử lý thủ công.",
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

    // 3. Auto-resolve blocking dependencies
    const resolveResult = await resolveBlockingDeps(
        client,
        attribute.MetadataId,
        2, // ComponentType = 2 (Attribute)
        {
            deleteContainers: false, // Xóa column → chỉ xóa field khỏi view/form, KHÔNG xóa view/form
            attributeName,
            entityName,
        }
    );

    // Nếu có manual deps → warning nhưng VẪN tiếp tục xóa
    // (Canvas App, Plugin không thể auto-resolve nhưng không block)

    // Nếu có lỗi trong auto-resolve → báo lỗi (không thể an toàn xóa)
    if (resolveResult.errors.length > 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: false,
                            entity: entityName,
                            attribute: attributeName,
                            reason: "Một số dependencies không thể tự động gỡ do lỗi.",
                            resolveErrors: resolveResult.errors,
                            partiallyResolved: resolveResult.resolved,
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    // 4. Nếu đã resolve dependencies → publish để refresh dependency graph
    if (resolveResult.resolved.length > 0) {
        try {
            const entitiesXml = `<importexportxml><entities><entity>${entityName}</entity></entities></importexportxml>`;
            await client.post("/PublishXml", { ParameterXml: entitiesXml });
        } catch {
            // Publish thất bại không block xóa — tiếp tục
        }
    }

    // 5. Xóa column
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
                        autoResolved: resolveResult.resolved,
                        manualWarnings: resolveResult.hasManualDeps
                            ? {
                                note: "⚠️ Các dependencies sau cần xử lý thủ công (không ảnh hưởng đến việc xóa column):",
                                items: resolveResult.manualDeps,
                            }
                            : undefined,
                        message: `✅ Column "${attributeName}" đã được xóa khỏi table "${entityName}".${resolveResult.resolved.length > 0
                                ? ` Đã tự động gỡ ${resolveResult.resolved.length} dependency.`
                                : ""
                            }${resolveResult.hasManualDeps
                                ? ` ⚠️ Còn ${resolveResult.manualDeps.length} dependency cần xử lý thủ công (xem manualWarnings).`
                                : ""
                            }`,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
