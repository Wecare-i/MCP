/**
 * Tool: check_dependencies
 * Lấy danh sách tất cả components đang phụ thuộc vào một attribute hoặc entity.
 * Dùng trước khi delete_attribute / delete_table để biết cần xóa gì trước.
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

// Mapping component type codes sang tên dễ đọc
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
    60: "System Form",
    26: "Saved Query",
    59: "Saved Query Visualization",
    29: "Workflow",
    91: "Plugin Assembly",
    92: "SDK Message Processing Step",
    95: "Service Endpoint",
};

interface DependencyRecord {
    dependentcomponenttype: number;
    dependentcomponentobjectid: string;
    dependentcomponentparentid: string;
    requiredcomponentobjectid: string;
    dependencyid: string;
}

interface AttributeMetadata {
    MetadataId: string;
    LogicalName: string;
}

interface EntityMetadata {
    MetadataId: string;
    LogicalName: string;
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
        // Lấy MetadataId của attribute
        const attr = await client.get<AttributeMetadata>(
            `/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')?$select=MetadataId,LogicalName`
        );
        metadataId = attr.MetadataId;
        targetDescription = `${entityName}.${attributeName}`;
    } else {
        // Lấy MetadataId của entity
        const entity = await client.get<EntityMetadata>(
            `/EntityDefinitions(LogicalName='${entityName}')?$select=MetadataId,LogicalName`
        );
        metadataId = entity.MetadataId;
        targetDescription = entityName;
    }

    // Query dependency table
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

    const result = await client.fetchXml<ODataResponse<DependencyRecord>>(
        "dependencies",
        fetchXml
    );

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
                            dependencies: [],
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    // Nhóm theo loại component
    const grouped: Record<string, string[]> = {};
    for (const dep of dependencies) {
        const typeName =
            COMPONENT_TYPE_MAP[dep.dependentcomponenttype] ??
            `Type ${dep.dependentcomponenttype}`;
        if (!grouped[typeName]) grouped[typeName] = [];
        grouped[typeName].push(dep.dependentcomponentobjectid);
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        target: targetDescription,
                        metadataId,
                        dependencyCount: dependencies.length,
                        canDelete: false,
                        warning: `⚠️ Không thể xóa trực tiếp — còn ${dependencies.length} dependency. Hãy xóa các components này trước.`,
                        groupedByType: grouped,
                        rawDependencies: dependencies.map((d) => ({
                            type: COMPONENT_TYPE_MAP[d.dependentcomponenttype] ?? `Type ${d.dependentcomponenttype}`,
                            typeCode: d.dependentcomponenttype,
                            componentId: d.dependentcomponentobjectid,
                            dependencyId: d.dependencyid,
                        })),
                        nextStep:
                            "1. Dùng get_record_by_id để xem chi tiết từng component\n2. Update để xóa tham chiếu\n3. Gọi publish_customizations\n4. Thử delete_attribute lại",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
