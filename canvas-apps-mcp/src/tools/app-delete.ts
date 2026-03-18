import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_delete",
  description: "⚠️ Delete a Canvas App permanently. This action cannot be undone.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      appId: { type: "string", description: "Canvas App ID (GUID) to delete" },
    },
    required: ["environmentId", "appId"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { environmentId, appId } = args as { environmentId: string; appId: string };

  const path = `/providers/Microsoft.PowerApps/environments/${environmentId}/apps/${appId}?api-version=2016-11-01`;

  await client.delete(path);

  return {
    content: [{
      type: "text" as const,
      text: `✅ App "${appId}" deleted successfully from environment "${environmentId}".`,
    }],
  };
}
