/**
 * Fabric Lakehouse Client
 *
 * Kết nối tới Fabric SQL Endpoint qua tedious driver trực tiếp.
 * Authentication bằng Azure Service Principal → Access Token.
 *
 * Lưu ý: mssql ConnectionPool không tương thích 100% Fabric SQL Endpoint,
 * nên dùng tedious Connection trực tiếp.
 */

import { Connection, Request, TYPES } from "tedious";
import { ClientSecretCredential } from "@azure/identity";
import type { FabricConfig, QueryResult, TableInfo, ColumnInfo } from "../types.js";
import { FABRIC_SQL_SCOPE, QUERY_TIMEOUT_MS } from "../constants.js";

export class FabricClient {
    private connection: Connection | null = null;
    private credential: ClientSecretCredential;
    private config: FabricConfig;
    private isConnected = false;

    constructor(config: FabricConfig) {
        this.config = config;
        this.credential = new ClientSecretCredential(
            config.tenantId,
            config.clientId,
            config.clientSecret
        );
    }

    /**
     * Lấy access token từ Azure AD
     */
    private async getAccessToken(): Promise<string> {
        const token = await this.credential.getToken(FABRIC_SQL_SCOPE);
        return token.token;
    }

    /**
     * Tạo connection mới tới Fabric SQL Endpoint
     */
    private async createConnection(): Promise<Connection> {
        const accessToken = await this.getAccessToken();

        return new Promise((resolve, reject) => {
            const connection = new Connection({
                server: this.config.sqlEndpoint,
                authentication: {
                    type: "azure-active-directory-access-token",
                    options: {
                        token: accessToken,
                    },
                },
                options: {
                    database: this.config.database,
                    encrypt: true,
                    port: 1433,
                    trustServerCertificate: false,
                    connectTimeout: 30_000,
                    requestTimeout: QUERY_TIMEOUT_MS,
                },
            });

            connection.on("connect", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(connection);
                }
            });

            connection.on("error", (err) => {
                console.error("Connection error:", err.message);
                this.isConnected = false;
            });

            connection.connect();
        });
    }

    /**
     * Kết nối tới Fabric SQL Endpoint
     */
    async connect(): Promise<void> {
        if (this.isConnected && this.connection) return;
        this.connection = await this.createConnection();
        this.isConnected = true;
    }

    /**
     * Đảm bảo connection còn sống, reconnect nếu cần
     */
    private async ensureConnected(): Promise<Connection> {
        if (!this.isConnected || !this.connection) {
            this.connection = await this.createConnection();
            this.isConnected = true;
        }
        return this.connection;
    }

    /**
     * Đóng kết nối
     */
    async disconnect(): Promise<void> {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
            this.isConnected = false;
        }
    }

    /**
     * Thực thi SQL query và trả về kết quả
     */
    async executeQuery(sqlQuery: string): Promise<QueryResult> {
        const conn = await this.ensureConnected();
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const rows: Record<string, unknown>[] = [];
            const columns: string[] = [];
            let columnsCaptured = false;

            const request = new Request(sqlQuery, (err, rowCount) => {
                if (err) {
                    this.isConnected = false;
                    reject(err);
                } else {
                    resolve({
                        columns,
                        rows,
                        rowCount: rows.length,
                        executionTimeMs: Date.now() - startTime,
                    });
                }
            });

            request.on("row", (rowColumns: any[]) => {
                if (!columnsCaptured) {
                    for (const col of rowColumns) {
                        columns.push(col.metadata.colName);
                    }
                    columnsCaptured = true;
                }

                const row: Record<string, unknown> = {};
                for (const col of rowColumns) {
                    row[col.metadata.colName] = col.value;
                }
                rows.push(row);
            });

            conn.execSql(request);
        });
    }

    /**
     * Liệt kê tất cả tables và views
     */
    async getTables(): Promise<TableInfo[]> {
        const query = `
      SELECT 
        TABLE_SCHEMA as [schema],
        TABLE_NAME as [name],
        TABLE_TYPE as [type]
      FROM INFORMATION_SCHEMA.TABLES
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

        const result = await this.executeQuery(query);
        return result.rows.map((row: any) => ({
            schema: row.schema,
            name: row.name,
            type: row.type,
            fullName: `${row.schema}.${row.name}`,
        }));
    }

    /**
     * Lấy schema (columns) của một table
     */
    async getTableSchema(
        tableName: string,
        schemaName: string = "dbo"
    ): Promise<ColumnInfo[]> {
        const safeTable = this.sanitizeIdentifier(tableName);
        const safeSchema = this.sanitizeIdentifier(schemaName);

        const query = `
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as dataType,
        CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as isNullable,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        NUMERIC_PRECISION as [precision],
        NUMERIC_SCALE as scale,
        ORDINAL_POSITION as ordinalPosition
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${safeTable}' AND TABLE_SCHEMA = '${safeSchema}'
      ORDER BY ORDINAL_POSITION
    `;

        const result = await this.executeQuery(query);
        return result.rows.map((row: any) => ({
            name: row.name,
            dataType: row.dataType,
            isNullable: Boolean(row.isNullable),
            maxLength: row.maxLength,
            precision: row.precision,
            scale: row.scale,
            ordinalPosition: row.ordinalPosition,
        }));
    }

    /**
     * Preview N dòng dữ liệu từ table
     */
    async previewTable(
        tableName: string,
        schemaName: string = "dbo",
        limit: number = 10
    ): Promise<QueryResult> {
        const safeTable = this.sanitizeIdentifier(tableName);
        const safeSchema = this.sanitizeIdentifier(schemaName);
        const query = `SELECT TOP (${limit}) * FROM [${safeSchema}].[${safeTable}]`;
        return this.executeQuery(query);
    }

    /**
     * Đếm số rows trong table
     */
    async getRowCount(
        tableName: string,
        schemaName: string = "dbo"
    ): Promise<number> {
        const safeTable = this.sanitizeIdentifier(tableName);
        const safeSchema = this.sanitizeIdentifier(schemaName);
        const query = `SELECT COUNT(*) as [count] FROM [${safeSchema}].[${safeTable}]`;
        const result = await this.executeQuery(query);
        return (result.rows[0]?.count as number) || 0;
    }

    /**
     * Lấy thống kê một column
     */
    async getColumnStats(
        tableName: string,
        columnName: string,
        schemaName: string = "dbo"
    ): Promise<Record<string, unknown>> {
        const safeTable = this.sanitizeIdentifier(tableName);
        const safeSchema = this.sanitizeIdentifier(schemaName);
        const safeColumn = this.sanitizeIdentifier(columnName);

        const query = `
      SELECT 
        COUNT(*) as totalCount,
        COUNT(*) - COUNT([${safeColumn}]) as nullCount,
        COUNT(DISTINCT [${safeColumn}]) as distinctCount,
        MIN(CAST([${safeColumn}] AS NVARCHAR(MAX))) as minValue,
        MAX(CAST([${safeColumn}] AS NVARCHAR(MAX))) as maxValue
      FROM [${safeSchema}].[${safeTable}]
    `;

        const result = await this.executeQuery(query);
        return result.rows[0] || {};
    }

    /**
     * Tìm kiếm tables theo tên
     */
    async searchTables(pattern: string): Promise<TableInfo[]> {
        const safePattern = pattern.replace(/'/g, "''");
        const query = `
      SELECT 
        TABLE_SCHEMA as [schema],
        TABLE_NAME as [name],
        TABLE_TYPE as [type]
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE '%${safePattern}%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

        const result = await this.executeQuery(query);
        return result.rows.map((row: any) => ({
            schema: row.schema,
            name: row.name,
            type: row.type,
            fullName: `${row.schema}.${row.name}`,
        }));
    }

    /**
     * Sanitize SQL identifier chống SQL injection
     */
    private sanitizeIdentifier(identifier: string): string {
        return identifier.replace(/[^a-zA-Z0-9_ ]/g, "");
    }

    /**
     * Thông tin kết nối hiện tại
     */
    getConnectionInfo(): Record<string, string> {
        return {
            endpoint: this.config.sqlEndpoint,
            database: this.config.database,
            status: this.isConnected ? "connected" : "disconnected",
        };
    }
}
