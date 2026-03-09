#!/usr/bin/env node
/**
 * Fabric MCP Server (Full Stack)
 *
 * MCP server cho phép LLM kết nối và tương tác với toàn bộ
 * Microsoft Fabric platform:
 *
 * - Lakehouse: SQL query trực tiếp (tedious driver)
 * - Workspace Management: REST API (api.fabric.microsoft.com)
 * - Semantic Model: Power BI REST API (DAX queries)
 * - Reports & Dashboards: Power BI REST API
 * - Dataflow Gen2: Fabric REST API
 * - Notebooks & Spark: Fabric REST API
 *
 * Transport: stdio (local)
 * Auth: Azure Service Principal (Client ID + Secret)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

// Services
import { FabricClient } from "./services/fabricClient.js";
import { FabricRestClient } from "./services/fabricRestClient.js";
import { PowerBIClient } from "./services/powerbiClient.js";

// Tools - Lakehouse (SQL)
import { registerTableTools } from "./tools/tableTools.js";
import { registerQueryTools } from "./tools/queryTools.js";
import { registerAnalysisTools } from "./tools/analysisTools.js";

// Tools - REST API
import { registerWorkspaceTools } from "./tools/workspaceTools.js";
import { registerSemanticTools } from "./tools/semanticTools.js";
import { registerReportTools } from "./tools/reportTools.js";
import { registerDataflowTools } from "./tools/dataflowTools.js";
import { registerNotebookTools } from "./tools/notebookTools.js";

import type { FabricConfig } from "./types.js";

// Load .env
dotenv.config();

// ─── Validate Environment ───────────────────────────────────

function loadConfig(): FabricConfig {
    const required = [
        "FABRIC_SQL_ENDPOINT",
        "FABRIC_DATABASE",
        "FABRIC_TENANT_ID",
        "FABRIC_CLIENT_ID",
        "FABRIC_CLIENT_SECRET",
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(
            `ERROR: Missing required environment variables: ${missing.join(", ")}`
        );
        console.error("Please create a .env file based on .env.example");
        process.exit(1);
    }

    return {
        sqlEndpoint: process.env.FABRIC_SQL_ENDPOINT!,
        database: process.env.FABRIC_DATABASE!,
        tenantId: process.env.FABRIC_TENANT_ID!,
        clientId: process.env.FABRIC_CLIENT_ID!,
        clientSecret: process.env.FABRIC_CLIENT_SECRET!,
        workspaceId: process.env.FABRIC_WORKSPACE_ID,
    };
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
    const config = loadConfig();

    // Tạo clients
    const fabricClient = new FabricClient(config);         // SQL (Lakehouse)
    const fabricRestClient = new FabricRestClient(config);  // REST (Workspace, Dataflow, Notebook)
    const powerbiClient = new PowerBIClient(config);        // REST (Semantic, Reports)

    // Getter functions
    const getSqlClient = () => fabricClient;
    const getRestClient = () => fabricRestClient;
    const getPbiClient = () => powerbiClient;

    // Khởi tạo MCP server
    const server = new McpServer({
        name: "fabric-mcp-server",
        version: "2.0.0",
    });

    // ─── Register Tools ─────────────────────────────────────

    // Lakehouse (SQL) tools
    registerTableTools(server, getSqlClient);
    registerQueryTools(server, getSqlClient);
    registerAnalysisTools(server, getSqlClient);

    // Workspace Management tools (REST)
    registerWorkspaceTools(server, getRestClient);

    // Semantic Model tools (Power BI REST)
    registerSemanticTools(server, getPbiClient);

    // Reports & Dashboards tools (Power BI REST)
    registerReportTools(server, getPbiClient);

    // Dataflow Gen2 tools (REST)
    registerDataflowTools(server, getRestClient);

    // Notebooks & Spark tools (REST)
    registerNotebookTools(server, getRestClient);

    // ─── Register Resources ─────────────────────────────────

    // Resource: Thông tin kết nối hiện tại
    server.registerResource(
        "connection_info",
        "fabric://connection/info",
        {
            description:
                "Thông tin kết nối Fabric hiện tại (SQL endpoint, REST API, Power BI API)",
            mimeType: "application/json",
        },
        async (uri) => {
            const info = {
                lakehouse: fabricClient.getConnectionInfo(),
                fabricApi: fabricRestClient.getConnectionInfo(),
                powerbiApi: powerbiClient.getConnectionInfo(),
            };
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify(info, null, 2),
                    },
                ],
            };
        }
    );

    // Resource: Danh mục toàn bộ tables
    server.registerResource(
        "tables_catalog",
        "fabric://tables/catalog",
        {
            description:
                "Danh sách toàn bộ tables và views trong Fabric Lakehouse database",
            mimeType: "application/json",
        },
        async (uri) => {
            try {
                const tables = await fabricClient.getTables();
                return {
                    contents: [
                        {
                            uri: uri.href,
                            mimeType: "application/json",
                            text: JSON.stringify(
                                { totalTables: tables.length, tables },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            mimeType: "application/json",
                            text: JSON.stringify({
                                error:
                                    error instanceof Error ? error.message : String(error),
                            }),
                        },
                    ],
                };
            }
        }
    );

    // ─── Connect Transport ──────────────────────────────────
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("✅ Fabric MCP Server (Full Stack) is running via stdio");
    console.error(`   SQL Endpoint: ${config.sqlEndpoint}`);
    console.error(`   Database: ${config.database}`);
    console.error(`   Workspace ID: ${config.workspaceId || "not configured"}`);
    console.error(`   Domains: Lakehouse, Workspace, Semantic, Reports, Dataflow, Notebook`);

    // Graceful shutdown
    process.on("SIGINT", async () => {
        console.error("Shutting down...");
        await fabricClient.disconnect();
        process.exit(0);
    });

    process.on("SIGTERM", async () => {
        console.error("Shutting down...");
        await fabricClient.disconnect();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
