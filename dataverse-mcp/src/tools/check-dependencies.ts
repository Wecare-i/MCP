/**
 * Tool: check_dependencies
 * Lấy danh sách tất cả components đang phụ thuộc vào một attribute hoặc entity.
 * Dùng trước khi delete_attribute / delete_table để biết cần xóa gì trước.
 *
 * V2: Tự động resolve tên view/workflow, phân loại dependency và
 *     hướng dẫn cụ thể cách gỡ từng loại (gỡ column khỏi XML thay vì xóa view mặc định).
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

const COMPONENT_TYPE_MAP: Record<number, string> = {
    1: "Entity",
    2: "Attribute",
    3: "Relationship",
    4: "Attribute Picklist Value",
    5: "Attribute Lookup Value",
    6: "View Attribute",
    7: "Localized Label",
    8: "Relationship Extra Condition",
    9: "Option Set",
    10: "Entity Relationship",
    11: "Entity Relationship Role",
    12: "Entity Relationship Maps",
    13: "Entity Key",
    14: "Entity Index",
    26: "Saved Query",
    29: "Workflow",
    59: "Saved Query Visualization",
    60: "System Form",
    80: "Canvas App",
    91: "Plugin Assembly",
    92: "SDK Message Processing Step",
    95: "Service Endpoint",
    300: "App Action",
    371: "Model-driven App",
};

interface DependencyRecord {
    dependentcomponenttype: number;
    dependentcomponentobjectid: string;
    dependentcomponentparentid: string;
    requiredcomponentobjectid: string;
    dependencyid: string;
}

interface DeleteBlockingDependency {
    dependentcomponenttype: number;
    dependentcomponenttype_formatted?: string;
    dependentcomponentname: string;
    dependentcomponentparentid?: string;
    dependentcomponentparentname?: string;
}

interface AttributeMetadata {
    MetadataId: string;
    LogicalName: string;
}

interface EntityMetadata {
    MetadataId: string;
    LogicalName: string;
}

interface SavedQuery {
    savedqueryid: string;
    name: string;
    querytype: number;
    isdefault: boolean | null;
}

interface WorkflowRecord {
    workflowid: string;
    name: string;
    statecode: number;
    statuscode: number;
    category: number;
}

export const definition = {
    name: "check_dependencies",
    description:
        "Kiểm tra xem một column (attribute) hoặc table (entity) đang được tham chiếu bởi bao nhiêu components. Dùng trước khi delete_attribute/delete_table để biết cần xóa gì trước. Trả về danh sách chi tiết từng dependency.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description: "Logical name của entity (ví dụ: ai_table, account)",
            },
            attributeName: {
                type: "string",
                description:
                    "Logical name của attribute cần kiểm tra (tùy chọn). Nếu không cung cấp, kiểm tra dependencies của cả entity.",
            },
        },
        required: ["entityName"],
    },
};

export async function handler(
    args: { entityName: string; attributeName?: string },
    client: DataverseClient
): Promise<ToolResult> {
    const { entityName, attributeName } = args;

    let metadataId: string;
    let targetDescription: string;

    if (attributeName) {
        // Resolve attribute metadata — trả về lỗi thân thiện nếu không tồn tại
        let attr: AttributeMetadata;
        try {
            attr = await client.get<AttributeMetadata>(
                `/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')?$select=MetadataId,LogicalName`
            );
        } catch {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                success: false,
                                error: `❌ Column "${attributeName}" không tồn tại trong table "${entityName}". Kiểm tra lại tên (dùng get_entity_attributes để xem danh sách columns).`,
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
        metadataId = attr.MetadataId;
        targetDescription = `${entityName}.${attributeName}`;
    } else {
        // Resolve entity metadata — trả về lỗi thân thiện nếu không tồn tại
        let entity: EntityMetadata;
        try {
            entity = await client.get<EntityMetadata>(
                `/EntityDefinitions(LogicalName='${entityName}')?$select=MetadataId,LogicalName`
            );
        } catch {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                success: false,
                                error: `❌ Table "${entityName}" không tồn tại trong Dataverse. Kiểm tra lại tên (dùng list_entities để xem danh sách tables).`,
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
        metadataId = entity.MetadataId;
        targetDescription = entityName;
    }

    // ── RetrieveDependenciesForDelete: lấy đúng "Delete blocked by" list ────────
    const componentType = attributeName ? 2 : 1;
    let deleteBlockedBy: DeleteBlockingDependency[] = [];
    try {
        const deleteDepResult = await client.get<{ value: DeleteBlockingDependency[] }>(
            `/RetrieveDependenciesForDelete(ComponentType=@ct,ObjectId=@oid)?@ct=${componentType}&@oid=${metadataId}`
        );
        deleteBlockedBy = deleteDepResult.value ?? [];
    } catch {
        // Bỏ qua nếu không gọi được — không critical
    }

    const fetchXml = `<fetch>
  <entity name="dependency">
    <attribute name="dependentcomponenttype"/>
    <attribute name="dependentcomponentobjectid"/>
    <attribute name="dependentcomponentparentid"/>
    <attribute name="requiredcomponentobjectid"/>
    <attribute name="dependencyid"/>
    <filter>
      <condition attribute="requiredcomponentobjectid" operator="eq" value="${metadataId}"/>
    </filter>
  </entity>
</fetch>`;

    const result = await client.fetchXml<ODataResponse<DependencyRecord>>("dependencies", fetchXml);
    const dependencies = result.value ?? [];

    if (dependencies.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            target: targetDescription,
                            metadataId,
                            dependencyCount: 0,
                            message: `✅ Không có dependency nào. "${targetDescription}" có thể xóa an toàn.`,
                            deleteBlockedBy: deleteBlockedBy.map((d) => ({
                                objectType: COMPONENT_TYPE_MAP[d.dependentcomponenttype] ?? `Type ${d.dependentcomponenttype}`,
                                name: d.dependentcomponentname,
                                parentName: d.dependentcomponentparentname ?? null,
                            })),
                            dependencies: [],
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    // ── Phân loại dependencies ────────────────────────────────────────────────
    const savedQueryIds: string[] = [];
    const workflowIds: string[] = [];
    const formIds: string[] = [];
    const otherDeps: DependencyRecord[] = [];

    for (const dep of dependencies) {
        if (dep.dependentcomponenttype === 26) savedQueryIds.push(dep.dependentcomponentobjectid);
        else if (dep.dependentcomponenttype === 29) workflowIds.push(dep.dependentcomponentobjectid);
        else if (dep.dependentcomponenttype === 60) formIds.push(dep.dependentcomponentobjectid);
        else otherDeps.push(dep);
    }

    // ── Resolve Saved Queries ─────────────────────────────────────────────────
    const savedQueryDetails: Array<{
        id: string;
        name: string;
        isDefault: boolean;
        action: string;
        hint: string;
    }> = [];

    for (const qid of savedQueryIds) {
        try {
            const q = await client.get<SavedQuery>(
                `/savedqueries(${qid})?$select=savedqueryid,name,querytype,isdefault`
            );
            const isDefault = q.isdefault === true;
            savedQueryDetails.push({
                id: qid,
                name: q.name,
                isDefault,
                action: isDefault ? "REMOVE_COLUMN_FROM_VIEW" : "DELETE_OR_REMOVE_COLUMN",
                hint: isDefault
                    ? `⚠️ View mặc định — KHÔNG thể xóa view. Gỡ column "${attributeName ?? entityName}" khỏi layoutxml và fetchxml: get_record_by_id(savedqueries, ${qid}) → sửa XML → update_record → publish_customizations.`
                    : `✅ View thường. Có thể: (A) delete_record(savedqueries, ${qid}), hoặc (B) gỡ column khỏi XML → update_record → publish_customizations.`,
            });
        } catch {
            savedQueryDetails.push({
                id: qid,
                name: `[Không resolve được]`,
                isDefault: false,
                action: "UNKNOWN",
                hint: `Thử get_record_by_id(entitySetName=savedqueries, id=${qid}) để xem chi tiết.`,
            });
        }
    }

    // ── Resolve Workflows ─────────────────────────────────────────────────────
    const workflowDetails: Array<{
        id: string;
        name: string;
        isActive: boolean;
        action: string;
        hint: string;
    }> = [];

    for (const wid of workflowIds) {
        try {
            const w = await client.get<WorkflowRecord>(
                `/workflows(${wid})?$select=workflowid,name,statecode,statuscode,category`
            );
            const isActive = w.statecode === 1;
            workflowDetails.push({
                id: wid,
                name: w.name,
                isActive,
                action: isActive ? "DEACTIVATE_THEN_DELETE" : "DELETE",
                hint: isActive
                    ? `⚠️ Đang Active. Cần deactivate trước: update_record(workflows, ${wid}, {statecode:0, statuscode:1}) → sau đó delete_record(workflows, ${wid}).`
                    : `✅ Đã Draft. Có thể delete_record(entitySetName=workflows, id=${wid}).`,
            });
        } catch {
            workflowDetails.push({
                id: wid,
                name: `[Không resolve được]`,
                isActive: false,
                action: "UNKNOWN",
                hint: `Thử get_record_by_id(entitySetName=workflows, id=${wid}) để xem chi tiết.`,
            });
        }
    }

    // ── Other dependencies ────────────────────────────────────────────────────
    const otherDetails = otherDeps.map((d) => ({
        type: COMPONENT_TYPE_MAP[d.dependentcomponenttype] ?? `Type ${d.dependentcomponenttype}`,
        typeCode: d.dependentcomponenttype,
        componentId: d.dependentcomponentobjectid,
        hint: `Dùng get_record_by_id để xem chi tiết component này.`,
    }));

    // ── Build nextSteps ───────────────────────────────────────────────────────
    const nextSteps: string[] = [];

    if (savedQueryDetails.some((v) => v.isDefault)) {
        nextSteps.push(
            `1. 📌 View mặc định: get_record_by_id(savedqueries, id) → xóa <cell name="${attributeName}"/> khỏi layoutxml và <attribute name="${attributeName}"/> khỏi fetchxml → update_record → publish_customizations`
        );
    }
    if (savedQueryDetails.some((v) => !v.isDefault && v.action !== "UNKNOWN")) {
        nextSteps.push(
            `2. 🗑️ View thường: delete_record(entitySetName=savedqueries, id=...) hoặc gỡ column rồi update và publish`
        );
    }
    if (workflowDetails.some((w) => w.isActive)) {
        nextSteps.push(
            `3. ⚙️ Workflow Active: update_record(workflows, id, {statecode:0, statuscode:1}) → delete_record(workflows, id)`
        );
    }
    if (workflowDetails.some((w) => !w.isActive)) {
        nextSteps.push(`4. ⚙️ Workflow Draft: delete_record(entitySetName=workflows, id=...)`);
    }
    if (formIds.length > 0) {
        nextSteps.push(
            `5. 📋 System Form (${formIds.length} form): Vào Power Apps → mở form → gỡ field "${attributeName ?? entityName}" → Save → Publish`
        );
    }
    if (otherDetails.length > 0) {
        nextSteps.push(
            `6. ❓ ${otherDetails.length} dependency khác: xem otherDependencies bên dưới`
        );
    }
    nextSteps.push(`✅ Sau khi xử lý hết → publish_customizations → thử delete_attribute lại`);

    // ── Map deleteBlockedBy với tên type thân thiện ───────────────────────────
    const deleteBlockedBySummary = deleteBlockedBy.map((d) => ({
        objectType: COMPONENT_TYPE_MAP[d.dependentcomponenttype] ?? `Type ${d.dependentcomponenttype}`,
        typeCode: d.dependentcomponenttype,
        name: d.dependentcomponentname,
        parentTable: d.dependentcomponentparentname ?? null,
        action: getActionForBlockingDep(d.dependentcomponenttype),
    }));

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        target: targetDescription,
                        metadataId,
                        // ── DELETE BLOCKED BY (quan trọng nhất) ──────────────
                        deleteBlockCount: deleteBlockedBySummary.length,
                        deleteBlockedBy: deleteBlockedBySummary.length > 0
                            ? deleteBlockedBySummary
                            : "✅ Không có blocking dependency — có thể xóa được",
                        // ── Tất cả dependencies ──────────────────────────────
                        totalDependencyCount: dependencies.length,
                        canDelete: deleteBlockedBySummary.length === 0,
                        warning: deleteBlockedBySummary.length > 0
                            ? `⚠️ ${deleteBlockedBySummary.length} component đang BLOCK việc xóa. Xử lý danh sách deleteBlockedBy trước.`
                            : undefined,
                        savedQueryDependencies: savedQueryDetails,
                        workflowDependencies: workflowDetails,
                        formDependencies: formIds.map((id) => ({
                            id,
                            hint: `Gỡ field khỏi form (id=${id}) trong Power Apps rồi publish`,
                        })),
                        otherDependencies: otherDetails,
                        nextSteps,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}

/** Gợi ý action cho mỗi loại blocking component */
function getActionForBlockingDep(typeCode: number): string {
    switch (typeCode) {
        case 80: return "Canvas App: Mở Power Apps Editor → xóa tham chiếu table/column → Save & Publish";
        case 300: return "App Action: Xóa Command Bar action trong Solution Explorer";
        case 371: return "Model-driven App: execute_action(RemoveAppComponents) để gỡ table khỏi app";
        case 29: return "Workflow: delete_record(workflows, id) — deactivate trước nếu đang Active";
        case 26: return "Saved Query (View): delete_record(savedqueries, id) hoặc gỡ column khỏi XML";
        case 60: return "System Form: Gỡ field khỏi Form trong Power Apps → Publish";
        default: return `Type ${typeCode}: Kiểm tra thủ công trong Power Apps > Solutions`;
    }
}
