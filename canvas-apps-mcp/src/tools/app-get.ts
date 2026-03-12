import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_get",
  description: "Get detailed information about a specific Canvas App by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      appId: { type: "string", description: "Canvas App ID (GUID)" },
    },
    required: ["appId"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { appId } = args as { appId: string };
  const data = await client.get<Record<string, unknown>>(
    `/providers/Microsoft.PowerApps/apps/${appId}?api-version=2016-11-01`
  );
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
