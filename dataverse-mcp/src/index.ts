#!/usr/bin/env node

/**
 * @file index.ts
 * @description Dataverse MCP Server - Entry point
 *
 * Custom MCP Server kết nối Microsoft Dataverse cho Antigravity IDE.
 * Cung cấp 10 tools: list_entities, get_entity_metadata, get_entity_attributes,
 * query_records, create_record, update_record, execute_fetchxml,
 * get_record_by_id, get_relationships, get_optionset.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

import { MsalAuth } from "./auth/msal-auth.js";
import { DataverseClient } from "./client/dataverse-client.js";
import type { DataverseConfig, ToolResult } from "./types/dataverse.js";

// Tools
import * as listEntities from "./tools/list-entities.js";
import * as getEntityMetadata from "./tools/get-entity-metadata.js";
import * as getEntityAttributes from "./tools/get-entity-attributes.js";
import * as queryRecords from "./tools/query-records.js";
import * as createRecord from "./tools/create-record.js";
import * as updateRecord from "./tools/update-record.js";
import * as executeFetchxml from "./tools/execute-fetchxml.js";
import * as getRecordById from "./tools/get-record-by-id.js";
import * as getRelationships from "./tools/get-relationships.js";
import * as getOptionset from "./tools/get-optionset.js";
import * as deleteTable from "./tools/delete-table.js";
import * as deleteAttribute from "./tools/delete-attribute.js";
import * as publishCustomizations from "./tools/publish-customizations.js";
import * as checkDependencies from "./tools/check-dependencies.js";

// ─── Load Configuration ────────────────────────────────────────────────────

dotenv.config();

function getConfig(): DataverseConfig {
    const url = process.env.DATAVERSE_URL;
    const tenantId = process.env.DATAVERSE_TENANT_ID;
    const clientId = process.env.DATAVERSE_CLIENT_ID;
    const clientSecret = process.env.DATAVERSE_CLIENT_SECRET;

    if (!url || !tenantId || !clientId || !clientSecret) {
        console.error("❌ Thiếu environment variables. Cần cung cấp:");
        console.error("   DATAVERSE_URL, DATAVERSE_TENANT_ID, DATAVERSE_CLIENT_ID, DATAVERSE_CLIENT_SECRET");
        console.error("   Xem file .env.example để biết chi tiết.");
        process.exit(1);
    }

    return { url, tenantId, clientId, clientSecret };
}

// ─── Tool Registry ─────────────────────────────────────────────────────────

interface ToolModule {
    definition: { name: string; description: string; inputSchema: object };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (args: any, client: DataverseClient) => Promise<ToolResult>;
}

const tools: ToolModule[] = [
    listEntities,
    getEntityMetadata,
    getEntityAttributes,
    queryRecords,
    createRecord,
    updateRecord,
    executeFetchxml,
    getRecordById,
    getRelationships,
    getOptionset,
    deleteTable,
    deleteAttribute,
    publishCustomizations,
    checkDependencies,
];

// ─── MCP Server ────────────────────────────────────────────────────────────

const config = getConfig();
const auth = new MsalAuth(config);
const client = new DataverseClient(config.url, auth);

const server = new Server(
    {
        name: "Dataverse-Wizard",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Đăng ký danh sách tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
        name: t.definition.name,
        description: t.definition.description,
        inputSchema: t.definition.inputSchema,
    })),
}));

// Router gọi tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const tool = tools.find((t) => t.definition.name === name);
    if (!tool) {
        return {
            content: [
                {
                    type: "text" as const,
                    text: `❌ Tool "${name}" không tồn tại. Dùng list tools để xem danh sách tools khả dụng.`,
                },
            ],
            isError: true,
        } as const;
    }

    try {
        const result = await tool.handler((args || {}), client);
        return {
            ...result,
        } as const;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text" as const,
                    text: `❌ Lỗi khi thực thi tool "${name}": ${errorMessage}`,
                },
            ],
            isError: true,
        } as const;
    }
});

// ─── Start Server ──────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🚀 Dataverse MCP Server đã khởi động thành công!");
    console.error(`📡 Kết nối đến: ${config.url}`);
}

main().catch((error) => {
    console.error("❌ Không thể khởi động MCP Server:", error);
    process.exit(1);
});
