import { PPAdminClient } from "../../clients/PPAdminClient.js";

export const definition = {
  name: "service_health_status",
  description: "Get current Microsoft 365 Service Health status for Power Platform services (Power Apps, Power Automate, Dataverse, Power BI) from Microsoft Graph.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

// Power Platform related service IDs in Microsoft 365 Health
const PP_SERVICE_NAMES = [
  "Power Apps",
  "Power Automate",
  "Microsoft Dataverse",
  "Power BI",
  "Power Platform",
];

interface ServiceHealth {
  id: string;
  service: string;
  status: string;
}

export async function handler(
  _args: Record<string, unknown>,
  client: PPAdminClient
) {
  try {
    // Microsoft Graph — Service Health API (requires ServiceHealth.Read.All)
    const data = await client.get<{ value: ServiceHealth[] }>(
      "https://graph.microsoft.com",
      "/v1.0/admin/serviceAnnouncement/healthOverviews?$select=id,service,status",
      "https://graph.microsoft.com/.default"
    );

    const allServices = data.value || [];

    // Filter to Power Platform related services
    const ppServices = allServices.filter((s) =>
      PP_SERVICE_NAMES.some((name) =>
        s.service.toLowerCase().includes(name.toLowerCase())
      )
    );

    const display = ppServices.length > 0 ? ppServices : allServices;

    const result = display.map((s) => ({
      service: s.service,
      status: s.status,
      healthy: s.status === "serviceOperational",
    }));

    const hasIssues = result.filter((s) => !s.healthy);
    const healthy = result.filter((s) => s.healthy);

    let text = `## Microsoft 365 Service Health — Power Platform\n\n`;
    text += `✅ Healthy: ${healthy.length} | ⚠️ Issues: ${hasIssues.length}\n\n`;

    if (hasIssues.length > 0) {
      text += `### ⚠️ Services with Issues\n${JSON.stringify(hasIssues, null, 2)}\n\n`;
    }
    text += `### All Status\n${JSON.stringify(result, null, 2)}`;

    return { content: [{ type: "text" as const, text }] };
  } catch (err) {
    // Fallback: Graph token may not be available — use environment states
    const msg = err instanceof Error ? err.message : String(err);
    const text = `⚠️ Could not fetch Microsoft 365 Service Health (Graph API may not be consented — ServiceHealth.Read.All required).\nError: ${msg}\n\nTo enable: grant 'ServiceHealth.Read.All' application permission to the Service Principal in Azure AD.`;
    return { content: [{ type: "text" as const, text }], isError: true };
  }
}
