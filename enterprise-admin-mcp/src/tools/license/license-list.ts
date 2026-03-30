import { GraphLicenseClient } from "../../clients/GraphLicenseClient.js";

// Known Power Platform SKU part numbers for recognition
const PP_SKUS = new Set([
  "POWERAPPS_PER_USER",
  "POWERAPPS_PER_USER_GCC",
  "FLOW_PER_USER",
  "FLOW_PER_USER_GCC",
  "POWERAPPS_PER_APP",
  "POWERAPPS_PER_APP_NEW",
  "POWERAUTOMATE_ATTENDED_RPA",
  "POWERAUTOMATE_UNATTENDED_RPA",
  "DYN365_ENTERPRISE_P1",
  "DYN365_ENTERPRISE_SALES",
]);

export const definition = {
  name: "pp_license_list",
  description:
    "List all Microsoft 365 / Power Platform license SKUs subscribed in the tenant. Shows license name, status, assigned vs total seats.",
  inputSchema: {
    type: "object",
    properties: {
      filterPowerPlatform: {
        type: "boolean",
        description: "If true, show only Power Platform relevant licenses. Default: false (show all).",
      },
    },
  },
};

interface SubscribedSku {
  skuId: string;
  skuPartNumber: string;
  capabilityStatus: string;
  consumedUnits: number;
  prepaidUnits: {
    enabled: number;
    suspended: number;
    warning: number;
    lockedOut?: number;
  };
  servicePlans?: { servicePlanName: string; provisioningStatus?: string }[];
}

export async function handler(args: Record<string, unknown>, client: GraphLicenseClient) {
  const filterPP = (args.filterPowerPlatform as boolean | undefined) ?? false;

  const skus = await client.getAll<SubscribedSku>(
    GraphLicenseClient.BASE_GRAPH,
    "/v1.0/subscribedSkus",
    GraphLicenseClient.SCOPE_GRAPH
  );

  const filtered = filterPP ? skus.filter((s) => PP_SKUS.has(s.skuPartNumber)) : skus;
  filtered.sort((a, b) => b.consumedUnits - a.consumedUnits);

  const lines = [
    `🪪 License SKUs in Tenant${filterPP ? " (Power Platform only)" : ""}`,
    `Total SKUs: ${filtered.length}`,
    "",
  ];

  for (const s of filtered) {
    const total = s.prepaidUnits.enabled;
    const consumed = s.consumedUnits;
    const available = Math.max(0, total - consumed);
    const pct = total > 0 ? `${((consumed / total) * 100).toFixed(0)}%` : "N/A";
    const isPP = PP_SKUS.has(s.skuPartNumber) ? " 🔷" : "";
    const statusIcon = s.capabilityStatus === "Enabled" ? "🟢" : "🔴";

    lines.push(
      `${statusIcon} ${s.skuPartNumber}${isPP}`,
      `   Assigned: ${consumed} / ${total} (${pct} used)  |  Available: ${available}`,
      `   Status:   ${s.capabilityStatus}`,
      ""
    );
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
