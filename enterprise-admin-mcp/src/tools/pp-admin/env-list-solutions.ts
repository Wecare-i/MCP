import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "env_list_solutions",
  description: "List all solutions (managed and unmanaged) in a Power Platform environment.",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Environment ID (GUID)",
      },
      managed: {
        type: "boolean",
        description: "Filter: true = managed only, false = unmanaged only, omit = all",
      },
    },
    required: ["environmentId"],
  },
};

export async function handler(
  args: Record<string, unknown>,
  client: PPAdminClient
) {
  const { environmentId, managed } = args as {
    environmentId: string;
    managed?: boolean;
  };

  // Solutions API via Dataverse Web API (needs the Dataverse URL from the environment)
  // First get environment details to find the Dataverse URL
  const envPath = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments/${environmentId}?api-version=2021-04-01`;
  const envData = await client.get<{
    properties: { linkedEnvironmentMetadata?: { instanceUrl: string } };
  }>(PPAdminClient.BASE_BAP, envPath, PPAdminClient.SCOPE_ADMIN);

  const instanceUrl = envData.properties.linkedEnvironmentMetadata?.instanceUrl;
  if (!instanceUrl) {
    return {
      content: [{
        type: "text" as const,
        text: "❌ This environment does not have Dataverse provisioned. Cannot list solutions.",
      }],
      isError: true,
    };
  }

  // Query solutions via Dataverse API
  let filter = "";
  if (managed === true) filter = "&$filter=ismanaged eq true";
  else if (managed === false) filter = "&$filter=ismanaged eq false";

  const solutionsPath = `/api/data/v9.2/solutions?$select=uniquename,friendlyname,version,ismanaged,publisherid${filter}&$orderby=friendlyname asc`;
  const solutionsData = await client.get<{ value: unknown[] }>(
    instanceUrl.replace(/\/$/, ""),
    solutionsPath,
    `${instanceUrl.replace(/\/$/, "")}/.default`
  );

  const solutions = (solutionsData.value || []) as Array<{
    uniquename: string;
    friendlyname: string;
    version: string;
    ismanaged: boolean;
  }>;

  const result = solutions.map((s) => ({
    uniqueName: s.uniquename,
    displayName: s.friendlyname,
    version: s.version,
    type: s.ismanaged ? "Managed" : "Unmanaged",
  }));

  const text = result.length === 0
    ? "No solutions found."
    : `Found ${result.length} solution(s):\n\n${JSON.stringify(result, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
