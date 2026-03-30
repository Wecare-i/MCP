import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "env_get_users",
  description: "List users who have access to a specific Power Platform environment (role assignments).",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID (GUID)" },
    },
    required: ["environmentId"],
  },
};

export async function handler(args: Record<string, unknown>, client: PPAdminClient) {
  const { environmentId } = args as { environmentId: string };

  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments/${environmentId}/roleAssignments?api-version=2021-04-01`;

  const data = await client.get<{ value: unknown[] }>(
    PPAdminClient.BASE_BAP,
    path,
    PPAdminClient.SCOPE_ADMIN
  );

  const roles = (data.value || []) as Array<{
    id: string;
    properties: {
      principal: { id: string; email?: string; displayName?: string; type: string };
      roleName: string;
    };
  }>;

  const result = roles.map((r) => ({
    principalId: r.properties.principal?.id,
    email: r.properties.principal?.email,
    displayName: r.properties.principal?.displayName,
    type: r.properties.principal?.type,
    role: r.properties.roleName,
  }));

  const text = result.length === 0
    ? `No role assignments found for environment "${environmentId}".`
    : `Found ${result.length} role assignment(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
