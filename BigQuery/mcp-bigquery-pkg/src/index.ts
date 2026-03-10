#!/usr/bin/env node
import { BigQuery } from "@google-cloud/bigquery";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Config ───────────────────────────────────────────────────────────────────
const PROJECT_ID = process.env.BIGQUERY_PROJECT ?? "";
const LOCATION = process.env.BIGQUERY_LOCATION ?? "US";

if (!PROJECT_ID) {
    console.error("ERROR: BIGQUERY_PROJECT env var is required");
    process.exit(1);
}

const bq = new BigQuery({ projectId: PROJECT_ID, location: LOCATION });
const server = new McpServer({
    name: "@wecare-i/mcp-bigquery",
    version: "1.0.0",
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function ok(data: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
}

// ─── Tool: execute_sql ────────────────────────────────────────────────────────
server.tool(
    "execute_sql",
    "Execute a BigQuery SQL query and return results",
    {
        sql: z.string().describe("The SQL query to execute"),
        max_results: z.number().optional().default(100).describe("Maximum number of rows to return"),
    },
    async ({ sql, max_results }) => {
        try {
            const [rows] = await bq.query({ query: sql, location: LOCATION, maxResults: max_results });
            return ok({ rows, row_count: rows.length });
        } catch (e) { return err(e); }
    }
);

// ─── Tool: list_dataset_ids ───────────────────────────────────────────────────
server.tool(
    "list_dataset_ids",
    "List all dataset IDs in the BigQuery project",
    {},
    async () => {
        try {
            const [datasets] = await bq.getDatasets();
            return ok(datasets.map((d) => d.id));
        } catch (e) { return err(e); }
    }
);

// ─── Tool: list_table_ids ─────────────────────────────────────────────────────
server.tool(
    "list_table_ids",
    "List all table IDs in a specific dataset",
    { dataset: z.string().describe("Dataset ID") },
    async ({ dataset }) => {
        try {
            const [tables] = await bq.dataset(dataset).getTables();
            return ok(tables.map((t) => t.id));
        } catch (e) { return err(e); }
    }
);

// ─── Tool: get_dataset_info ───────────────────────────────────────────────────
server.tool(
    "get_dataset_info",
    "Get metadata information about a dataset",
    { dataset: z.string().describe("Dataset ID") },
    async ({ dataset }) => {
        try {
            const [meta] = await bq.dataset(dataset).getMetadata();
            return ok({
                id: meta.datasetReference?.datasetId,
                location: meta.location,
                description: meta.description,
                created: meta.creationTime,
                modified: meta.lastModifiedTime,
                labels: meta.labels,
            });
        } catch (e) { return err(e); }
    }
);

// ─── Tool: get_table_info ─────────────────────────────────────────────────────
server.tool(
    "get_table_info",
    "Get schema and metadata of a table",
    {
        dataset: z.string().describe("Dataset ID"),
        table: z.string().describe("Table ID"),
    },
    async ({ dataset, table }) => {
        try {
            const [meta] = await bq.dataset(dataset).table(table).getMetadata();
            return ok({
                id: `${dataset}.${table}`,
                type: meta.type,
                description: meta.description,
                num_rows: meta.numRows,
                num_bytes: meta.numBytes,
                created: meta.creationTime,
                modified: meta.lastModifiedTime,
                schema: meta.schema?.fields ?? [],
            });
        } catch (e) { return err(e); }
    }
);

// ─── Tool: search_catalog ─────────────────────────────────────────────────────
server.tool(
    "search_catalog",
    "Search for tables, views, or datasets by keyword",
    {
        query: z.string().describe("Search keyword"),
        types: z.array(z.string()).optional().describe("Filter types: TABLE, VIEW, DATASET"),
    },
    async ({ query }) => {
        try {
            // Implement simple search by listing all datasets & tables and filtering
            const [datasets] = await bq.getDatasets();
            const results: { dataset: string; table: string; type: string }[] = [];
            const kw = query.toLowerCase();
            for (const ds of datasets) {
                const dsId = ds.id ?? "";
                if (dsId.toLowerCase().includes(kw)) {
                    results.push({ dataset: dsId, table: "", type: "DATASET" });
                }
                try {
                    const [tables] = await ds.getTables();
                    for (const t of tables) {
                        const tId = t.id ?? "";
                        if (tId.toLowerCase().includes(kw) || dsId.toLowerCase().includes(kw)) {
                            results.push({ dataset: dsId, table: tId, type: "TABLE" });
                        }
                    }
                } catch { /* skip inaccessible datasets */ }
            }
            return ok(results.slice(0, 50));
        } catch (e) { return err(e); }
    }
);

// ─── Tool: ask_data_insights ─────────────────────────────────────────────────
server.tool(
    "ask_data_insights",
    "Generate a summary SQL query to get insights about a table",
    {
        dataset: z.string().describe("Dataset ID"),
        table: z.string().describe("Table ID"),
        question: z.string().describe("Question or analysis goal"),
    },
    async ({ dataset, table, question }) => {
        try {
            const [meta] = await bq.dataset(dataset).table(table).getMetadata();
            const fields = (meta.schema?.fields ?? []) as { name: string; type: string }[];
            const schema = fields.map((f) => `${f.name} (${f.type})`).join(", ");
            return ok({
                table: `${PROJECT_ID}.${dataset}.${table}`,
                schema,
                question,
                suggestion: `Run: SELECT * FROM \`${PROJECT_ID}.${dataset}.${table}\` LIMIT 100 -- then analyze based on: ${question}`,
                columns: fields,
            });
        } catch (e) { return err(e); }
    }
);

// ─── Tool: forecast ───────────────────────────────────────────────────────────
server.tool(
    "forecast",
    "Forecast time series data using BigQuery ML ARIMA_PLUS",
    {
        history_data: z.string().describe("Full table ID or SQL query for history data"),
        timestamp_col: z.string().describe("Name of the timestamp column"),
        data_col: z.string().describe("Name of the data/metric column"),
        horizon: z.number().optional().default(10).describe("Number of forecast steps"),
        id_cols: z.array(z.string()).optional().default([]).describe("Time series ID columns"),
    },
    async ({ history_data, timestamp_col, data_col, horizon, id_cols }) => {
        try {
            const isQuery = history_data.trim().toUpperCase().startsWith("SELECT");
            const source = isQuery ? `(${history_data})` : `\`${history_data}\``;
            const idColStr = id_cols && id_cols.length > 0 ? `, ${id_cols.join(", ")}` : "";
            const modelSql = `
        CREATE OR REPLACE MODEL \`${PROJECT_ID}.temp_forecast_model\`
        OPTIONS(
          model_type = 'ARIMA_PLUS',
          time_series_timestamp_col = '${timestamp_col}',
          time_series_data_col = '${data_col}'
          ${id_cols && id_cols.length > 0 ? `, time_series_id_col = [${id_cols.map((c) => `'${c}'`).join(",")}]` : ""}
        ) AS
        SELECT ${timestamp_col}, ${data_col}${idColStr} FROM ${source}`;
            const forecastSql = `
        SELECT * FROM ML.FORECAST(
          MODEL \`${PROJECT_ID}.temp_forecast_model\`,
          STRUCT(${horizon} AS horizon, 0.9 AS confidence_level)
        ) ORDER BY forecast_timestamp`;
            await bq.query({ query: modelSql, location: LOCATION });
            const [rows] = await bq.query({ query: forecastSql, location: LOCATION });
            return ok({ forecast: rows, horizon });
        } catch (e) { return err(e); }
    }
);

// ─── Tool: analyze_contribution ──────────────────────────────────────────────
server.tool(
    "analyze_contribution",
    "Analyze metric contribution across dimensions (key driver analysis)",
    {
        input_data: z.string().describe("Full table ID or SQL query"),
        contribution_metric: z.string().describe("Metric expression e.g. SUM(revenue)"),
        is_test_col: z.string().describe("Column name identifying test vs control group"),
        dimension_id_cols: z.array(z.string()).optional().default([]).describe("Dimension columns"),
    },
    async ({ input_data, contribution_metric, is_test_col, dimension_id_cols }) => {
        try {
            const isQuery = input_data.trim().toUpperCase().startsWith("SELECT");
            const source = isQuery ? `(${input_data})` : `\`${input_data}\``;
            const dimStr = dimension_id_cols && dimension_id_cols.length > 0
                ? `, dimension_id_cols => [${dimension_id_cols.map((c) => `'${c}'`).join(",")}]`
                : "";
            const sql = `
        SELECT * FROM ML.CONTRIBUTION_ANALYSIS(
          NULL,
          STRUCT(
            ${source} AS input_data,
            '${contribution_metric}' AS contribution_metric,
            '${is_test_col}' AS is_test_col
            ${dimStr}
          )
        )`;
            const [rows] = await bq.query({ query: sql, location: LOCATION });
            return ok({ insights: rows });
        } catch (e) { return err(e); }
    }
);

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`@wecare-i/mcp-bigquery running | project: ${PROJECT_ID} | location: ${LOCATION}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
