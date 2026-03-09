/**
 * Shared constants for Fabric Lakehouse MCP Server
 */

/** Giới hạn ký tự output để tránh overwhelm LLM */
export const CHARACTER_LIMIT = 50_000;

/** Số dòng tối đa khi preview */
export const MAX_PREVIEW_ROWS = 100;

/** Số dòng mặc định khi preview */
export const DEFAULT_PREVIEW_ROWS = 10;

/** Số dòng tối đa khi execute query */
export const MAX_QUERY_ROWS = 1000;

/** Timeout query (ms) */
export const QUERY_TIMEOUT_MS = 60_000;

/** Scope Azure cho Fabric SQL Endpoint */
export const FABRIC_SQL_SCOPE = "https://database.windows.net/.default";

/** Scope Azure cho Fabric REST API (Workspace, Dataflow, Notebook) */
export const FABRIC_API_SCOPE = "https://api.fabric.microsoft.com/.default";

/** Scope Azure cho Power BI API (Semantic Model, Reports) */
export const POWERBI_API_SCOPE = "https://analysis.windows.net/powerbi/api/.default";

/** Base URL cho Fabric REST API */
export const FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1";

/** Base URL cho Power BI REST API */
export const POWERBI_API_BASE = "https://api.powerbi.com/v1.0/myorg";

/** HTTP request timeout (ms) */
export const HTTP_TIMEOUT_MS = 30_000;

/** SQL keywords bị chặn (mutation) */
export const BLOCKED_SQL_KEYWORDS = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "MERGE",
    "EXEC",
    "EXECUTE",
    "GRANT",
    "REVOKE",
    "DENY",
] as const;
