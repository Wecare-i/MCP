import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "env_create",
  description: "Create a new Power Platform environment (Sandbox or Developer type). Requires Power Platform Admin role.",
  inputSchema: {
    type: "object",
    properties: {
      displayName: {
        type: "string",
        description: "Display name for the new environment",
      },
      location: {
        type: "string",
        description: "Azure region (e.g. 'asia', 'unitedstates', 'europe'). Default: 'asia'",
      },
      environmentSku: {
        type: "string",
        enum: ["Sandbox", "Developer"],
        description: "Environment type: 'Sandbox' or 'Developer'",
      },
      currency: {
        type: "string",
        description: "ISO currency code (e.g. 'USD', 'VND'). Default: 'USD'",
      },
      language: {
        type: "string",
        description: "Language code (e.g. '1033' for English, '1066' for Vietnamese). Default: '1033'",
      },
    },
    required: ["displayName", "environmentSku"],
  },
};

export async function handler(
  args: Record<string, unknown>,
  client: PPAdminClient
) {
  const {
    displayName,
    location = "asia",
    environmentSku,
    currency = "USD",
    language = "1033",
  } = args as {
    displayName: string;
    location?: string;
    environmentSku: string;
    currency?: string;
    language?: string;
  };

  const body = {
    location,
    properties: {
      displayName,
      environmentSku,
      currency: { code: currency },
      language: { name: language },
    },
  };

  const path = `/providers/Microsoft.BusinessAppPlatform/environments?api-version=2021-04-01&retainOnProvisionFailure=false`;

  const result = await client.post<Record<string, unknown>>(
    PPAdminClient.BASE_BAP,
    path,
    body,
    PPAdminClient.SCOPE_ADMIN
  );

  const text = Object.keys(result).length === 0
    ? `✅ Environment "${displayName}" creation started (async — check PPAC for status)`
    : JSON.stringify(result, null, 2);

  return { content: [{ type: "text" as const, text }] };
}
