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

  // Find the first triggerable trigger (Request/HTTP type = manually triggerable)
  const triggerEntry = triggers.find((t) =>
    t.type === "Request" || t.swaggerOperationId?.toLowerCase().includes("manual")
  ) || triggers[0];

  if (!triggerEntry) {
    return {
      content: [{ type: "text" as const, text: "❌ No triggerable trigger found on this flow." }],
      isError: true,
    };
  }

  // Use the actual trigger name from the API (not hardcoded "manual")
  // definitionSummary.triggers contains items with their name
  // Power Automate trigger run API uses the trigger name from the definition
  const triggerName = (triggerEntry as { name?: string }).name || "manual";

  await client.post(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/triggers/${triggerName}/run?api-version=2016-11-01`,
    body
  );

  return {
    content: [{ type: "text" as const, text: `✅ Flow "${flowId}" triggered via trigger "${triggerName}". Use flow_get_runs to monitor execution.` }],
  };
}
