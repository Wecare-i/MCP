/**
 * Tool: delete_table
 * Xóa custom table (entity) khỏi Dataverse.
 * Tự động kiểm tra dependencies trước — nếu có relationship thì từ chối xóa.
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

const COMPONENT_TYPE_LABELS: Record<number, string> = {
    26: "Saved Query (View)",
    29: "Workflow / Power Automate Flow",
    59: "Saved Query Visualization (Chart)",
    60: "System Form",
    91: "Plugin Assembly",
    92: "SDK Message Processing Step",
};

interface SolutionDependency {
    dependentcomponenttype: number;
    dependentcomponentobjectid: string;
}

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

    // 5. Tổng hợp relationship dependencies
    const relationshipDeps: string[] = [];

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

    // 6. Kiểm tra solution-level dependencies (Views, Workflows, Forms...)
    //    Dataverse "dependency" entity lưu danh sách component nào đang tham chiếu entity này
    const solutionDepFetch = `<fetch>
  <entity name="dependency">
    <attribute name="dependentcomponenttype"/>
    <attribute name="dependentcomponentobjectid"/>
    <filter>
      <condition attribute="requiredcomponentobjectid" operator="eq" value="${entity.MetadataId}"/>
    </filter>
  </entity>
</fetch>`;

    let solutionDeps: SolutionDependency[] = [];
    try {
        const depResult = await client.fetchXml<ODataResponse<SolutionDependency>>(
            "dependencies",
            solutionDepFetch
        );
        solutionDeps = depResult.value ?? [];
    } catch {
        // Nếu không query được dependency entity → bỏ qua, không block xóa
        solutionDeps = [];
    }

    // Phân loại solution deps thành nhóm có thể đọc được
    const solutionDepSummary = solutionDeps.map((d) => ({
        type: COMPONENT_TYPE_LABELS[d.dependentcomponenttype] ?? `Component type ${d.dependentcomponenttype}`,
        typeCode: d.dependentcomponenttype,
        componentId: d.dependentcomponentobjectid,
    }));

    // 7. Nếu có bất kỳ dependency nào (relationship hoặc solution) → TỪ CHỐI XÓA
    const totalDependencies = [...relationshipDeps, ...solutionDepSummary];
    if (totalDependencies.length > 0) {
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
                            reason: "Không thể xóa — table vẫn còn dependencies chưa được xử lý.",
                            relationshipDependencies: {
                                count: relationshipDeps.length,
                                items: relationshipDeps,
                            },
                            solutionDependencies: {
                                count: solutionDepSummary.length,
                                items: solutionDepSummary,
                            },
                            suggestion: [
                                "Dùng check_dependencies để xem chi tiết và hướng dẫn xử lý từng dependency.",
                                "Sau khi xử lý xong tất cả → chạy publish_customizations → thử delete_table lại.",
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

    // 8. Không còn dependency → XÓA TABLE
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
