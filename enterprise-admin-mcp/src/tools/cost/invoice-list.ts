import type { AzureCostClient } from "../../clients/AzureCostClient.js";

export const definition = {
  name: "azure_invoice_list",
  description:
    "List Azure invoices for a subscription. Returns recent billing documents with status, amount, and download URL.",
  inputSchema: {
    type: "object",
    properties: {
      subscriptionId: {
        type: "string",
        description: "Azure Subscription ID. Defaults to AZURE_SUBSCRIPTION_ID env var.",
      },
      periodStart: {
        type: "string",
        description: "Filter invoices from this date (YYYY-MM-DD). Defaults to 12 months ago.",
      },
      periodEnd: {
        type: "string",
        description: "Filter invoices to this date (YYYY-MM-DD). Defaults to today.",
      },
    },
  },
};

interface Invoice {
  name: string;
  properties?: {
    invoiceDate?: string;
    dueDate?: string;
    status?: string;
    amountDue?: { value?: number; currency?: string };
    billedAmount?: { value?: number; currency?: string };
    invoicePeriodStartDate?: string;
    invoicePeriodEndDate?: string;
    downloadUrl?: { expiryTime?: string; url?: string };
  };
}

export async function handler(args: Record<string, unknown>, client: AzureCostClient) {
  const subscriptionId = (args.subscriptionId as string | undefined) ?? client.subscriptionId;

  const now = new Date();
  const periodEnd = (args.periodEnd as string | undefined) ?? now.toISOString().split("T")[0];
  const periodStart =
    (args.periodStart as string | undefined) ??
    new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split("T")[0];

  // Try subscription-level invoices first (works for PAYG/CSP)
  const path = `/subscriptions/${subscriptionId}/providers/Microsoft.Billing/invoices?api-version=2020-05-01&periodStartDate=${periodStart}&periodEndDate=${periodEnd}`;

  let invoices: Invoice[] = [];
  try {
    const data = await client.get<{ value: Invoice[] }>(path);
    invoices = data.value ?? [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // EA accounts may not support this endpoint
    return {
      content: [
        {
          type: "text" as const,
          text: [
            `⚠️ Could not retrieve invoices at subscription level.`,
            `Error: ${msg}`,
            "",
            "Note: Enterprise Agreement (EA) accounts require Billing Account ID.",
            "For EA: use Azure Portal → Cost Management + Billing → Invoices.",
          ].join("\n"),
        },
      ],
    };
  }

  if (invoices.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No invoices found for period ${periodStart} → ${periodEnd}`,
        },
      ],
    };
  }

  const statusIcon = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "due": return "🟡";
      case "pastdue": return "🔴";
      case "paid": return "🟢";
      default: return "⚪";
    }
  };

  const lines = [
    `🧾 Azure Invoices — ${periodStart} to ${periodEnd}`,
    `Found: ${invoices.length} invoice(s)`,
    "",
  ];

  for (const inv of invoices) {
    const p = inv.properties ?? {};
    const amount = p.billedAmount ?? p.amountDue;
    lines.push(
      `${statusIcon(p.status)} Invoice: ${inv.name}`,
      `   Period:  ${p.invoicePeriodStartDate ?? "-"} → ${p.invoicePeriodEndDate ?? "-"}`,
      `   Date:    ${p.invoiceDate ?? "-"}  |  Due: ${p.dueDate ?? "-"}`,
      `   Status:  ${p.status ?? "Unknown"}`,
      `   Amount:  ${amount?.value?.toFixed(2) ?? "N/A"} ${amount?.currency ?? ""}`,
      ""
    );
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
