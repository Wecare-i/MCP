import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_list",
  description: "List all Power Automate flows in a specific environment. Returns flow name, ID, trigger type, state (Started/Stopped), and owner.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID (e.g. Default-{tenantId})" },
      top: { type: "number", description: "Max flows to return (default: 50)" },
    },
    required: ["environmentId"],
  },
};

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, top = 50 } = args as { environmentId: string; top?: number };
  const data = await client.get<{ value: unknown[] }>(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows?api-version=2016-11-01&$top=${top}`
  );

  const flows = (data.value || []) as Array<{
    name: string;
    properties: {
      displayName: string;
      state: string;
      createdTime: string;
      lastModifiedTime: string;
      definitionSummary: { triggers: Array<{ type: string }> };
      creator: { objectId: string };
    };
  }>;

  const result = flows.map((f) => ({
    id: f.name,
    displayName: f.properties.displayName,
    state: f.properties.state,
    triggerType: f.properties.definitionSummary?.triggers?.[0]?.type,
    createdTime: f.properties.createdTime,
    lastModified: f.properties.lastModifiedTime,
  }));

  const text = result.length === 0
    ? `No flows found in environment "${environmentId}".`
    : `Found ${result.length} flow(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
