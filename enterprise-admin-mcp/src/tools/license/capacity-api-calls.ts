import { GraphLicenseClient } from "../../clients/GraphLicenseClient.js";

export const definition = {
  name: "pp_capacity_api_calls",
  description:
    "Get Power Platform API call consumption for pay-as-you-go billing policies or licensed API limits. Shows usage vs entitlement.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Optional environment ID to filter. Leave empty for tenant-wide summary.",
      },
    },
  },
};

interface BillingPolicy {
  id: string;
  name: string;
  status?: string;
  billingInstrument?: {
    resourceGroup?: string;
    subscriptionId?: string;
  };
  environments?: { id: string; name?: string }[];
}

interface ApiConsumption {
  environmentId?: string;
  resourceType?: string;
  consumedCount?: number;
  entitledCount?: number;
  unit?: string;
  periodStartDate?: string;
  periodEndDate?: string;
}

export async function handler(args: Record<string, unknown>, client: GraphLicenseClient) {
  const envId = args.environmentId as string | undefined;

  const lines: string[] = [`⚡ Power Platform API Call Consumption`, ""];

  // 1) Try to get pay-as-you-go billing policies
  try {
    const policiesData = await client.get<{ value: BillingPolicy[] }>(
      GraphLicenseClient.BASE_ADMIN,
      "/licensing/billingPolicies?api-version=2022-03-01-preview",
      GraphLicenseClient.SCOPE_ADMIN
    );

    const policies = policiesData.value ?? [];
    if (policies.length > 0) {
      lines.push(`Pay-As-You-Go Billing Policies: ${policies.length}`);
      for (const p of policies) {
        const envCount = (p.environments ?? []).length;
        lines.push(
          `  • ${p.name ?? p.id}`,
          `    Status: ${p.status ?? "Unknown"}`,
          `    Environments linked: ${envCount}`,
          `    Subscription: ${p.billingInstrument?.subscriptionId ?? "N/A"}`,
          ""
        );
      }
    } else {
      lines.push("No pay-as-you-go billing policies configured.");
      lines.push("(Tenant uses license-based API limits)\n");
    }
  } catch {
    lines.push("⚠️ Could not retrieve billing policies (may need additional permissions).\n");
  }

  // 2) Try API consumption endpoint
  try {
    const consumptionPath = envId
      ? `/environments/${envId}/capacity/apiConsumption?api-version=2022-03-01-preview`
      : `/appmanagement/apiConsumption?api-version=2022-03-01-preview`;

    const consumptionData = await client.get<{ value: ApiConsumption[] }>(
      GraphLicenseClient.BASE_ADMIN,
      consumptionPath,
      GraphLicenseClient.SCOPE_ADMIN
    );

    const items = consumptionData.value ?? [];
    if (items.length > 0) {
      lines.push("API Consumption Details:");
      for (const item of items) {
        const consumed = item.consumedCount ?? 0;
        const entitled = item.entitledCount ?? 0;
        const pct = entitled > 0 ? `${((consumed / entitled) * 100).toFixed(1)}%` : "N/A";
        lines.push(
          `  ${item.resourceType ?? "API Calls"}`,
          `    Used: ${consumed.toLocaleString()} / ${entitled.toLocaleString()} (${pct})`,
          `    Period: ${item.periodStartDate ?? "-"} → ${item.periodEndDate ?? "-"}`,
          ""
        );
      }
    } else {
      lines.push("No API consumption data returned.");
      lines.push("Tip: API call tracking may require PAYG billing to be enabled.");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lines.push(`API consumption data unavailable: ${msg}`);
    lines.push("");
    lines.push("Standard license API limits reference:");
    lines.push("  • Power Apps per user: 1,000 calls/user/day");
    lines.push("  • Power Automate per user: 1,500 calls/user/day");
    lines.push("  • Microsoft 365 E3/E5: 6,000 calls/user/day");
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
