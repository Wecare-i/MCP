/**
 * Tool: get_entity_metadata
 * Lấy schema metadata chi tiết của 1 table Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "get_entity_metadata",
    description:
        "Lấy cấu trúc schema (metadata) chi tiết của một table Dataverse, bao gồm DisplayName, PrimaryKey, EntitySetName, Description. Dùng LogicalName (ví dụ: account, contact, cr_project).",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description:
                    "Logical name của entity (ví dụ: account, contact, cr_project)",
            },
        },
        required: ["entityName"],
    },
};

export async function handler(
    args: { entityName: string },
    client: DataverseClient
): Promise<ToolResult> {
    const data = await client.get(
        `/EntityDefinitions(LogicalName='${args.entityName}')?$select=LogicalName,SchemaName,DisplayName,DisplayCollectionName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,Description,IsCustomEntity,IsManaged,ObjectTypeCode,OwnershipType`
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}
