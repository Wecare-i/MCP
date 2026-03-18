import { PowerPlatformClient } from "../client.js";

export const definition = {
  name: "env_get",
  description: "Get detailed information about a specific Power Platform environment by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Environment ID (GUID)",
      },
    },
    required: ["environmentId"],
  },
};

export async function handler(
  args: Record<string, unknown>,
  client: PowerPlatformClient
) {
  const { environmentId } = args as { environmentId: string };
  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments/${environmentId}?api-version=2021-04-01`;

  const raw = await client.get<{
    name: string;
    properties: {
      displayName: string;
      environmentSku: string;
      azureRegion: string;
      states: { management: { id: string } };
      createdTime: string;
      linkedEnvironmentMetadata?: {
        instanceUrl: string;
        uniqueName: string;
        version: string;
      };
      createdBy?: { displayName: string; email: string };
    };
  }>(PowerPlatformClient.BASE_BAP, path, PowerPlatformClient.SCOPE_ADMIN);

  const p = raw.properties;
  const result = {
    id: raw.name,
    displayName: p.displayName,
    type: p.environmentSku,
    region: p.azureRegion,
    state: p.states?.management?.id,
    createdTime: p.createdTime,
    createdBy: p.createdBy?.email || p.createdBy?.displayName,
    dataverse: p.linkedEnvironmentMetadata
      ? {
          url: p.linkedEnvironmentMetadata.instanceUrl,
          uniqueName: p.linkedEnvironmentMetadata.uniqueName,
          version: p.linkedEnvironmentMetadata.version,
        }
      : null,
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
