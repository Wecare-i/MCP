/**
 * TypeScript interfaces cho Dataverse MCP Server
 */

export interface DataverseConfig {
    url: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
}

export interface EntityMetadata {
    LogicalName: string;
    DisplayName: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    EntitySetName: string;
    PrimaryIdAttribute: string;
    PrimaryNameAttribute: string;
    Description?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
}

export interface AttributeMetadata {
    LogicalName: string;
    DisplayName: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    AttributeType: string;
    AttributeTypeName: {
        Value: string;
    };
    RequiredLevel: {
        Value: string;
    };
    MaxLength?: number;
    MinValue?: number;
    MaxValue?: number;
    Precision?: number;
    IsPrimaryId?: boolean;
    IsPrimaryName?: boolean;
    IsValidForCreate?: boolean;
    IsValidForUpdate?: boolean;
    IsValidForRead?: boolean;
}

export interface ODataResponse<T> {
    "@odata.context"?: string;
    "@odata.count"?: number;
    value: T[];
}

export interface ToolResult {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
}
