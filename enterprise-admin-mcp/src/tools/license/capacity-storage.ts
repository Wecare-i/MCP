import { GraphLicenseClient } from "../../clients/GraphLicenseClient.js";

export const definition = {
  name: "pp_capacity_storage",
  description:
    "Get Dataverse storage capacity usage across all Power Platform environments. Shows Database, File, and Log storage per environment.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

interface CapacityEntry {
  environmentId?: string;
  environmentName?: string;
  quotaType?: string;
  capacityType?: string;
  actual?: number;
  ratedActual?: number;
  allocated?: number;
  unit?: string;
}

export async function handler(_args: Record<string, unknown>, client: GraphLicenseClient) {
  const path = `/appmanagement/environments/capacity?api-version=2022-03-01-preview`;

  const data = await client.get<{ value: CapacityEntry[] }>(
    GraphLicenseClient.BASE_ADMIN,
    path,
    GraphLicenseClient.SCOPE_ADMIN
  );

  const entries = data.value ?? [];

  if (entries.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No capacity data found. Ensure the Service Principal has Power Platform Administrator role.",
        },
      ],
    };
  }

  // Group by environment
  const envMap = new Map<string, { name: string; items: CapacityEntry[] }>();
  for (const entry of entries) {
    const envId = entry.environmentId ?? "tenant";
    if (!envMap.has(envId)) {
      envMap.set(envId, { name: entry.environmentName ?? envId, items: [] });
    }
    envMap.get(envId)!.items.push(entry);
  }

  const formatSize = (val?: number, unit?: string) => {
    if (val == null) return "N/A";
    const u = (unit ?? "GB").toUpperCase();
    return `${val.toFixed(2)} ${u}`;
  };

  const lines = [
    `💾 Dataverse Storage Capacity`,
    `Environments: ${envMap.size}`,
    "",
  ];

  for (const [, env] of envMap) {
    lines.push(`─── ${env.name}`);
    for (const item of env.items) {
      const used = item.actual ?? item.ratedActual ?? 0;
      const allocated = item.allocated ?? 0;
      const pct = allocated > 0 ? `${((used / allocated) * 100).toFixed(1)}%` : "N/A";
      const type = item.capacityType ?? item.quotaType ?? "Storage";
      lines.push(
        `  [${type.padEnd(12)}] Used: ${formatSize(used, item.unit).padStart(10)} / ${formatSize(allocated, item.unit).padStart(10)}  (${pct})`
      );
    }
    lines.push("");
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
