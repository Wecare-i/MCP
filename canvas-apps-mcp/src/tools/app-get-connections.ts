import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_get_connections",
  description: "Get connection references (connectors) used by a specific Canvas App in an environment.",
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
    `/providers/Microsoft.PowerApps/environments/${environmentId}/apps/${appId}/connections?api-version=2016-11-01`
  );

  const connections = (data.value || []) as Array<{
    id: string;
    properties: { displayName: string; connectionParameters: Record<string, unknown>; statuses: Array<{ status: string }> };
  }>;

  const result = connections.map((c) => ({
    id: c.id,
    displayName: c.properties.displayName,
    status: c.properties.statuses?.[0]?.status,
  }));

  const text = result.length === 0
    ? "No connections found for this app."
    : `Connections for app "${appId}":\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
