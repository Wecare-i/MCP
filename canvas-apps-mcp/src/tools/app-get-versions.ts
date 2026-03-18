import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_get_versions",
  description: "List all saved versions (version history) of a Canvas App in an environment.",
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
    `/providers/Microsoft.PowerApps/environments/${environmentId}/apps/${appId}/versions?api-version=2016-11-01`
  );

  const versions = (data.value || []) as Array<{
    name: string;
    properties: {
      createdTime: string;
      lastModifiedTime: string;
      appVersion: string;
      lifeCycleId: string;
    };
  }>;

  const result = versions.map((v) => ({
    versionId: v.name,
    appVersion: v.properties.appVersion,
    lifeCycleId: v.properties.lifeCycleId,
    createdTime: v.properties.createdTime,
    lastModifiedTime: v.properties.lastModifiedTime,
  }));

  const text = result.length === 0
    ? `No versions found for app "${appId}".`
    : `Found ${result.length} version(s) for app "${appId}":\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
