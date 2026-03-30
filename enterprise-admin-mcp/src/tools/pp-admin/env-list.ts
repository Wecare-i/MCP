import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "env_list",
  description: "List all Power Platform environments in the tenant. Returns environment name, ID, type (Production/Sandbox/Developer), region, state, and Dataverse URL.",
  inputSchema: {
    type: "object",
    properties: {
      top: {
        type: "number",
        description: "Maximum number of environments to return (default: 50)",
      },
    },
  },
};

export async function handler(
  args: Record<string, unknown>,
  client: PPAdminClient
) {
  const top = (args.top as number) || 50;
  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments?api-version=2021-04-01&$top=${top}`;

  const data = await client.get<{ value: unknown[] }>(
    PPAdminClient.BASE_BAP,
    path,
    PPAdminClient.SCOPE_ADMIN
  );

  const envs = (data.value || []) as Array<{
    name: string;
    properties: {
      displayName: string;
      environmentSku: string;
      azureRegion: string;
      states: { management: { id: string } };
      linkedEnvironmentMetadata?: { instanceUrl: string };
    };
  }>;

  const result = envs.map((e) => ({
    id: e.name,
    displayName: e.properties.displayName,
    type: e.properties.environmentSku,
    region: e.properties.azureRegion,
    state: e.properties.states?.management?.id,
    dataverseUrl: e.properties.linkedEnvironmentMetadata?.instanceUrl,
  }));

  const text = result.length === 0
    ? "No environments found."
    : `Found ${result.length} environment(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
