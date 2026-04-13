/**
 * Tool: create_table
 * Tạo custom table (entity) mới trong Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "create_table",
    description:
        "Tạo một custom table (entity) mới trong Dataverse. Cần cung cấp displayName, logicalName (với prefix, ví dụ: wcg_review_cycle), và description. Table sẽ được tạo với ownership type UserOwned. Cần publish_customizations sau khi tạo.",
    inputSchema: {
        type: "object" as const,
        properties: {
            displayName: {
                type: "string",
                description: "Tên hiển thị của table (ví dụ: 'Review Cycle')",
            },
            pluralName: {
                type: "string",
                description:
                    "Tên hiển thị số nhiều (ví dụ: 'Review Cycles'). Nếu bỏ trống sẽ tự thêm 's'.",
            },
            logicalName: {
                type: "string",
                description:
                    "Logical name của table — phải có prefix (ví dụ: wcg_review_cycle). Chỉ chứa lowercase, underscore.",
            },
            description: {
                type: "string",
                description: "Mô tả table (tùy chọn)",
            },
            primaryColumnName: {
                type: "string",
                description:
                    "Tên hiển thị của primary column (mặc định: 'Name'). Đây là cột chính hiển thị tên record.",
            },
            primaryColumnMaxLength: {
                type: "number",
                description: "Độ dài tối đa primary column (mặc định: 100)",
            },
            ownershipType: {
                type: "string",
                enum: ["UserOwned", "OrganizationOwned"],
                description:
                    "Loại ownership: UserOwned (mặc định, có security roles) hoặc OrganizationOwned (mọi user đều truy cập được)",
            },
        },
        required: ["displayName", "logicalName"],
    },
};

export async function handler(
    args: {
        displayName: string;
        pluralName?: string;
        logicalName: string;
        description?: string;
        primaryColumnName?: string;
        primaryColumnMaxLength?: number;
        ownershipType?: string;
    },
    client: DataverseClient
): Promise<ToolResult> {
    // Validate logical name format
    if (!/^[a-z][a-z0-9_]*$/.test(args.logicalName)) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: false,
                            error: "logicalName phải bắt đầu bằng chữ thường, chỉ chứa a-z, 0-9, underscore. Ví dụ: wcg_review_cycle",
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    // Validate prefix exists
    if (!args.logicalName.includes("_")) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: false,
                            error: "logicalName phải có prefix (ví dụ: wcg_review_cycle). Prefix cần match với publisher prefix trong solution.",
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    const pluralName = args.pluralName || args.displayName + "s";
    const primaryColDisplayName = args.primaryColumnName || "Name";
    const primaryColMaxLength = args.primaryColumnMaxLength || 100;
    const ownership = args.ownershipType || "UserOwned";

    // Build SchemaName from logicalName (capitalize first letters)
    const schemaName = args.logicalName
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("_");

    // Primary attribute SchemaName
    const prefix = args.logicalName.split("_")[0];
    const primaryAttrLogical = `${prefix}_name`;
    const primaryAttrSchema = `${prefix.charAt(0).toUpperCase() + prefix.slice(1)}_Name`;

    const payload = {
        "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
        SchemaName: schemaName,
        DisplayName: {
            "@odata.type": "Microsoft.Dynamics.CRM.Label",
            LocalizedLabels: [
                {
                    "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                    Label: args.displayName,
                    LanguageCode: 1033,
                },
            ],
        },
        DisplayCollectionName: {
            "@odata.type": "Microsoft.Dynamics.CRM.Label",
            LocalizedLabels: [
                {
                    "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                    Label: pluralName,
                    LanguageCode: 1033,
                },
            ],
        },
        Description: {
            "@odata.type": "Microsoft.Dynamics.CRM.Label",
            LocalizedLabels: args.description
                ? [
                      {
                          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                          Label: args.description,
                          LanguageCode: 1033,
                      },
                  ]
                : [],
        },
        OwnershipType: ownership,
        IsActivity: false,
        HasNotes: false,
        HasActivities: false,
        PrimaryNameAttribute: primaryAttrLogical,
        Attributes: [
            {
                "@odata.type":
                    "Microsoft.Dynamics.CRM.StringAttributeMetadata",
                SchemaName: primaryAttrSchema,
                DisplayName: {
                    "@odata.type": "Microsoft.Dynamics.CRM.Label",
                    LocalizedLabels: [
                        {
                            "@odata.type":
                                "Microsoft.Dynamics.CRM.LocalizedLabel",
                            Label: primaryColDisplayName,
                            LanguageCode: 1033,
                        },
                    ],
                },
                RequiredLevel: {
                    Value: "ApplicationRequired",
                    CanBeChanged: true,
                    ManagedPropertyLogicalName:
                        "canmodifyrequirementlevelsettings",
                },
                MaxLength: primaryColMaxLength,
                IsPrimaryName: true,
            },
        ],
    };

    const result = await client.post<{ entityId?: string }>(
        "/EntityDefinitions",
        payload
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        displayName: args.displayName,
                        logicalName: args.logicalName,
                        schemaName: schemaName,
                        ownershipType: ownership,
                        primaryColumn: primaryColDisplayName,
                        entityId: result?.entityId || "(created)",
                        message:
                            "Table đã được tạo thành công. Cần publish_customizations để áp dụng.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
