#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { PowerPlatformClient } from "./client.js";
import * as envList from "./tools/env-list.js";
import * as envGet from "./tools/env-get.js";
import * as envCreate from "./tools/env-create.js";
import * as envListSolutions from "./tools/env-list-solutions.js";
import * as envGetCapacity from "./tools/env-get-capacity.js";
import * as tenantSettings from "./tools/tenant-settings.js";
import * as serviceHealthStatus from "./tools/service-health.js";

// ─── Config ────────────────────────────────────────────────────────────────

function getConfig() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.error("❌ Missing required environment variables:");
    console.error("   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET");
    process.exit(1);
  }
  return { tenantId, clientId, clientSecret };
}

// ─── Tool Registry ─────────────────────────────────────────────────────────

type ToolModule = {
  definition: { name: string; description: string; inputSchema: object };
  handler: (args: Record<string, unknown>, client: PowerPlatformClient) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>;
};

const tools: ToolModule[] = [
  envList,
  envGet,
  envCreate,
  envListSolutions,
  envGetCapacity,
  tenantSettings,
  serviceHealthStatus,
];

// ─── Server ────────────────────────────────────────────────────────────────

const config = getConfig();
const client = new PowerPlatformClient(config);

const server = new Server(
  { name: "powerplatform-admin", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.definition.name,
    description: t.definition.description,
    inputSchema: t.definition.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = tools.find((t) => t.definition.name === name);

  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `❌ Unknown tool: "${name}"` }],
      isError: true,
    };
  }

  try {
    return await tool.handler((args || {}) as Record<string, unknown>, client);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text" as const, text: `❌ Error in "${name}": ${msg}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Power Platform Admin MCP started");
}

main().catch((e) => {
  console.error("❌ Failed to start:", e);
  process.exit(1);
});
