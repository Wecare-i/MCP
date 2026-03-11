/**
 * TypeScript type definitions for Fabric Lakehouse MCP Server
 */

/** Cấu hình kết nối Fabric Lakehouse */
export interface FabricConfig {
    sqlEndpoint?: string;
    database?: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    workspaceId?: string;
}

/** Thông tin một table/view */
export interface TableInfo {
    schema: string;
    name: string;
    type: string;
    fullName: string;
}

/** Thông tin một column */
export interface ColumnInfo {
    name: string;
    dataType: string;
    isNullable: boolean;
    maxLength: number | null;
    precision: number | null;
    scale: number | null;
    ordinalPosition: number;
}

/** Kết quả query */
export interface QueryResult {
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    executionTimeMs: number;
}

/** Thống kê cột */
export interface ColumnStats {
    columnName: string;
    dataType: string;
    totalCount: number;
    nullCount: number;
    distinctCount: number;
    minValue: string | null;
    maxValue: string | null;
    avgValue: string | null;
}

/** Tổng quan table */
export interface TableSummary {
    schema: string;
    name: string;
    rowCount: number;
    columnCount: number;
    columns: ColumnInfo[];
    sampleRows: Record<string, unknown>[];
}
