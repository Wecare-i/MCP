/**
 * Tool: get_relationships
 * Lấy danh sách relationships (1:N, N:1, N:N) của 1 entity Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

interface RelationshipMetadata {
    SchemaName: string;
    ReferencingEntity?: string;
    ReferencingAttribute?: string;
    ReferencedEntity?: string;
    ReferencedAttribute?: string;
    Entity1LogicalName?: string;
    Entity2LogicalName?: string;
    IntersectEntityName?: string;
    RelationshipType?: string;
}

export const definition = {
    name: "get_relationships",
    description:
        "Lấy danh sách relationships (OneToMany, ManyToOne, ManyToMany) của 1 entity Dataverse. Giúp hiểu cấu trúc liên kết giữa các tables.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description:
                    "Logical name của entity (ví dụ: account, contact, cr_project)",
            },
            relationshipType: {
                type: "string",
                enum: ["oneToMany", "manyToOne", "manyToMany", "all"],
                description:
                    "Loại relationship cần lấy. Mặc định: all (lấy tất cả)",
            },
        },
        required: ["entityName"],
    },
};

export async function handler(
    args: {
        entityName: string;
        relationshipType?: string;
    },
    client: DataverseClient
): Promise<ToolResult> {
    const type = args.relationshipType || "all";
    const basePath = `/EntityDefinitions(LogicalName='${args.entityName}')`;

    const result: Record<string, RelationshipMetadata[]> = {};

    // OneToMany
    if (type === "all" || type === "oneToMany") {
        try {
            const oneToMany = await client.get<ODataResponse<RelationshipMetadata>>(
                `${basePath}/OneToManyRelationships?$select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,ReferencedAttribute`
            );
            result.oneToMany = oneToMany.value.map((r) => ({
                SchemaName: r.SchemaName,
                ReferencingEntity: r.ReferencingEntity,
                ReferencingAttribute: r.ReferencingAttribute,
                ReferencedEntity: r.ReferencedEntity,
                ReferencedAttribute: r.ReferencedAttribute,
            }));
        } catch {
            result.oneToMany = [];
        }
    }

    // ManyToOne
    if (type === "all" || type === "manyToOne") {
        try {
            const manyToOne = await client.get<ODataResponse<RelationshipMetadata>>(
                `${basePath}/ManyToOneRelationships?$select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,ReferencedAttribute`
            );
            result.manyToOne = manyToOne.value.map((r) => ({
                SchemaName: r.SchemaName,
                ReferencingEntity: r.ReferencingEntity,
                ReferencingAttribute: r.ReferencingAttribute,
                ReferencedEntity: r.ReferencedEntity,
                ReferencedAttribute: r.ReferencedAttribute,
            }));
        } catch {
            result.manyToOne = [];
        }
    }

    // ManyToMany
    if (type === "all" || type === "manyToMany") {
        try {
            const manyToMany = await client.get<ODataResponse<RelationshipMetadata>>(
                `${basePath}/ManyToManyRelationships?$select=SchemaName,Entity1LogicalName,Entity2LogicalName,IntersectEntityName`
            );
            result.manyToMany = manyToMany.value.map((r) => ({
                SchemaName: r.SchemaName,
                Entity1LogicalName: r.Entity1LogicalName,
                Entity2LogicalName: r.Entity2LogicalName,
                IntersectEntityName: r.IntersectEntityName,
            }));
        } catch {
            result.manyToMany = [];
        }
    }

    // Đếm tổng
    const totalCount = Object.values(result).reduce(
        (sum, arr) => sum + arr.length,
        0
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entity: args.entityName,
                        type: type,
                        totalRelationships: totalCount,
                        relationships: result,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
