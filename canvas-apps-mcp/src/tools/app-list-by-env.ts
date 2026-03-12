import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_list_by_env",
  description: "List all Canvas Apps in a specific Power Platform environment.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID (e.g. Default-{tenantId} or GUID)" },
      top: { type: "number", description: "Max apps to return (default: 50)" },
    },
    required: ["environmentId"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { environmentId, top = 50 } = args as { environmentId: string; top?: number };
  const data = await client.get<{ value: unknown[] }>(
    `/providers/Microsoft.PowerApps/environments/${environmentId}/apps?api-version=2016-11-01&$top=${top}`
  );

  const apps = (data.value || []) as Array<{
    name: string;
    properties: { displayName: string; lastModifiedTime: string; appType: string; owner: { displayName: string } };
  }>;

  const result = apps.map((a) => ({
    id: a.name,
    displayName: a.properties.displayName,
    owner: a.properties.owner?.displayName,
    type: a.properties.appType,
    lastModified: a.properties.lastModifiedTime,
  }));

  const text = result.length === 0
    ? `No apps found in environment "${environmentId}".`
    : `Found ${result.length} app(s) in environment "${environmentId}":\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
