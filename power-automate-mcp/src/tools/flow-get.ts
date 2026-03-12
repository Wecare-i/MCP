import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_get",
  description: "Get detailed information about a specific Power Automate flow.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      flowId: { type: "string", description: "Flow ID (GUID)" },
    },
    required: ["environmentId", "flowId"],
  },
};

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, flowId } = args as { environmentId: string; flowId: string };
  const data = await client.get<Record<string, unknown>>(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}?api-version=2016-11-01`
  );
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
