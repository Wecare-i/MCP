import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "connector_list",
  description: "List all custom connectors in a specific Power Platform environment.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      top: { type: "number", description: "Max connectors to return (default: 50)" },
    },
    required: ["environmentId"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { environmentId, top = 50 } = args as { environmentId: string; top?: number };

  const data = await client.get<{ value: unknown[] }>(
    `/providers/Microsoft.PowerApps/environments/${environmentId}/apis?api-version=2016-11-01&$filter=properties/isCustomApi eq true&$top=${top}`
  );

  const connectors = (data.value || []) as Array<{
    name: string;
    properties: {
      displayName: string;
      description?: string;
      iconUri?: string;
      creator?: { objectId: string; displayName: string };
      createdTime: string;
    };
  }>;

  const result = connectors.map((c) => ({
    id: c.name,
    displayName: c.properties.displayName,
    description: c.properties.description,
    createdBy: c.properties.creator?.displayName,
    createdTime: c.properties.createdTime,
  }));

  const text = result.length === 0
    ? `No custom connectors found in environment "${environmentId}".`
    : `Found ${result.length} custom connector(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
