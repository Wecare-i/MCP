import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "env_get_capacity",
  description: "Get capacity and storage usage information for Power Platform environments in the tenant.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handler(
  _args: Record<string, unknown>,
  client: PPAdminClient
) {
  const path = `/appmanagement/environments/capacity?api-version=2022-03-01-preview`;

  const data = await client.get<{ value: unknown[] }>(
    PPAdminClient.BASE_ADMIN,
    path,
    PPAdminClient.SCOPE_ADMIN
  );

  const text = (data.value || []).length === 0
    ? JSON.stringify(data, null, 2)
    : `Capacity data:\n\n${JSON.stringify(data.value, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
