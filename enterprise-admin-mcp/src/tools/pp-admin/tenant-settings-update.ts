import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "tenant_settings_update",
  description: "Update Power Platform tenant-level governance settings. Only fields provided will be changed. Requires Power Platform Administrator role.",
  inputSchema: {
    type: "object",
    properties: {
      disableEnvironmentCreationByNonAdminUsers: {
        type: "boolean",
        description: "Prevent non-admin users from creating environments",
      },
      disablePortalsCreationByNonAdminUsers: {
        type: "boolean",
        description: "Prevent non-admin users from creating Power Pages portals",
      },
      disableCopilot: {
        type: "boolean",
        description: "Disable Copilot features across Power Platform",
      },
      disableCapacityAllocationByEnvironmentAdmins: {
        type: "boolean",
        description: "Prevent environment admins from allocating capacity",
      },
      disableSurveyFeedback: {
        type: "boolean",
        description: "Disable Power Platform survey feedback",
      },
      powerAppsDisableShareWithEveryone: {
        type: "boolean",
        description: "Prevent canvas apps from being shared with 'Everyone'",
      },
      powerAppsEnableGuestsToMake: {
        type: "boolean",
        description: "Allow guest users to create canvas apps",
      },
    },
  },
};

export async function handler(args: Record<string, unknown>, client: PPAdminClient) {
  const {
    disableEnvironmentCreationByNonAdminUsers,
    disablePortalsCreationByNonAdminUsers,
    disableCopilot,
    disableCapacityAllocationByEnvironmentAdmins,
    disableSurveyFeedback,
    powerAppsDisableShareWithEveryone,
    powerAppsEnableGuestsToMake,
  } = args as {
    disableEnvironmentCreationByNonAdminUsers?: boolean;
    disablePortalsCreationByNonAdminUsers?: boolean;
    disableCopilot?: boolean;
    disableCapacityAllocationByEnvironmentAdmins?: boolean;
    disableSurveyFeedback?: boolean;
    powerAppsDisableShareWithEveryone?: boolean;
    powerAppsEnableGuestsToMake?: boolean;
  };

  if (Object.keys(args).length === 0) {
    return {
      content: [{ type: "text" as const, text: "❌ No settings provided to update. Please specify at least one setting." }],
      isError: true,
    };
  }

  // Build patch body — only include provided fields
  const body: Record<string, unknown> = {};
  if (disableEnvironmentCreationByNonAdminUsers !== undefined)
    body.disableEnvironmentCreationByNonAdminUsers = disableEnvironmentCreationByNonAdminUsers;
  if (disablePortalsCreationByNonAdminUsers !== undefined)
    body.disablePortalsCreationByNonAdminUsers = disablePortalsCreationByNonAdminUsers;
  if (disableCopilot !== undefined)
    body.disableCopilot = disableCopilot;
  if (disableCapacityAllocationByEnvironmentAdmins !== undefined)
    body.disableCapacityAllocationByEnvironmentAdmins = disableCapacityAllocationByEnvironmentAdmins;
  if (disableSurveyFeedback !== undefined)
    body.disableSurveyFeedback = disableSurveyFeedback;

  // Nested powerPlatform keys
  if (powerAppsDisableShareWithEveryone !== undefined || powerAppsEnableGuestsToMake !== undefined) {
    body.powerPlatform = {
      powerApps: {
        ...(powerAppsDisableShareWithEveryone !== undefined && { disableShareWithEveryone: powerAppsDisableShareWithEveryone }),
        ...(powerAppsEnableGuestsToMake !== undefined && { enableGuestsToMake: powerAppsEnableGuestsToMake }),
      },
    };
  }

  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/tenantsettings?api-version=2021-04-01`;

  await client.post<unknown>(
    PPAdminClient.BASE_BAP,
    path,
    body,
    PPAdminClient.SCOPE_ADMIN
  );

  const changedFields = Object.keys(args).join(", ");
  return {
    content: [{ type: "text" as const, text: `✅ Tenant settings updated successfully.\nChanged fields: ${changedFields}` }],
  };
}
