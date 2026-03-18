import { PowerPlatformClient } from "../client.js";

export const definition = {
  name: "tenant_settings_get",
  description: "Get tenant-level Power Platform settings and policies (governance, sharing, analytics).",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

interface TenantSettings {
  disableEnvironmentCreationByNonAdminUsers?: boolean;
  disablePortalsCreationByNonAdminUsers?: boolean;
  disableSurveyFeedback?: boolean;
  disableNPSCommentsReachout?: boolean;
  disableNewsletterSendout?: boolean;
  disableEnvironmentCreationByNonAdminUsersEnabled?: boolean;
  disableCopilot?: boolean;
  disableCapacityAllocationByEnvironmentAdmins?: boolean;
  powerPlatform?: {
    search?: { disableDocsSearch?: boolean; disableCommunitySearch?: boolean };
    teamsIntegration?: { shareWithColleaguesUserLimit?: number };
    powerApps?: {
      disableShareWithEveryone?: boolean;
      enableGuestsToMake?: boolean;
      disableMembersIndicator?: boolean;
    };
    powerAutomate?: { disableCopilot?: boolean };
    environments?: {
      disablePreferredDataLocationForTeamsEnvironment?: boolean;
    };
  };
  [key: string]: unknown;
}

export async function handler(
  _args: Record<string, unknown>,
  client: PowerPlatformClient
) {
  const path = `/providers/Microsoft.BusinessAppPlatform/scopes/admin/tenantsettings?api-version=2021-04-01`;

  const data = await client.get<TenantSettings>(
    PowerPlatformClient.BASE_BAP,
    path,
    PowerPlatformClient.SCOPE_ADMIN
  );

  // Extract key governance settings (filter out noise)
  const summary = {
    environmentCreation: {
      disableByNonAdmins: data.disableEnvironmentCreationByNonAdminUsers ?? false,
    },
    portals: {
      disableByNonAdmins: data.disablePortalsCreationByNonAdminUsers ?? false,
    },
    copilot: {
      disabled: data.disableCopilot ?? false,
      powerAutomateDisabled: data.powerPlatform?.powerAutomate?.disableCopilot ?? false,
    },
    powerApps: {
      disableShareWithEveryone: data.powerPlatform?.powerApps?.disableShareWithEveryone ?? false,
      enableGuestsToMake: data.powerPlatform?.powerApps?.enableGuestsToMake ?? false,
    },
    search: {
      disableDocsSearch: data.powerPlatform?.search?.disableDocsSearch ?? false,
      disableCommunitySearch: data.powerPlatform?.search?.disableCommunitySearch ?? false,
    },
    feedback: {
      disableSurvey: data.disableSurveyFeedback ?? false,
      disableNPS: data.disableNPSCommentsReachout ?? false,
    },
    capacity: {
      disableAllocationByEnvAdmins: data.disableCapacityAllocationByEnvironmentAdmins ?? false,
    },
  };

  const text = `## Tenant Settings — Power Platform Governance\n\n${JSON.stringify(summary, null, 2)}`;

  return { content: [{ type: "text" as const, text }] };
}
