#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { FlowClient } from "./client.js";
import * as flowList from "./tools/flow-list.js";
import * as flowGet from "./tools/flow-get.js";
import * as flowTrigger from "./tools/flow-trigger.js";
import * as flowGetRuns from "./tools/flow-get-runs.js";
import * as flowGetRunDetail from "./tools/flow-get-run-detail.js";
import * as flowEnable from "./tools/flow-enable.js";
import * as flowDisable from "./tools/flow-disable.js";
import * as flowCancelRun from "./tools/flow-cancel-run.js";
import * as flowGetActions from "./tools/flow-get-actions.js";
import * as connectionList from "./tools/connection-list.js";

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
  handler: (args: Record<string, unknown>, client: FlowClient) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>;
};

const tools: ToolModule[] = [
  flowList, flowGet, flowTrigger, flowGetRuns, flowGetRunDetail, flowEnable, flowDisable,
  flowCancelRun, flowGetActions, connectionList,
];

const config = getConfig();
const client = new FlowClient(config);

const server = new Server(
  { name: "power-automate", version: "1.1.0" },
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
  console.error("🚀 Power Automate MCP started");
}

main().catch((e) => { console.error("❌ Failed to start:", e); process.exit(1); });
