import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_cancel_run",
  description: "Cancel a currently running Power Automate flow run.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      flowId: { type: "string", description: "Flow ID (GUID)" },
      runId: { type: "string", description: "Run ID to cancel (from flow_get_runs)" },
    },
    required: ["environmentId", "flowId", "runId"],
  },
};

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, flowId, runId } = args as {
    environmentId: string;
    flowId: string;
    runId: string;
  };

  const path = `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/runs/${runId}/cancel?api-version=2016-11-01`;

  await client.post(path, {});

  return {
    content: [{
      type: "text" as const,
      text: `✅ Run "${runId}" cancelled successfully for flow "${flowId}".`,
    }],
  };
}
