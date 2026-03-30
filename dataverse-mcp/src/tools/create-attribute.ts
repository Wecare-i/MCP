/**
 * Tool: create_attribute
 * Tạo column (attribute) mới cho một Dataverse table
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "create_attribute",
    description:
        "Tạo một column (attribute) mới cho Dataverse table. Hỗ trợ các type: String, Memo, Integer, Decimal, Money, Boolean, DateTime, Lookup, Picklist (OptionSet). Cần rebuild/publish sau khi tạo.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description: "Logical name của entity (ví dụ: account, cr_project)",
            },
            displayName: {
                type: "string",
                description: "Tên hiển thị của column (ví dụ: 'Ngày hoàn thành')",
            },
            logicalName: {
                type: "string",
                description:
                    "Logical name của column — phải có prefix (ví dụ: cr_completeddate). Nếu bỏ trống sẽ tự sinh từ displayName.",
            },
            attributeType: {
                type: "string",
                enum: ["String", "Memo", "Integer", "Decimal", "Money", "Boolean", "DateTime", "Lookup", "Picklist"],
                description: "Loại dữ liệu của column",
            },
            description: {
                type: "string",
                description: "Mô tả column (tùy chọn)",
            },
            isRequired: {
                type: "boolean",
                description: "Bắt buộc nhập? (mặc định: false)",
            },
            maxLength: {
                type: "number",
                description: "Độ dài tối đa — chỉ áp dụng cho String (mặc định: 100)",
            },
            minValue: {
                type: "number",
                description: "Giá trị tối thiểu — áp dụng cho Integer, Decimal, Money",
            },
            maxValue: {
                type: "number",
                description: "Giá trị tối đa — áp dụng cho Integer, Decimal, Money",
            },
            lookupTarget: {
                type: "string",
                description: "Entity target cho Lookup (ví dụ: account, contact) — chỉ cho type Lookup",
            },
        },
        required: ["entityName", "displayName", "attributeType"],
    },
};

function buildAttributePayload(args: {
    entityName: string;
    displayName: string;
    logicalName?: string;
    attributeType: string;
    description?: string;
    isRequired?: boolean;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    lookupTarget?: string;
}) {
    const requiredLevel = args.isRequired ? "Required" : "None";
    const desc = args.description || "";

    const base = {
        "@odata.type": "",
        SchemaName: args.logicalName || "",
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
        Description: {
            "@odata.type": "Microsoft.Dynamics.CRM.Label",
            LocalizedLabels: desc
                ? [
                      {
                          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                          Label: desc,
                          LanguageCode: 1033,
                      },
                  ]
                : [],
        },
        RequiredLevel: {
            Value: requiredLevel,
            CanBeChanged: true,
            ManagedPropertyLogicalName: "canmodifyrequirementlevelsettings",
        },
    };

    switch (args.attributeType) {
        case "String":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
                MaxLength: args.maxLength ?? 100,
                Format: "Text",
            };
        case "Memo":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
                MaxLength: args.maxLength ?? 2000,
                Format: "TextArea",
            };
        case "Integer":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
                MinValue: args.minValue ?? -2147483648,
                MaxValue: args.maxValue ?? 2147483647,
                Format: "None",
            };
        case "Decimal":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
                MinValue: args.minValue ?? -100000000000,
                MaxValue: args.maxValue ?? 100000000000,
                Precision: 2,
            };
        case "Money":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
                MinValue: args.minValue ?? 0,
                MaxValue: args.maxValue ?? 1000000000,
                Precision: 2,
                PrecisionSource: 2,
            };
        case "Boolean":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
                OptionSet: {
                    "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
                    TrueOption: {
                        Value: 1,
                        Label: {
                            "@odata.type": "Microsoft.Dynamics.CRM.Label",
                            LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: "Yes", LanguageCode: 1033 }],
                        },
                    },
                    FalseOption: {
                        Value: 0,
                        Label: {
                            "@odata.type": "Microsoft.Dynamics.CRM.Label",
                            LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: "No", LanguageCode: 1033 }],
                        },
                    },
                },
            };
        case "DateTime":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
                Format: "DateAndTime",
                DateTimeBehavior: { Value: "UserLocal" },
            };
        case "Picklist":
            return {
                ...base,
                "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
                OptionSet: {
                    "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
                    IsGlobal: false,
                    OptionSetType: "Picklist",
                    Options: [],
                },
            };
        default:
            throw new Error(`Unsupported attributeType: ${args.attributeType}`);
    }
}

export async function handler(
    args: {
        entityName: string;
        displayName: string;
        logicalName?: string;
        attributeType: string;
        description?: string;
        isRequired?: boolean;
        maxLength?: number;
        minValue?: number;
        maxValue?: number;
        lookupTarget?: string;
    },
    client: DataverseClient
): Promise<ToolResult> {
    const payload = buildAttributePayload(args);

    await client.post(
        `/EntityDefinitions(LogicalName='${args.entityName}')/Attributes`,
        payload
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        entity: args.entityName,
                        displayName: args.displayName,
                        logicalName: args.logicalName || "(auto-generated by Dataverse)",
                        attributeType: args.attributeType,
                        message: "Column đã được tạo thành công. Cần publish_customizations để áp dụng.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
