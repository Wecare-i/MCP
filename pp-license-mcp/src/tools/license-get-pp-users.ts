import { LicenseClient } from "../client.js";

// Power Platform license SKU IDs (static — from MS documentation)
const PP_SKU_IDS: Record<string, string> = {
  "9c0dab89-a30c-4117-86e7-97bda240acd2": "Power Apps per user",
  "b30411f5-fea1-4a59-9ad9-3db7c7ead579": "Power Apps per user (GCC)",
  "f30db892-07e9-47e9-837c-80727f46fd3d": "Power Automate per user",
  "57ff2da0-773e-42df-b2af-ffb7a2317929": "Power Automate per user with Attended RPA",
  "358e1c8a-4a57-4a2d-aa3b-e9e1a26f9a8c": "Power Automate Hosted RPA addon",
  "ca46f6fb-14aa-4bef-8b4d-d4f9bc62e43e": "Power Automate unattended RPA addon",
};

export const definition = {
  name: "pp_license_get_pp_users",
  description:
    "List users who have Power Apps or Power Automate per-user licenses assigned. Shows user name, email, and which PP licenses they hold.",
  inputSchema: {
    type: "object",
    properties: {
      licenseType: {
        type: "string",
        enum: ["all", "powerapps", "powerautomate"],
        description: "Filter by license type. Default: all",
      },
      top: {
        type: "number",
        description: "Max users to return. Default: 50",
      },
    },
  },
};

interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  assignedLicenses?: { skuId: string }[];
}

export async function handler(args: Record<string, unknown>, client: LicenseClient) {
  const licenseType = (args.licenseType as string | undefined) ?? "all";
  const top = (args.top as number | undefined) ?? 50;

  // Get all PP SKU IDs to filter on
  const targetSkuIds = Object.keys(PP_SKU_IDS).filter((id) => {
    const name = PP_SKU_IDS[id].toLowerCase();
    if (licenseType === "powerapps") return name.includes("apps");
    if (licenseType === "powerautomate") return name.includes("automate");
    return true;
  });

  // Fetch users with assigned licenses
  const path = `/v1.0/users?$select=id,displayName,userPrincipalName,assignedLicenses&$top=${Math.min(top, 999)}&$filter=assignedLicenses/$count ne 0&$count=true`;

  let users: GraphUser[] = [];
  try {
    const res = await client.get<{ value: GraphUser[] }>(
      LicenseClient.BASE_GRAPH,
      path,
      LicenseClient.SCOPE_GRAPH
    );
    users = res.value ?? [];
  } catch {
    // Fallback without $count (requires ConsistencyLevel header not supported by simple GET)
    const fallbackPath = `/v1.0/users?$select=id,displayName,userPrincipalName,assignedLicenses&$top=${Math.min(top, 999)}`;
    const res = await client.get<{ value: GraphUser[] }>(
      LicenseClient.BASE_GRAPH,
      fallbackPath,
      LicenseClient.SCOPE_GRAPH
    );
    users = res.value ?? [];
  }

  // Filter users who have at least one target PP SKU
  const ppUsers = users
    .filter((u) =>
      (u.assignedLicenses ?? []).some((lic) => targetSkuIds.includes(lic.skuId))
    )
    .slice(0, top);

  if (ppUsers.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No users found with ${licenseType === "all" ? "Power Platform" : licenseType} per-user licenses.`,
        },
      ],
    };
  }

  const lines = [
    `👥 Power Platform Licensed Users (${licenseType})`,
    `Found: ${ppUsers.length} user(s)`,
    "",
  ];

  for (const user of ppUsers) {
    const assignedPP = (user.assignedLicenses ?? [])
      .filter((lic) => targetSkuIds.includes(lic.skuId))
      .map((lic) => PP_SKU_IDS[lic.skuId] ?? lic.skuId);

    lines.push(
      `• ${user.displayName}`,
      `  Email:    ${user.userPrincipalName}`,
      `  Licenses: ${assignedPP.join(", ")}`,
      ""
    );
  }

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
