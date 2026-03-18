
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { AzureCostClient } from "./client.js";
import * as costGetCurrent from "./tools/cost-get-current.js";
import * as costGetByService from "./tools/cost-get-by-service.js";
import * as costGetByResource from "./tools/cost-get-by-resource.js";
import * as budgetList from "./tools/budget-list.js";
import * as budgetGetAlert from "./tools/budget-get-alert.js";
import * as invoiceList from "./tools/invoice-list.js";
import * as costForecast from "./tools/cost-forecast.js";

// ─── Config ────────────────────────────────────────────────────────────────

function getConfig() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

  if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
    console.error("❌ Missing required environment variables:");
    console.error("   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID");
    process.exit(1);
  }
  return { tenantId, clientId, clientSecret, subscriptionId };
}

// ─── Tool Registry ─────────────────────────────────────────────────────────

type ToolModule = {
  definition: { name: string; description: string; inputSchema: object };
  handler: (
    args: Record<string, unknown>,
    client: AzureCostClient
  ) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>;
};

const tools: ToolModule[] = [
  costGetCurrent,
  costGetByService,
  costGetByResource,
  budgetList,
  budgetGetAlert,
  invoiceList,
  costForecast,
];

// ─── Server ────────────────────────────────────────────────────────────────

const config = getConfig();
const client = new AzureCostClient(config);

const server = new Server(
  { name: "azure-cost", version: "1.0.0" },
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
  console.error("🚀 Azure Cost MCP started");
}

main().catch((e) => {
  console.error("❌ Failed to start:", e);
  process.exit(1);
});
