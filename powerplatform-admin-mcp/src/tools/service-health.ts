import type { PowerPlatformClient } from "../client.js";

export const definition = {
  name: "service_health_status",
  description: "Get current health status of Power Platform services (Power Apps, Power Automate, Dataverse) in the tenant.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handler(
  _args: Record<string, unknown>,
  client: PowerPlatformClient
) {
  const path = `/providers/Microsoft.BusinessAppPlatform/environments?api-version=2021-04-01&$select=name,properties/states`;

  const data = await client.get<{ value: unknown[] }>(
    PowerPlatformClient.BASE_BAP,
    path,
    PowerPlatformClient.SCOPE_ADMIN
  );

  // Also check Power Platform service health via Microsoft Graph if available
  const envs = (data.value || []) as Array<{
    name: string;
    properties: { states: { management: { id: string } } };
  }>;

  const summary = envs.map((e) => ({
    environmentId: e.name,
    state: e.properties?.states?.management?.id || "Unknown",
  }));

  const text = `Power Platform environment states (${summary.length} environments):\n\n${JSON.stringify(summary, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
