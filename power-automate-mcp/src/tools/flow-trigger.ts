import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_trigger",
  description: "Manually trigger a Power Automate flow that has a manual/HTTP trigger. ⚠️ This will execute the flow immediately.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      flowId: { type: "string", description: "Flow ID (GUID)" },
      body: {
        type: "object",
        description: "Optional JSON body to pass to the flow trigger",
      },
    },
    required: ["environmentId", "flowId"],
  },
};

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, flowId, body = {} } = args as {
    environmentId: string;
    flowId: string;
    body?: Record<string, unknown>;
  };

  // First get the flow to find the trigger name
  const flow = await client.get<{
    properties: { definitionSummary: { triggers: Array<{ swaggerOperationId?: string; type: string }> } };
  }>(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}?api-version=2016-11-01`
  );

  const triggers = flow.properties?.definitionSummary?.triggers || [];
  const trigger = triggers.find((t) =>
    t.type === "Request" || t.swaggerOperationId?.toLowerCase().includes("manual")
  ) || triggers[0];

  if (!trigger) {
    return {
      content: [{ type: "text" as const, text: "❌ No triggerable trigger found on this flow." }],
      isError: true,
    };
  }

  await client.post(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/triggers/manual/run?api-version=2016-11-01`,
    body
  );

  return {
    content: [{ type: "text" as const, text: `✅ Flow "${flowId}" triggered successfully. Check flow_get_runs to monitor execution.` }],
  };
}
