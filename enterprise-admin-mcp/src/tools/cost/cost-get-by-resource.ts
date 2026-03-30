import type { AzureCostClient } from "../../clients/AzureCostClient.js";

export const definition = {
  name: "azure_cost_get_by_resource",
  description:
    "Get top N most expensive Azure resources in a subscription. Useful for identifying which specific resources (VMs, databases, etc.) are costing the most.",
  inputSchema: {
    type: "object",
    properties: {
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var.",
      },
      from: {
        type: "string",
        description: "Start date YYYY-MM-DD. Defaults to first day of current month.",
      },
      to: {
        type: "string",
        description: "End date YYYY-MM-DD. Defaults to today.",
      },
      top: {
        type: "number",
        description: "Number of top resources to return. Default: 20",
      },
    },
  },
};

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;
  const top = (args.top as number | undefined) ?? 20;

  const now = new Date();
  const from =
    (args.from as string | undefined) ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const to = (args.to as string | undefined) ?? now.toISOString().split("T")[0];

  const path = `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;

  const body = {
    type: "ActualCost",
    timeframe: "Custom",
    timePeriod: { from, to },
    dataset: {
      granularity: "None",
      aggregation: {
        totalCost: { name: "Cost", function: "Sum" },
      },
      grouping: [
        { type: "Dimension", name: "ResourceId" },
        { type: "Dimension", name: "ResourceType" },
        { type: "Dimension", name: "ResourceGroup" },
      ],
      sorting: [{ name: "Cost", direction: "descending" }],
      top,
    },
  };

  const data = await client.post<{
    properties: {
      columns: { name: string }[];
      rows: (string | number)[][];
      currency: string;
    };
  }>(path, body);

  const { columns, rows, currency } = data.properties;
  const costIdx = columns.findIndex((c) => c.name === "Cost");
  const resIdx = columns.findIndex((c) => c.name === "ResourceId");
  const typeIdx = columns.findIndex((c) => c.name === "ResourceType");
  const rgIdx = columns.findIndex((c) => c.name === "ResourceGroup");

  const resources = rows
    .map((row) => {
      const rid = String(row[resIdx]);
      const resourceName = rid.split("/").pop() ?? rid;
      return {
        name: resourceName,
        type: String(row[typeIdx]).split("/").slice(-1)[0],
        resourceGroup: String(row[rgIdx]),
        cost: Number(row[costIdx]).toFixed(2),
      };
    })
    .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost));

  const totalCost = resources.reduce((s, r) => s + parseFloat(r.cost), 0).toFixed(2);

  const lines = [
    `📊 Azure Cost by Resource — Top ${top} (${from} to ${to})`,
    `Currency: ${currency}`,
    `Total shown: ${totalCost} ${currency}`,
    ``,
    ...resources.map(
      (r, i) =>
        `${String(i + 1).padStart(2)}. ${r.cost.padStart(10)} ${currency}  [${r.type}] ${r.name} (RG: ${r.resourceGroup})`
    ),
  ];

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
