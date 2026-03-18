
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { LicenseClient } from "./client.js";
import * as licenseList from "./tools/license-list.js";
import * as licenseGetUsage from "./tools/license-get-usage.js";
import * as licenseGetPPUsers from "./tools/license-get-pp-users.js";
import * as capacityStorage from "./tools/capacity-storage.js";
import * as capacityApiCalls from "./tools/capacity-api-calls.js";
import * as licenseCostEstimate from "./tools/license-cost-estimate.js";

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
  handler: (
    args: Record<string, unknown>,
    client: LicenseClient
  ) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>;
};

const tools: ToolModule[] = [
  licenseList,
  licenseGetUsage,
  licenseGetPPUsers,
  capacityStorage,
  capacityApiCalls,
  licenseCostEstimate,
];

// ─── Server ────────────────────────────────────────────────────────────────

const config = getConfig();
const client = new LicenseClient(config);

const server = new Server(
  { name: "powerplatform-license", version: "1.0.0" },
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
  console.error("🚀 Power Platform License MCP started");
}

main().catch((e) => {
  console.error("❌ Failed to start:", e);
  process.exit(1);
});
