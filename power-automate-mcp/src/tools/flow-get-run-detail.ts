import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_get_run_detail",
  description: "Get detailed information about a specific run of a flow, including all action results and errors.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      flowId: { type: "string", description: "Flow ID (GUID)" },
      runId: { type: "string", description: "Run ID (from flow_get_runs)" },
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

  const data = await client.get<Record<string, unknown>>(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/runs/${runId}?api-version=2016-11-01`
  );

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
