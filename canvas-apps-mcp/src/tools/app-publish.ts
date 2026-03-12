import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_publish",
  description: "Publish a Canvas App to make the latest saved version available to users.",
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
  await client.post<unknown>(
    `/providers/Microsoft.PowerApps/apps/${appId}/publish?api-version=2016-11-01`,
    {}
  );
  return {
    content: [{ type: "text" as const, text: `✅ App "${appId}" published successfully.` }],
  };
}
