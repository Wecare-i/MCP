import type { AzureCostClient } from "../client.js";

export const definition = {
  name: "azure_budget_get_alert",
  description:
    "Get alert details for a specific Azure budget, including alert thresholds configured and whether they have been triggered.",
  inputSchema: {
    type: "object",
    properties: {
      budgetName: {
        type: "string",
        description: "Name of the budget to check alerts for.",
      },
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var.",
      },
    },
    required: ["budgetName"],
  },
};

interface BudgetDetail {
  name: string;
  properties?: {
    amount?: number;
    currentSpend?: { amount?: number; unit?: string };
    timeGrain?: string;
    notifications?: Record<
      string,
      {
        enabled?: boolean;
        operator?: string;
        threshold?: number;
        contactEmails?: string[];
        thresholdType?: string;
      }
    >;
    timePeriod?: { startDate?: string; endDate?: string };
  };
}

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;
  const budgetName = args.budgetName as string;

  const path = `/subscriptions/${subscriptionId}/providers/Microsoft.Consumption/budgets/${budgetName}?api-version=2023-11-01`;

  const budget = await client.get<BudgetDetail>(path);
  const p = budget.properties ?? {};

  const budgetAmount = p.amount ?? 0;
  const currentSpend = p.currentSpend?.amount ?? 0;
  const currency = p.currentSpend?.unit ?? "USD";
  const pct = budgetAmount > 0 ? ((currentSpend / budgetAmount) * 100).toFixed(1) : "N/A";

  const lines = [
    `🔔 Budget Alert Details — ${budget.name}`,
    `Amount:  ${budgetAmount.toFixed(2)} ${currency} / ${p.timeGrain ?? "Monthly"}`,
    `Current: ${currentSpend.toFixed(2)} ${currency} (${pct}%)`,
    `Period:  ${p.timePeriod?.startDate ?? "-"} → ${p.timePeriod?.endDate ?? "ongoing"}`,
    "",
    "Alert Thresholds:",
  ];

  const notifications = p.notifications ?? {};
  const keys = Object.keys(notifications);

  if (keys.length === 0) {
    lines.push("  No alert notifications configured.");
  } else {
    for (const key of keys) {
      const n = notifications[key];
      const triggered = n.threshold !== undefined && parseFloat(pct) >= n.threshold;
      const statusIcon = !n.enabled ? "⏸️" : triggered ? "🔴" : "🟢";
      lines.push(
        `  ${statusIcon} ${key}`,
        `     Threshold: ${n.threshold}% (${n.thresholdType ?? "Actual"})`,
        `     Status:    ${triggered ? "TRIGGERED" : "Not triggered"} | Enabled: ${n.enabled ?? false}`,
        `     Contacts:  ${(n.contactEmails ?? []).join(", ") || "none"}`,
        ""
      );
    }
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
