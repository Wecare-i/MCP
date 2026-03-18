import type { CanvasAppsClient } from "../client.js";

export const definition = {
  name: "app_share",
  description: "Share a Canvas App with a user or group by assigning a role (CanView, CanViewWithShare, CanEdit).",
  inputSchema: {
    type: "object",
    properties: {
      environmentId: { type: "string", description: "Environment ID" },
      appId: { type: "string", description: "Canvas App ID (GUID)" },
      principalId: { type: "string", description: "Azure AD Object ID of the user or group" },
      principalType: {
        type: "string",
        enum: ["User", "Group", "ServicePrincipal"],
        description: "Type of principal",
      },
      roleName: {
        type: "string",
        enum: ["CanView", "CanViewWithShare", "CanEdit"],
        description: "Role to assign (default: CanView)",
      },
    },
    required: ["environmentId", "appId", "principalId", "principalType"],
  },
};

export async function handler(args: Record<string, unknown>, client: CanvasAppsClient) {
  const { environmentId, appId, principalId, principalType, roleName = "CanView" } = args as {
    environmentId: string;
    appId: string;
    principalId: string;
    principalType: string;
    roleName?: string;
  };

  const path = `/providers/Microsoft.PowerApps/environments/${environmentId}/apps/${appId}/modifyPermissions?api-version=2016-11-01`;

  await client.post(path, {
    put: [
      {
        properties: {
          principal: { id: principalId, type: principalType },
          roleName,
          notifyShareTargetOption: "DoNotNotify",
        },
      },
    ],
  });

  return {
    content: [{
      type: "text" as const,
      text: `✅ App shared successfully.\nApp: ${appId}\nPrincipal: ${principalId} (${principalType})\nRole: ${roleName}`,
    }],
  };
}
