/**
 * Tool: delete_table
 * Xóa custom table (entity) khỏi Dataverse.
 * Tự động kiểm tra dependencies trước — nếu có relationship thì từ chối xóa.
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

interface RelationshipInfo {
    SchemaName: string;
    ReferencingEntity?: string;
    ReferencedEntity?: string;
    Entity1LogicalName?: string;
    Entity2LogicalName?: string;
    IsCustomRelationship?: boolean;
}

interface EntityDefinition {
    MetadataId: string;
    LogicalName: string;
    DisplayName: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    IsCustomEntity: boolean;
}

export const definition = {
    name: "delete_table",
    description:
        "Xóa một custom table (entity) khỏi Dataverse. QUAN TRỌNG: Tool sẽ tự động kiểm tra dependencies (relationships) trước. Nếu có dependency với table khác thì từ chối xóa và liệt kê danh sách dependencies. Chỉ xóa được custom tables, không xóa system tables.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description:
                    "Logical name của entity cần xóa (ví dụ: cr_badtable, cr_oldproject)",
            },
        },
        required: ["entityName"],
    },
};

export async function handler(
    args: { entityName: string },
    client: DataverseClient
): Promise<ToolResult> {
    // 1. Lấy entity metadata + kiểm tra tồn tại
    let entity: EntityDefinition;
    try {
        entity = await client.get<EntityDefinition>(
            `/EntityDefinitions(LogicalName='${args.entityName}')?$select=MetadataId,LogicalName,DisplayName,IsCustomEntity`
        );
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Entity "${args.entityName}" không tồn tại trong Dataverse.`,
                },
            ],
            isError: true,
        };
    }

    // 2. Kiểm tra có phải custom entity không
    if (!entity.IsCustomEntity) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Không thể xóa "${args.entityName}" — đây là system table. Chỉ có thể xóa custom tables.`,
                },
            ],
            isError: true,
        };
    }

    // 3. Kiểm tra dependencies: OneToMany (table này được tham chiếu bởi table khác)
    const basePath = `/EntityDefinitions(LogicalName='${args.entityName}')`;

    const oneToMany = await client.get<ODataResponse<RelationshipInfo>>(
        `${basePath}/OneToManyRelationships?$select=SchemaName,ReferencingEntity,ReferencedEntity,IsCustomRelationship`
    );

    // Lọc custom relationships — bỏ system relationships
    const customOneToMany = oneToMany.value.filter(
        (r) =>
            r.IsCustomRelationship === true &&
            r.ReferencingEntity !== args.entityName // Chỉ lấy nơi table KHÁC tham chiếu đến table này
    );

    // 4. Kiểm tra ManyToMany
    const manyToMany = await client.get<ODataResponse<RelationshipInfo>>(
        `${basePath}/ManyToManyRelationships?$select=SchemaName,Entity1LogicalName,Entity2LogicalName`
    );

    // 5. Tổng hợp dependencies
    const dependencies: string[] = [];

    for (const r of customOneToMany) {
        dependencies.push(
            `[1:N] ${r.SchemaName}: ${r.ReferencingEntity} → ${args.entityName}`
        );
    }

    for (const r of manyToMany.value) {
        const otherEntity =
            r.Entity1LogicalName === args.entityName
                ? r.Entity2LogicalName
                : r.Entity1LogicalName;
        dependencies.push(
            `[N:N] ${r.SchemaName}: ${args.entityName} ↔ ${otherEntity}`
        );
    }

    // 6. Nếu có dependencies → TỪ CHỐI XÓA
    if (dependencies.length > 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: false,
                            entity: args.entityName,
                            displayName:
                                entity.DisplayName?.UserLocalizedLabel?.Label ??
                                args.entityName,
                            reason: "Không thể xóa — table có dependencies với tables khác.",
                            dependencyCount: dependencies.length,
                            dependencies,
                            suggestion:
                                "Hãy xóa các relationships trước rồi thử lại, hoặc xóa thủ công trong Power Apps.",
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    // 7. Không dependency → XÓA TABLE
    await client.delete(`/EntityDefinitions(${entity.MetadataId})`);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        entity: args.entityName,
                        displayName:
                            entity.DisplayName?.UserLocalizedLabel?.Label ??
                            args.entityName,
                        metadataId: entity.MetadataId,
                        message: `✅ Table "${args.entityName}" đã được xóa thành công khỏi Dataverse.`,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
