/**
 * @file msal-auth.ts
 * @description Azure AD authentication module sử dụng MSAL Client Credentials flow
 */

import {
    ConfidentialClientApplication,
    Configuration,
    AuthenticationResult,
} from "@azure/msal-node";
import type { DataverseConfig } from "../types/dataverse.js";

export class MsalAuth {
    private msalClient: ConfidentialClientApplication;
    private scope: string;

    constructor(config: DataverseConfig) {
        const msalConfig: Configuration = {
            auth: {
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                authority: `https://login.microsoftonline.com/${config.tenantId}`,
            },
        };

        this.msalClient = new ConfidentialClientApplication(msalConfig);
        // Scope dạng: https://yourorg.crm5.dynamics.com/.default
        this.scope = `${config.url}/.default`;
    }

    /**
     * Lấy access token qua Client Credentials flow.
     * MSAL tự động cache và refresh token khi cần.
     */
    async getAccessToken(): Promise<string> {
        const result: AuthenticationResult | null =
            await this.msalClient.acquireTokenByClientCredential({
                scopes: [this.scope],
            });

        if (!result || !result.accessToken) {
            throw new Error(
                "Không thể lấy access token từ Azure AD. Kiểm tra lại credentials."
            );
        }

        return result.accessToken;
    }
}
