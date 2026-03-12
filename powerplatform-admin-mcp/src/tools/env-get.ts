import type { PowerPlatformClient } from "../client.js";

export const definition = {
  name: "env_get",
  description: "Get detailed information about a specific Power Platform environment by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Environment ID (GUID)",
      },
    },
    required: ["environmentId"],
  },
};

export async function handler(
  args: Record<string, unknown>,
  client: PowerPlatformClient
) {
  const { environmentId } = args as { environmentId: string };
  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments/${environmentId}?api-version=2021-04-01`;

  const data = await client.get<Record<string, unknown>>(
    PowerPlatformClient.BASE_BAP,
    path,
    PowerPlatformClient.SCOPE_ADMIN
  );

  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}
