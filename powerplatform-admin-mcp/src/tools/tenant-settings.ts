import type { PowerPlatformClient } from "../client.js";

export const definition = {
  name: "tenant_settings_get",
  description: "Get tenant-level Power Platform settings and policies (governance, sharing, analytics).",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handler(
  _args: Record<string, unknown>,
  client: PowerPlatformClient
) {
  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/tenantsettings?api-version=2021-04-01`;

  const data = await client.get<Record<string, unknown>>(
    PowerPlatformClient.BASE_BAP,
    path,
    PowerPlatformClient.SCOPE_ADMIN
  );

  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}
