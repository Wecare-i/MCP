/**
 * Tool: delete_table
 * Xóa custom table (entity) khỏi Dataverse.
 *
 * Flow:
 * 1. Lấy entity metadata + kiểm tra IsCustomEntity
 * 2. Auto-resolve blocking dependencies:
 *    - Views/Forms/Charts → xóa hẳn (không còn hữu ích khi table bị xóa)
 *    - Workflows → deactivate về Draft
 *    - Model-driven App → RemoveAppComponents
 *    - Canvas App / Plugin → warning, tiếp tục
 * 3. Kiểm tra relationship (OneToMany, ManyToMany) → block nếu còn
 * 4. PublishAllXml
 * 5. Xóa table
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";
import { resolveBlockingDeps } from "./dependency-resolver.js";

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
        "Xóa một custom table (entity) khỏi Dataverse. Tự động gỡ blocking dependencies (xóa Views/Forms/Charts của table, deactivate Workflows, gỡ table khỏi Model-driven App) trước khi xóa. Canvas App/Plugin sẽ được cảnh báo nhưng không block. Nếu còn relationship với table khác sẽ từ chối xóa.",
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

    // 3. Auto-resolve blocking dependencies
    //    deleteContainers = true → xóa hẳn Views/Forms/Charts (vì table sắp bị xóa)
    const resolveResult = await resolveBlockingDeps(
        client,
        entity.MetadataId,
        1, // ComponentType = 1 (Entity)
        {
            deleteContainers: true,
            entityMetadataId: entity.MetadataId,
            entityName: args.entityName,
        }
    );

    // Nếu có lỗi trong auto-resolve → log warning nhưng VẪN tiếp tục xóa table
    // Lý do: một số "lỗi" là do views/forms system không xóa được riêng lẻ,
    // nhưng chúng sẽ tự động bị xóa khi table bị xóa (cascade delete của Dataverse)
    const resolveWarnings = resolveResult.errors;

    // 4. Kiểm tra relationships (OneToMany, ManyToMany) — phải xử lý thủ công
    const basePath = `/EntityDefinitions(LogicalName='${args.entityName}')`;
    const relationshipDeps: string[] = [];

    let oneToMany: ODataResponse<RelationshipInfo> = { value: [] };
    try {
        oneToMany = await client.get<ODataResponse<RelationshipInfo>>(
            `${basePath}/OneToManyRelationships?$select=SchemaName,ReferencingEntity,ReferencedEntity,IsCustomRelationship`
        );
    } catch {
        // Bỏ qua nếu không lấy được
    }

    const customOneToMany = oneToMany.value.filter(
        (r) =>
            r.IsCustomRelationship === true &&
            r.ReferencingEntity !== args.entityName
    );

    let manyToMany: ODataResponse<RelationshipInfo> = { value: [] };
    try {
        manyToMany = await client.get<ODataResponse<RelationshipInfo>>(
            `${basePath}/ManyToManyRelationships?$select=SchemaName,Entity1LogicalName,Entity2LogicalName`
        );
    } catch {
        // Bỏ qua nếu không lấy được
    }

    for (const r of customOneToMany) {
        relationshipDeps.push(
            `[1:N] ${r.SchemaName}: ${r.ReferencingEntity} → ${args.entityName}`
        );
    }

    for (const r of manyToMany.value) {
        const otherEntity =
            r.Entity1LogicalName === args.entityName
                ? r.Entity2LogicalName
                : r.Entity1LogicalName;
        relationshipDeps.push(
            `[N:N] ${r.SchemaName}: ${args.entityName} ↔ ${otherEntity}`
        );
    }

    if (relationshipDeps.length > 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: false,
                            entity: args.entityName,
                            reason: "Không thể xóa — table còn relationship với table khác. Xóa relationships trước.",
                            relationshipDependencies: {
                                count: relationshipDeps.length,
                                items: relationshipDeps,
                            },
                            autoResolved: resolveResult.resolved,
                            suggestion: [
                                "Dùng get_relationships để xem chi tiết relationships.",
                                "Xóa lookup column ở bảng tham chiếu để gỡ relationship trước.",
                            ],
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    // 5. Publish để refresh dependency graph trước khi xóa
    try {
        await client.post("/PublishAllXml", {});
    } catch {
        // Không block nếu publish lỗi
    }

    // 6. Xóa table
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
                        autoResolved: resolveResult.resolved,
                        warnings: [
                            ...(resolveWarnings.length > 0
                                ? resolveWarnings.map((e) => `⚠️ ${e.type} (${e.id}): ${e.error}`)
                                : []),
                            ...(resolveResult.hasManualDeps
                                ? resolveResult.manualDeps.map(
                                    (d) => `⚠️ ${d.type} (${d.id}): xử lý thủ công — ${d.hint}`
                                )
                                : []),
                        ].filter(Boolean),
                        message: `✅ Table "${args.entityName}" đã được xóa thành công.${resolveResult.resolved.length > 0
                                ? ` Đã tự động gỡ ${resolveResult.resolved.length} dependency.`
                                : ""
                            }${resolveResult.hasManualDeps
                                ? ` ⚠️ ${resolveResult.manualDeps.length} dependency cần kiểm tra thủ công (App Actions/Canvas Apps sẽ tự mất).`
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
