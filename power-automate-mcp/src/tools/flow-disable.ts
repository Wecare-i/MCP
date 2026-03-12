import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_disable",
  description: "Disable (stop) a Power Automate flow so it won't run automatically. ⚠️ This will stop the flow until it is re-enabled.",
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
  await client.post(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/stop?api-version=2016-11-01`
  );
  return {
    content: [{ type: "text" as const, text: `✅ Flow "${flowId}" disabled (stopped) successfully.` }],
  };
}
