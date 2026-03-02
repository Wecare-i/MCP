/**
 * Tool: list_entities
 * Liệt kê tất cả tables (entities) trong Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { EntityMetadata, ODataResponse, ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "list_entities",
    description:
        "Liệt kê tất cả tables (entities) trong Dataverse environment. Trả về LogicalName, DisplayName, EntitySetName. Dùng để khám phá cấu trúc dữ liệu.",
    inputSchema: {
        type: "object" as const,
        properties: {
            filter: {
                type: "string",
                description:
                    "OData $filter (tuỳ chọn). Ví dụ: IsCustomEntity eq true để chỉ lấy custom tables",
            },
        },
    },
};

export async function handler(
    args: { filter?: string },
    client: DataverseClient
): Promise<ToolResult> {
    let path =
        "/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,IsCustomEntity";

    if (args.filter) {
        path += `&$filter=${encodeURIComponent(args.filter)}`;
    }

    const data = await client.get<ODataResponse<EntityMetadata>>(path);

    const entities = data.value.map((e) => ({
        logicalName: e.LogicalName,
        displayName: e.DisplayName?.UserLocalizedLabel?.Label || e.LogicalName,
        entitySetName: e.EntitySetName,
        primaryIdAttribute: e.PrimaryIdAttribute,
        primaryNameAttribute: e.PrimaryNameAttribute,
    }));

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        totalCount: entities.length,
                        entities,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
