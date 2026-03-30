import type { AzureCostClient } from "../../clients/AzureCostClient.js";

export const definition = {
  name: "azure_cost_get_current",
  description:
    "Get current month Azure spending for a subscription. Returns total cost grouped by day. Use to answer 'how much have we spent this month?'",
  inputSchema: {
    type: "object",
    properties: {
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var if not provided.",
      },
      currency: {
        type: "string",
        description: "Currency code (e.g. USD, VND). Default: USD",
      },
    },
  },
};

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;
  const currency = (args.currency as string | undefined) ?? "USD";

  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const to = now.toISOString().split("T")[0];

  const path = `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;

  const body = {
    type: "ActualCost",
    timeframe: "Custom",
    timePeriod: { from, to },
    dataset: {
      granularity: "Daily",
      aggregation: {
        totalCost: { name: "Cost", function: "Sum" },
      },
      sorting: [{ name: "UsageDate", direction: "ascending" }],
    },
  };

  const data = await client.post<{
    properties: {
      columns: { name: string }[];
      rows: (string | number)[][];
      currency: string;
    };
  }>(path, body);

  const { columns, rows, currency: responseCurrency } = data.properties;
  const costCol = columns.findIndex((c) => c.name === "Cost");
  const dateCol = columns.findIndex((c) => c.name === "UsageDate");

  const dailyRows = rows.map((row) => ({
    date: String(row[dateCol]).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    cost: Number(row[costCol]).toFixed(2),
  }));

  const totalCost = dailyRows.reduce((sum, r) => sum + parseFloat(r.cost), 0).toFixed(2);

  const lines = [
    `📊 Azure Cost — ${from} to ${to}`,
    `Currency: ${responseCurrency || currency}`,
    `Total: ${totalCost} ${responseCurrency || currency}`,
    ``,
    `Daily breakdown:`,
    ...dailyRows.map((r) => `  ${r.date}: ${r.cost}`),
  ];

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
