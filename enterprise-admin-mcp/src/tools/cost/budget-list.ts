import type { AzureCostClient } from "../../clients/AzureCostClient.js";

export const definition = {
  name: "azure_budget_list",
  description:
    "List all Azure consumption budgets for a subscription, including budget amount, current spend, and time period.",
  inputSchema: {
    type: "object",
    properties: {
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var.",
      },
    },
  },
};

interface Budget {
  name: string;
  properties?: {
    amount?: number;
    currentSpend?: { amount?: number; unit?: string };
    timeGrain?: string;
    timePeriod?: { startDate?: string; endDate?: string };
    category?: string;
    filter?: unknown;
  };
}

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;

  const path = `/subscriptions/${subscriptionId}/providers/Microsoft.Consumption/budgets?api-version=2023-11-01`;

  const data = await client.get<{ value: Budget[] }>(path);
  const budgets = data.value ?? [];

  if (budgets.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No budgets found for subscription: ${subscriptionId}\n\nTip: Create budgets in Azure Portal → Cost Management → Budgets`,
        },
      ],
    };
  }

  const lines = [
    `💰 Azure Budgets — Subscription: ${subscriptionId}`,
    `Total: ${budgets.length} budget(s)`,
    "",
  ];

  for (const b of budgets) {
    const p = b.properties ?? {};
    const budgetAmount = p.amount ?? 0;
    const currentSpend = p.currentSpend?.amount ?? 0;
    const currency = p.currentSpend?.unit ?? "USD";
    const pct = budgetAmount > 0 ? ((currentSpend / budgetAmount) * 100).toFixed(1) : "N/A";
    const status = parseFloat(pct) >= 100 ? "🔴 EXCEEDED" : parseFloat(pct) >= 80 ? "🟡 WARNING" : "🟢 OK";

    lines.push(
      `─── ${b.name}`,
      `    Amount:  ${budgetAmount.toFixed(2)} ${currency} / ${p.timeGrain ?? "Monthly"}`,
      `    Spent:   ${currentSpend.toFixed(2)} ${currency} (${pct}%) ${status}`,
      `    Period:  ${p.timePeriod?.startDate ?? "-"} → ${p.timePeriod?.endDate ?? "ongoing"}`,
      ""
    );
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
