import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "policy_list",
  description: "List all Data Loss Prevention (DLP) policies in the tenant. DLP policies control which connectors can be used together in Power Apps and Power Automate.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Optional: filter policies that apply to a specific environment ID",
      },
    },
  },
};

interface DLPPolicy {
  name: string;
  displayName: string;
  createdTime: string;
  lastModifiedTime: string;
  type: string;
  environments?: Array<{ id: string; name: string }>;
}

export async function handler(args: Record<string, unknown>, client: PPAdminClient) {
  const { environmentId } = args as { environmentId?: string };

  // Power Platform DLP Policies API
  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/apiPolicies?api-version=2016-11-01`;

  const data = await client.get<{ value: DLPPolicy[] }>(
    PPAdminClient.BASE_BAP,
    path,
    PPAdminClient.SCOPE_ADMIN
  );

  let policies = data.value || [];

  // Filter by environmentId if provided
  if (environmentId) {
    policies = policies.filter((p) =>
      p.environments?.some((e) => e.name === environmentId || e.id?.includes(environmentId))
    );
  }

  const result = policies.map((p) => ({
    id: p.name,
    displayName: p.displayName,
    type: p.type,
    createdTime: p.createdTime,
    lastModifiedTime: p.lastModifiedTime,
    appliesTo: p.environments?.length
      ? `${p.environments.length} environment(s)`
      : "All environments",
  }));

  const text = result.length === 0
    ? "No DLP policies found."
    : `Found ${result.length} DLP polic(ies):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
