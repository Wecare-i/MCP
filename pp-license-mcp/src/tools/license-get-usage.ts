import { LicenseClient } from "../client.js";

export const definition = {
  name: "pp_license_get_usage",
  description:
    "Get detailed usage breakdown for a specific license SKU — consumed, available, suspended, warning units. Use SKU part number (e.g. POWERAPPS_PER_USER).",
  inputSchema: {
    type: "object",
    properties: {
      skuPartNumber: {
        type: "string",
        description: "SKU part number to query (e.g. POWERAPPS_PER_USER, FLOW_PER_USER, ENTERPRISEPREMIUM).",
      },
    },
    required: ["skuPartNumber"],
  },
};

interface SubscribedSku {
  skuId: string;
  skuPartNumber: string;
  capabilityStatus: string;
  consumedUnits: number;
  prepaidUnits: { enabled: number; suspended: number; warning: number; lockedOut?: number };
  appliesTo?: string;
  servicePlans?: { servicePlanName: string; appliesTo?: string; provisioningStatus?: string }[];
}

export async function handler(args: Record<string, unknown>, client: LicenseClient) {
  const skuPartNumber = (args.skuPartNumber as string).toUpperCase();

  const all = await client.getAll<SubscribedSku>(
    LicenseClient.BASE_GRAPH,
    "/v1.0/subscribedSkus",
    LicenseClient.SCOPE_GRAPH
  );

  const sku = all.find((s) => s.skuPartNumber.toUpperCase() === skuPartNumber);

  if (!sku) {
    const available = all.map((s) => s.skuPartNumber).join(", ");
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ SKU not found: ${skuPartNumber}\n\nAvailable SKUs:\n${available}`,
        },
      ],
    };
  }

  const total = sku.prepaidUnits.enabled;
  const consumed = sku.consumedUnits;
  const available = Math.max(0, total - consumed);
  const suspended = sku.prepaidUnits.suspended;
  const warning = sku.prepaidUnits.warning;
  const pct = total > 0 ? ((consumed / total) * 100).toFixed(1) : "N/A";

  // Bar visualization
  const barLen = 30;
  const filled = total > 0 ? Math.round((consumed / total) * barLen) : 0;
  const bar = "█".repeat(filled) + "░".repeat(barLen - filled);

  const lines = [
    `🪪 License Usage — ${sku.skuPartNumber}`,
    `SKU ID: ${sku.skuId}`,
    `Status: ${sku.capabilityStatus}  |  Applies to: ${sku.appliesTo ?? "User"}`,
    "",
    `Seats:`,
    `  Enabled:   ${total}`,
    `  Consumed:  ${consumed}  (${pct}%)`,
    `  Available: ${available}`,
    `  Suspended: ${suspended}`,
    `  Warning:   ${warning}`,
    "",
    `Usage: [${bar}] ${pct}%`,
  ];

  // Service plans breakdown
  if (sku.servicePlans && sku.servicePlans.length > 0) {
    const ppPlans = sku.servicePlans.filter(
      (sp) => sp.servicePlanName.includes("FLOW") || sp.servicePlanName.includes("POWER")
    );

    if (ppPlans.length > 0) {
      lines.push("", "Power Platform Service Plans:");
      for (const sp of ppPlans) {
        lines.push(`  • ${sp.servicePlanName}  [${sp.provisioningStatus ?? "Unknown"}]`);
      }
    }
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
