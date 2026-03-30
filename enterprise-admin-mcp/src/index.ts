import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Clients
import { AzureCostClient } from "./clients/AzureCostClient.js";
import { GraphLicenseClient } from "./clients/GraphLicenseClient.js";
import { PPAdminClient } from "./clients/PPAdminClient.js";

// Cost Tools
import * as budgetGetAlert from "./tools/cost/budget-get-alert.js";
import * as budgetList from "./tools/cost/budget-list.js";
import * as costForecast from "./tools/cost/cost-forecast.js";
import * as costGetByResource from "./tools/cost/cost-get-by-resource.js";
import * as costGetByService from "./tools/cost/cost-get-by-service.js";
import * as costGetCurrent from "./tools/cost/cost-get-current.js";
import * as invoiceList from "./tools/cost/invoice-list.js";

// License Tools
import * as capacityApiCalls from "./tools/license/capacity-api-calls.js";
import * as capacityStorage from "./tools/license/capacity-storage.js";
import * as licenseCostEstimate from "./tools/license/license-cost-estimate.js";
import * as licenseGetPpUsers from "./tools/license/license-get-pp-users.js";
import * as licenseGetUsage from "./tools/license/license-get-usage.js";
import * as licenseList from "./tools/license/license-list.js";

// PowerPlatform Admin Tools
import * as envCreate from "./tools/pp-admin/env-create.js";
import * as envGetCapacity from "./tools/pp-admin/env-get-capacity.js";
import * as envGetUsers from "./tools/pp-admin/env-get-users.js";
import * as envGet from "./tools/pp-admin/env-get.js";
import * as envListSolutions from "./tools/pp-admin/env-list-solutions.js";
import * as envList from "./tools/pp-admin/env-list.js";
import * as policyList from "./tools/pp-admin/policy-list.js";
import * as serviceHealth from "./tools/pp-admin/service-health.js";
import * as tenantSettingsUpdate from "./tools/pp-admin/tenant-settings-update.js";
import * as tenantSettings from "./tools/pp-admin/tenant-settings.js";

function getConfig() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "default";

  if (!tenantId || !clientId || !clientSecret) {
    console.error("❌ Missing required environment variables:");
    console.error("   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET");
    process.exit(1);
  }
  return { tenantId, clientId, clientSecret, subscriptionId };
}

const config = getConfig();
const costClient = new AzureCostClient(config);
const licenseClient = new GraphLicenseClient(config);
const adminClient = new PPAdminClient(config);

const costTools = [
  budgetGetAlert, budgetList, costForecast, costGetByResource,
  costGetByService, costGetCurrent, invoiceList
];

const licenseTools = [
  capacityApiCalls, capacityStorage, licenseCostEstimate,
  licenseGetPpUsers, licenseGetUsage, licenseList
];

const adminTools = [
  envCreate, envGetCapacity, envGetUsers, envGet,
  envListSolutions, envList, policyList, serviceHealth, tenantSettingsUpdate, tenantSettings
];

const allTools = [
  ...costTools.map(t => ({ ...t, clientInstance: costClient })),
  ...licenseTools.map(t => ({ ...t, clientInstance: licenseClient })),
  ...adminTools.map(t => ({ ...t, clientInstance: adminClient }))
];

const server = new Server(
  { name: "enterprise-admin-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map((t) => ({
    name: t.definition.name,
    description: t.definition.description,
    inputSchema: t.definition.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = allTools.find((t) => t.definition.name === name);

  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `❌ Unknown tool: "${name}"` }],
      isError: true,
    };
  }

  try {
    return await tool.handler((args || {}) as Record<string, unknown>, tool.clientInstance as any);
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
  console.error("🚀 Enterprise Admin MCP started (Cost + License + PP Admin)");
}

main().catch((e) => {
  console.error("❌ Failed to start:", e);
  process.exit(1);
});
