import type { AzureCostClient } from "../client.js";

export const definition = {
  name: "azure_cost_forecast",
  description:
    "Forecast Azure cost for the rest of the current month or a custom period. Returns predicted total spend based on current usage patterns.",
  inputSchema: {
    type: "object",
    properties: {
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var.",
      },
      from: {
        type: "string",
        description: "Forecast start date (YYYY-MM-DD). Defaults to today.",
      },
      to: {
        type: "string",
        description: "Forecast end date (YYYY-MM-DD). Defaults to last day of current month.",
      },
    },
  },
};

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;

  const now = new Date();
  const from = (args.from as string | undefined) ?? now.toISOString().split("T")[0];

  // Default: last day of current month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const to = (args.to as string | undefined) ?? lastDayOfMonth.toISOString().split("T")[0];

  const path = `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/forecast?api-version=2023-11-01`;

  const body = {
    type: "ActualCost",
    timeframe: "Custom",
    timePeriod: { from, to },
    dataset: {
      granularity: "Daily",
      aggregation: {
        totalCost: { name: "Cost", function: "Sum" },
      },
    },
    includeActualCost: true,
    includeFreshPartialCost: false,
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
  const dateIdx = columns.findIndex((c) => c.name === "UsageDate");
  const typeIdx = columns.findIndex((c) => c.name === "CostStatus");

  const dailyData = rows.map((row) => ({
    date: String(row[dateIdx]).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    cost: Number(row[costIdx]).toFixed(2),
    type: typeIdx >= 0 ? String(row[typeIdx]) : "Forecast",
  }));

  const totalForecast = dailyData.reduce((s, r) => s + parseFloat(r.cost), 0).toFixed(2);

  const lines = [
    `🔮 Azure Cost Forecast — ${from} to ${to}`,
    `Currency: ${currency}`,
    `Predicted Total: ${totalForecast} ${currency}`,
    "",
    "Daily forecast:",
    ...dailyData.map((d) => `  ${d.date}: ${d.cost.padStart(8)}  [${d.type}]`),
  ];

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
