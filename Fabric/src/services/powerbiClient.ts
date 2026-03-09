/**
 * Power BI REST API Client
 *
 * HTTP client cho Power BI REST API (api.powerbi.com/v1.0/myorg).
 * Dùng cho: Semantic Model, Reports & Dashboards.
 *
 * Auth: Azure Service Principal → Access Token (scope: analysis.windows.net)
 */

import { ClientSecretCredential } from "@azure/identity";
import type { FabricConfig } from "../types.js";
import { POWERBI_API_SCOPE, POWERBI_API_BASE, HTTP_TIMEOUT_MS } from "../constants.js";

export class PowerBIClient {
    private credential: ClientSecretCredential;
    private config: FabricConfig;
    private cachedToken: { token: string; expiresAt: number } | null = null;

    constructor(config: FabricConfig) {
        this.config = config;
        this.credential = new ClientSecretCredential(
            config.tenantId,
            config.clientId,
            config.clientSecret
        );
    }

    /**
     * Lấy access token (có cache)
     */
    private async getAccessToken(): Promise<string> {
        const now = Date.now();
        if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
            return this.cachedToken.token;
        }

        const tokenResponse = await this.credential.getToken(POWERBI_API_SCOPE);
        this.cachedToken = {
            token: tokenResponse.token,
            expiresAt: tokenResponse.expiresOnTimestamp,
        };
        return tokenResponse.token;
    }

    /**
     * Gửi HTTP request tới Power BI REST API
     */
    async request<T = unknown>(
        method: "GET" | "POST" | "PATCH" | "DELETE",
        path: string,
        body?: unknown
    ): Promise<T> {
        const token = await this.getAccessToken();
        const url = `${POWERBI_API_BASE}${path}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(
                    `Power BI API Error ${response.status}: ${response.statusText}\n${errorBody}`
                );
            }

            if (response.status === 202 || response.status === 204) {
                return { status: response.status } as T;
            }

            return (await response.json()) as T;
        } finally {
            clearTimeout(timeout);
        }
    }

    async get<T = unknown>(path: string): Promise<T> {
        return this.request<T>("GET", path);
    }

    async post<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>("POST", path, body);
    }

    /**
     * Lấy workspace ID dạng Power BI group ID
     */
    getGroupId(): string {
        const wsId = this.config.workspaceId;
        if (!wsId) {
            throw new Error(
                "FABRIC_WORKSPACE_ID is not configured. Please add it to your .env file."
            );
        }
        return wsId;
    }

    getConnectionInfo(): Record<string, string> {
        return {
            type: "Power BI REST API",
            baseUrl: POWERBI_API_BASE,
            workspaceId: this.config.workspaceId || "not configured",
        };
    }
}
