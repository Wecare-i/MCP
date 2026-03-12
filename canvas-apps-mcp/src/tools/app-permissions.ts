import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_get_permissions",
  description: "Get the permission list (role assignments) for a Canvas App — who has access and with what role.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      appId: { type: "string", description: "Canvas App ID (GUID)" },
    },
    required: ["environmentId", "appId"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { environmentId, appId } = args as { environmentId: string; appId: string };
  const data = await client.get<{ value: unknown[] }>(
    `/providers/Microsoft.PowerApps/environments/${environmentId}/apps/${appId}/permissions?api-version=2016-11-01`
  );

  const perms = (data.value || []) as Array<{
    properties: {
      principal: { displayName: string; email: string; type: string };
      roleName: string;
    };
  }>;

  const result = perms.map((p) => ({
    name: p.properties.principal?.displayName,
    email: p.properties.principal?.email,
    type: p.properties.principal?.type,
    role: p.properties.roleName,
  }));

  const text = result.length === 0
    ? "No permissions found."
    : `Permissions for app "${appId}":\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
