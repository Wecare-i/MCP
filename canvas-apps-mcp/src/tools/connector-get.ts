import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "connector_get",
  description: "Get detailed information about a specific custom connector in a Power Platform environment, including its swagger/OpenAPI definition.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      connectorId: { type: "string", description: "Custom Connector ID (from connector_list)" },
    },
    required: ["environmentId", "connectorId"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { environmentId, connectorId } = args as { environmentId: string; connectorId: string };

  const raw = await client.get<{
    name: string;
    properties: {
      displayName: string;
      description?: string;
      apiDefinitions?: { originalSwaggerUrl?: string };
      connectionParameters?: Record<string, unknown>;
      createdTime: string;
      creator?: { objectId: string; displayName: string; email?: string };
      capabilities?: string[];
    };
  }>(
    `/providers/Microsoft.PowerApps/environments/${environmentId}/apis/${connectorId}?api-version=2016-11-01`
  );

  const p = raw.properties;
  const result = {
    id: raw.name,
    displayName: p.displayName,
    description: p.description,
    createdTime: p.createdTime,
    createdBy: p.creator?.email || p.creator?.displayName,
    swaggerUrl: p.apiDefinitions?.originalSwaggerUrl,
    capabilities: p.capabilities,
    connectionParameters: p.connectionParameters ? Object.keys(p.connectionParameters) : [],
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
