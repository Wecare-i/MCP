#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CanvasAppsClient } from "./client.js";
import * as appList from "./tools/app-list.js";
import * as appGet from "./tools/app-get.js";
import * as appListByEnv from "./tools/app-list-by-env.js";
import * as appGetConnections from "./tools/app-get-connections.js";
import * as appPublish from "./tools/app-publish.js";
import * as appPermissions from "./tools/app-permissions.js";
import * as appShare from "./tools/app-share.js";
import * as appDelete from "./tools/app-delete.js";
import * as appGetVersions from "./tools/app-get-versions.js";
import * as connectorList from "./tools/connector-list.js";
import * as connectorGet from "./tools/connector-get.js";

function getConfig() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    console.error("❌ Missing: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET");
    process.exit(1);
  }
  return { tenantId, clientId, clientSecret };
}

type ToolModule = {
  definition: { name: string; description: string; inputSchema: object };
  handler: (args: Record<string, unknown>, client: CanvasAppsClient) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>;
};

const tools: ToolModule[] = [
  appList, appGet, appListByEnv, appGetConnections, appPublish, appPermissions,
  appShare, appDelete, appGetVersions, connectorList, connectorGet,
];

const config = getConfig();
const client = new CanvasAppsClient(config);

const server = new Server(
  { name: "canvas-apps", version: "1.1.0" },
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
    return { content: [{ type: "text" as const, text: `❌ Unknown tool: "${name}"` }], isError: true };
  }
  try {
    return await tool.handler((args || {}) as Record<string, unknown>, client);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text" as const, text: `❌ Error in "${name}": ${msg}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Canvas Apps MCP started");
}

main().catch((e) => { console.error("❌ Failed to start:", e); process.exit(1); });
