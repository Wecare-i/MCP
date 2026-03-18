import { LicenseClient } from "../client.js";

// Monthly USD pricing (public Microsoft list prices, as of 2024)
const LICENSE_PRICING: Record<string, { name: string; monthlyUSD: number }> = {
  POWERAPPS_PER_USER: { name: "Power Apps per user", monthlyUSD: 20.0 },
  POWERAPPS_PER_APP: { name: "Power Apps per app", monthlyUSD: 5.0 },
  POWERAPPS_PER_APP_NEW: { name: "Power Apps per app (new)", monthlyUSD: 5.0 },
  FLOW_PER_USER: { name: "Power Automate per user", monthlyUSD: 15.0 },
  POWERAUTOMATE_ATTENDED_RPA: { name: "Power Automate Attended RPA", monthlyUSD: 40.0 },
  POWERAUTOMATE_UNATTENDED_RPA: { name: "Power Automate Unattended RPA addon", monthlyUSD: 150.0 },
  ENTERPRISEPREMIUM: { name: "Microsoft 365 E5", monthlyUSD: 57.0 },
  ENTERPRISEPACK: { name: "Microsoft 365 E3", monthlyUSD: 36.0 },
  O365_BUSINESS_PREMIUM: { name: "Microsoft 365 Business Premium", monthlyUSD: 22.0 },
  DYN365_ENTERPRISE_SALES: { name: "Dynamics 365 Sales Enterprise", monthlyUSD: 95.0 },
  DYN365_ENTERPRISE_P1: { name: "Dynamics 365 Customer Engagement", monthlyUSD: 115.0 },
};

export const definition = {
  name: "pp_license_cost_estimate",
  description:
    "Estimate monthly licensing cost based on currently assigned licenses in the tenant. Uses Microsoft public list prices. Shows cost per SKU and total estimate.",
  inputSchema: {
    type: "object",
    properties: {
      currency: {
        type: "string",
        description: "Currency display label. Default: USD (prices are always in USD).",
      },
    },
  },
};

interface SubscribedSku {
  skuPartNumber: string;
  consumedUnits: number;
  capabilityStatus: string;
  prepaidUnits: { enabled: number };
}

export async function handler(args: Record<string, unknown>, client: LicenseClient) {
  const currency = (args.currency as string | undefined) ?? "USD";

  const skus = await client.getAll<SubscribedSku>(
    LicenseClient.BASE_GRAPH,
    "/v1.0/subscribedSkus",
    LicenseClient.SCOPE_GRAPH
  );

  const activeSkus = skus.filter((s) => s.capabilityStatus === "Enabled" && s.consumedUnits > 0);

  const rows: { sku: string; name: string; units: number; unitPrice: number; monthly: number }[] = [];
  let totalMonthly = 0;
  const unknownSkus: string[] = [];

  for (const sku of activeSkus) {
    const pricing = LICENSE_PRICING[sku.skuPartNumber];
    if (!pricing) {
      unknownSkus.push(sku.skuPartNumber);
      continue;
    }
    const monthly = sku.consumedUnits * pricing.monthlyUSD;
    totalMonthly += monthly;
    rows.push({
      sku: sku.skuPartNumber,
      name: pricing.name,
      units: sku.consumedUnits,
      unitPrice: pricing.monthlyUSD,
      monthly,
    });
  }

  rows.sort((a, b) => b.monthly - a.monthly);

  const lines = [
    `💵 License Cost Estimate (${currency}) — Monthly`,
    `⚠️ Based on Microsoft public list prices. Actual cost may differ (EA discounts, CSP pricing, etc.)`,
    "",
  ];

  const nameLen = Math.max(...rows.map((r) => r.name.length), 20);

  lines.push(`${"License".padEnd(nameLen)}  Units  Unit Price  Monthly Cost`);
  lines.push("-".repeat(nameLen + 36));

  for (const r of rows) {
    lines.push(
      `${r.name.padEnd(nameLen)}  ${String(r.units).padStart(5)}  ${`$${r.unitPrice.toFixed(2)}`.padStart(10)}  $${r.monthly.toFixed(2).padStart(12)}`
    );
  }

  lines.push("-".repeat(nameLen + 36));
  lines.push(`${"TOTAL".padEnd(nameLen + 19)}  $${totalMonthly.toFixed(2).padStart(12)}`);
  lines.push(`${"Annual estimate".padEnd(nameLen + 19)}  $${(totalMonthly * 12).toFixed(2).padStart(12)}`);

  if (unknownSkus.length > 0) {
    lines.push("");
    lines.push("SKUs not in price list (excluded from estimate):");
    unknownSkus.forEach((s) => lines.push(`  • ${s}`));
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
