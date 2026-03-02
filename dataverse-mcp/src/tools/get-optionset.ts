/**
 * Tool: get_optionset
 * Lấy danh sách options của 1 Choice/OptionSet column trong Dataverse
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

interface OptionSetMetadata {
    LogicalName: string;
    OptionSet?: {
        Options: Array<{
            Value: number;
            Label: {
                UserLocalizedLabel?: {
                    Label: string;
                };
            };
            Description?: {
                UserLocalizedLabel?: {
                    Label: string;
                };
            };
            Color?: string;
        }>;
    };
    GlobalOptionSet?: {
        Options: Array<{
            Value: number;
            Label: {
                UserLocalizedLabel?: {
                    Label: string;
                };
            };
        }>;
    };
}

export const definition = {
    name: "get_optionset",
    description:
        "Lấy danh sách giá trị của 1 Choice/OptionSet column (Picklist) trong Dataverse. Trả về value-label pairs. Hỗ trợ cả Global và Local OptionSet.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description:
                    "Logical name của entity chứa column (ví dụ: account, contact, cr_project)",
            },
            attributeName: {
                type: "string",
                description:
                    "Logical name của attribute OptionSet/Choice (ví dụ: statecode, statuscode, cr_category)",
            },
        },
        required: ["entityName", "attributeName"],
    },
};

export async function handler(
    args: {
        entityName: string;
        attributeName: string;
    },
    client: DataverseClient
): Promise<ToolResult> {
    // Thử lấy như PicklistAttributeMetadata (local optionset)
    try {
        const data = await client.get<OptionSetMetadata>(
            `/EntityDefinitions(LogicalName='${args.entityName}')/Attributes(LogicalName='${args.attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)`
        );

        // Ưu tiên OptionSet local, fallback sang GlobalOptionSet
        const options =
            data.OptionSet?.Options || data.GlobalOptionSet?.Options || [];

        const formatted = options.map((opt) => ({
            value: opt.Value,
            label: opt.Label?.UserLocalizedLabel?.Label ?? `Value_${opt.Value}`,
            color: (opt as Record<string, unknown>).Color ?? null,
        }));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            entity: args.entityName,
                            attribute: args.attributeName,
                            type: "Picklist",
                            optionCount: formatted.length,
                            options: formatted,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    } catch (error: unknown) {
        // Nếu không phải Picklist, thử StatusAttributeMetadata (cho statecode/statuscode)
        try {
            const data = await client.get<OptionSetMetadata>(
                `/EntityDefinitions(LogicalName='${args.entityName}')/Attributes(LogicalName='${args.attributeName}')/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`
            );

            const options = data.OptionSet?.Options || [];
            const formatted = options.map((opt) => ({
                value: opt.Value,
                label:
                    opt.Label?.UserLocalizedLabel?.Label ??
                    `Value_${opt.Value}`,
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                entity: args.entityName,
                                attribute: args.attributeName,
                                type: "Status",
                                optionCount: formatted.length,
                                options: formatted,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch {
            // Nếu cả 2 đều fail, thử StateAttributeMetadata
            try {
                const data = await client.get<OptionSetMetadata>(
                    `/EntityDefinitions(LogicalName='${args.entityName}')/Attributes(LogicalName='${args.attributeName}')/Microsoft.Dynamics.CRM.StateAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`
                );

                const options = data.OptionSet?.Options || [];
                const formatted = options.map((opt) => ({
                    value: opt.Value,
                    label:
                        opt.Label?.UserLocalizedLabel?.Label ??
                        `Value_${opt.Value}`,
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    entity: args.entityName,
                                    attribute: args.attributeName,
                                    type: "State",
                                    optionCount: formatted.length,
                                    options: formatted,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ Attribute "${args.attributeName}" trên entity "${args.entityName}" không phải là OptionSet/Picklist/Status/State column. Chi tiết: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    }
}
