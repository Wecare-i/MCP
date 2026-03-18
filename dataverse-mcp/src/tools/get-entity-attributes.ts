/**
 * Tool: get_entity_attributes
 * Lấy danh sách columns (attributes) của 1 entity Dataverse.
 *
 * Fix: Không dùng MaxLength/MinValue/MaxValue/Precision trong $select
 * vì đây là subtype-only properties (StringAttributeMetadata, etc.)
 * và gây lỗi 0x80060888 trên base AttributeMetadata endpoint.
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type {
    AttributeMetadata,
    ODataResponse,
    ToolResult,
} from "../types/dataverse.js";

// ─── Suspect Keywords ────────────────────────────────────────────────────────
// Cột có tên chứa các từ này → gợi ý cột WIP, test, hoặc deprecated
const SUSPECT_KEYWORDS = [
    "draft", "dev", "develop", "wip", "sandbox",
    "test", "testing", "trial", "dummy", "mock", "fake", "sample",
    "debug", "check", "checking", "verify", "verification", "inspect",
    "temp", "tmp", "temporary", "placeholder", "interim",
    "old", "bak", "backup", "archive", "archived", "deprecated",
    "legacy", "unused", "obsolete", "retired",
    "v1", "v2", "v3", "copy", "copy2", "new2", "new_",
    "tamnhap", "nhap", "tamthoi", "cu", "moi_",
];

export const definition = {
    name: "get_entity_attributes",
    description:
        "Lấy danh sách tất cả columns (attributes) của một table Dataverse, bao gồm LogicalName, Type, RequiredLevel. Dùng để hiểu cấu trúc dữ liệu của table.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description: "Logical name của entity (ví dụ: account, contact)",
            },
            filter: {
                type: "string",
                description:
                    "OData $filter (tuỳ chọn). Ví dụ: IsCustomAttribute eq true",
            },
            customOnly: {
                type: "boolean",
                description:
                    "Chỉ lấy custom attributes (mặc định: false). Set true để chỉ lấy columns do user tạo.",
            },
            suspectOnly: {
                type: "boolean",
                description:
                    "Chỉ trả columns có tên chứa suspect keywords (test/dev/old/temp/draft...). Dùng để scan columns cần cleanup.",
            },
        },
        required: ["entityName"],
    },
};

export async function handler(
    args: { entityName: string; filter?: string; customOnly?: boolean; suspectOnly?: boolean },
    client: DataverseClient
): Promise<ToolResult> {
    // Build $select — CHỈ dùng base AttributeMetadata properties
    let path = `/EntityDefinitions(LogicalName='${args.entityName}')/Attributes?$select=LogicalName,DisplayName,AttributeType,AttributeTypeName,RequiredLevel,IsPrimaryId,IsPrimaryName,IsCustomAttribute,IsValidForCreate,IsValidForUpdate,IsValidForRead`;

    // Build $filter
    const filters: string[] = [];
    if (args.customOnly) {
        filters.push("IsCustomAttribute eq true");
    }
    if (args.filter) {
        filters.push(args.filter);
    }
    if (filters.length > 0) {
        path += `&$filter=${encodeURIComponent(filters.join(" and "))}`;
    }

    const data = await client.get<ODataResponse<AttributeMetadata>>(path);

    const attributes = data.value.map((a) => {
        const logicalName = a.LogicalName;
        const isSuspect = SUSPECT_KEYWORDS.some((kw) =>
            logicalName.toLowerCase().includes(kw)
        );

        return {
            logicalName,
            displayName: a.DisplayName?.UserLocalizedLabel?.Label || logicalName,
            type: a.AttributeTypeName?.Value || a.AttributeType,
            requiredLevel: a.RequiredLevel?.Value,
            isPrimaryId: a.IsPrimaryId,
            isPrimaryName: a.IsPrimaryName,
            isCustom: a.IsCustomAttribute,
            isValidForCreate: a.IsValidForCreate,
            isValidForUpdate: a.IsValidForUpdate,
            isSuspect,
        };
    });

    // Filter suspect nếu cần
    const filtered = args.suspectOnly
        ? attributes.filter((a) => a.isSuspect)
        : attributes;

    // Summary
    const suspectColumns = attributes.filter((a) => a.isSuspect);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entity: args.entityName,
                        totalAttributes: filtered.length,
                        ...(suspectColumns.length > 0 && !args.suspectOnly
                            ? {
                                  suspectCount: suspectColumns.length,
                                  suspectNames: suspectColumns.map((s) => s.logicalName),
                              }
                            : {}),
                        attributes: filtered,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
