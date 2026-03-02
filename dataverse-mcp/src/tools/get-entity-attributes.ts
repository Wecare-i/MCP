/**
 * Tool: get_entity_attributes
 * Lấy danh sách columns (attributes) của 1 entity
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type {
    AttributeMetadata,
    ODataResponse,
    ToolResult,
} from "../types/dataverse.js";

export const definition = {
    name: "get_entity_attributes",
    description:
        "Lấy danh sách tất cả columns (attributes) của một table Dataverse, bao gồm LogicalName, Type, RequiredLevel, MaxLength. Dùng để hiểu cấu trúc dữ liệu của table.",
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
        },
        required: ["entityName"],
    },
};

export async function handler(
    args: { entityName: string; filter?: string },
    client: DataverseClient
): Promise<ToolResult> {
    let path = `/EntityDefinitions(LogicalName='${args.entityName}')/Attributes?$select=LogicalName,DisplayName,AttributeType,AttributeTypeName,RequiredLevel,MaxLength,MinValue,MaxValue,Precision,IsPrimaryId,IsPrimaryName,IsValidForCreate,IsValidForUpdate,IsValidForRead`;

    if (args.filter) {
        path += `&$filter=${encodeURIComponent(args.filter)}`;
    }

    const data = await client.get<ODataResponse<AttributeMetadata>>(path);

    const attributes = data.value.map((a) => ({
        logicalName: a.LogicalName,
        displayName: a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName,
        type: a.AttributeTypeName?.Value || a.AttributeType,
        requiredLevel: a.RequiredLevel?.Value,
        isPrimaryId: a.IsPrimaryId,
        isPrimaryName: a.IsPrimaryName,
        isValidForCreate: a.IsValidForCreate,
        isValidForUpdate: a.IsValidForUpdate,
        maxLength: a.MaxLength,
    }));

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entity: args.entityName,
                        totalAttributes: attributes.length,
                        attributes,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
