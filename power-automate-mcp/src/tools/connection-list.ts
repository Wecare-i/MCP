import type { FlowClient } from "../client.js";

export const definition = {
  name: "connection_list",
  description: "List all connections (connector instances) available in a Power Platform environment.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      top: { type: "number", description: "Max connections to return (default: 50)" },
    },
    required: ["environmentId"],
  },
};

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, top = 50 } = args as { environmentId: string; top?: number };

  const data = await client.get<{ value: unknown[] }>(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/connections?api-version=2016-11-01&$top=${top}`
  );

  const connections = (data.value || []) as Array<{
    name: string;
    properties: {
      displayName: string;
      statuses?: Array<{ status: string; error?: { code: string; message: string } }>;
      createdTime: string;
      authenticatedUser?: { email?: string; name?: string };
      apiId?: string;
    };
  }>;

  const result = connections.map((c) => ({
    id: c.name,
    displayName: c.properties.displayName,
    status: c.properties.statuses?.[0]?.status,
    error: c.properties.statuses?.[0]?.error?.message,
    createdTime: c.properties.createdTime,
    createdBy: c.properties.authenticatedUser?.email || c.properties.authenticatedUser?.name,
    connectorId: c.properties.apiId?.split("/").pop(),
  }));

  const text = result.length === 0
    ? `No connections found in environment "${environmentId}".`
    : `Found ${result.length} connection(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
