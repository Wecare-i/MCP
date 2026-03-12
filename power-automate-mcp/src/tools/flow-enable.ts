import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_enable",
  description: "Enable (start) a stopped Power Automate flow so it can run automatically.",
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
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/start?api-version=2016-11-01`
  );
  return {
    content: [{ type: "text" as const, text: `✅ Flow "${flowId}" enabled (started) successfully.` }],
  };
}
