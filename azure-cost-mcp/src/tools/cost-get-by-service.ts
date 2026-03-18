import type { AzureCostClient } from "../client.js";

export const definition = {
  name: "azure_cost_get_by_service",
  description:
    "Get Azure costs broken down by service (e.g. Virtual Machines, Storage, SQL Database). Useful for understanding which services are driving costs.",
  inputSchema: {
    type: "object",
    properties: {
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var.",
      },
      from: {
        type: "string",
        description: "Start date in YYYY-MM-DD format. Defaults to first day of current month.",
      },
      to: {
        type: "string",
        description: "End date in YYYY-MM-DD format. Defaults to today.",
      },
      top: {
        type: "number",
        description: "Number of top services to return. Default: 15",
      },
    },
  },
};

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;
  const top = (args.top as number | undefined) ?? 15;

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
      grouping: [{ type: "Dimension", name: "ServiceName" }],
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
  const svcIdx = columns.findIndex((c) => c.name === "ServiceName");

  const services = rows
    .map((row) => ({
      service: String(row[svcIdx]),
      cost: Number(row[costIdx]).toFixed(2),
    }))
    .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost));

  const totalCost = services.reduce((s, r) => s + parseFloat(r.cost), 0).toFixed(2);

  const maxLen = Math.max(...services.map((s) => s.service.length));

  const lines = [
    `📊 Azure Cost by Service — ${from} to ${to}`,
    `Currency: ${currency}`,
    `Total: ${totalCost} ${currency}`,
    ``,
    `Service breakdown (Top ${top}):`,
    ...services.map((s) => `  ${s.service.padEnd(maxLen)}  ${s.cost.padStart(10)} ${currency}`),
  ];

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
