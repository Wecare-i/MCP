import type { FlowClient } from "../client.js";

export const definition = {
  name: "flow_get_actions",
  description: "Get all actions defined in a Power Automate flow's definition (triggers + action names, types, and connections used).",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      flowId: { type: "string", description: "Flow ID (GUID)" },
    },
    required: ["environmentId", "flowId"],
  },
};

interface ActionDef {
  type: string;
  inputs?: {
    host?: { connectionName?: string; operationId?: string };
    method?: string;
    uri?: string;
  };
  runAfter?: Record<string, unknown>;
}

export async function handler(args: Record<string, unknown>, client: FlowClient) {
  const { environmentId, flowId } = args as { environmentId: string; flowId: string };

  const flow = await client.get<{
    properties: {
      displayName: string;
      definition: {
        triggers?: Record<string, ActionDef>;
        actions?: Record<string, ActionDef>;
      };
    };
  }>(
    `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}?api-version=2016-11-01`
  );

  const def = flow.properties?.definition ?? {};
  const triggers = def.triggers ?? {};
  const actions = def.actions ?? {};

  const triggerList = Object.entries(triggers).map(([name, t]) => ({
    name,
    type: t.type,
    kind: "trigger",
  }));

  const actionList = Object.entries(actions).map(([name, a]) => ({
    name,
    type: a.type,
    kind: "action",
    connectionName: a.inputs?.host?.connectionName,
    operationId: a.inputs?.host?.operationId,
  }));

  const result = {
    flowName: flow.properties.displayName,
    triggers: triggerList,
    actions: actionList,
    summary: {
      triggerCount: triggerList.length,
      actionCount: actionList.length,
      connectionsUsed: [...new Set(actionList.map((a) => a.connectionName).filter(Boolean))],
    },
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
