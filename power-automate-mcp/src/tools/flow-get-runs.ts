import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_get_runs",
  description: "Get the run history of a Power Automate flow (last 28 days retention). Returns run status, start time, duration, and trigger.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      flowId: { type: "string", description: "Flow ID (GUID)" },
      top: { type: "number", description: "Max runs to return (default: 20)" },
      status: {
        type: "string",
        enum: ["Succeeded", "Failed", "Running", "Cancelled"],
        description: "Filter by run status (optional)",
      },
    },
    required: ["environmentId", "flowId"],
  },
};

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, flowId, top = 20, status } = args as {
    environmentId: string;
    flowId: string;
    top?: number;
    status?: string;
  };

  let path = `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/runs?api-version=2016-11-01&$top=${top}`;
  if (status) path += `&$filter=status eq '${status}'`;

  const data = await client.get<{ value: unknown[] }>(path);

  const runs = (data.value || []) as Array<{
    name: string;
    properties: {
      status: string;
      startTime: string;
      endTime: string;
      trigger: { name: string; inputsLink?: { uri: string } };
    };
  }>;

  const result = runs.map((r) => ({
    runId: r.name,
    status: r.properties.status,
    startTime: r.properties.startTime,
    endTime: r.properties.endTime,
    trigger: r.properties.trigger?.name,
  }));

  const text = result.length === 0
    ? "No runs found."
    : `${result.length} run(s) for flow "${flowId}":\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
