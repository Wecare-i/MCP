import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_list",
  description: "List all Canvas Apps across all environments that the service principal has access to.",
  inputSchema: {
    type: "object",
    properties: {
      top: { type: "number", description: "Max apps to return (default: 50)" },
    },
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const top = (args.top as number) || 50;
  const data = await client.get<{ value: unknown[] }>(
    `/providers/Microsoft.PowerApps/apps?api-version=2016-11-01&$top=${top}`
  );

  const apps = (data.value || []) as Array<{
    name: string;
    properties: {
      displayName: string;
      owner: { displayName: string };
      lastModifiedTime: string;
      environment: { name: string };
      appType: string;
    };
  }>;

  const result = apps.map((a) => ({
    id: a.name,
    displayName: a.properties.displayName,
    owner: a.properties.owner?.displayName,
    environment: a.properties.environment?.name,
    type: a.properties.appType,
    lastModified: a.properties.lastModifiedTime,
  }));

  const text = result.length === 0
    ? "No canvas apps found."
    : `Found ${result.length} app(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
