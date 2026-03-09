/**
 * Fabric REST API Client
 *
 * HTTP client cho Fabric REST API (api.fabric.microsoft.com/v1).
 * Dùng cho: Workspace Management, Dataflow Gen2, Notebooks & Spark.
 *
 * Auth: Azure Service Principal → Access Token (scope: api.fabric.microsoft.com)
 */

import { ClientSecretCredential } from "@azure/identity";
import type { FabricConfig } from "../types.js";
import { FABRIC_API_SCOPE, FABRIC_API_BASE, HTTP_TIMEOUT_MS } from "../constants.js";

export class FabricRestClient {
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
     * Lấy access token (có cache để tránh gọi lại Azure AD liên tục)
     */
    private async getAccessToken(): Promise<string> {
        const now = Date.now();
        if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
            return this.cachedToken.token;
        }

        const tokenResponse = await this.credential.getToken(FABRIC_API_SCOPE);
        this.cachedToken = {
            token: tokenResponse.token,
            expiresAt: tokenResponse.expiresOnTimestamp,
        };
        return tokenResponse.token;
    }

    /**
     * Gửi HTTP request tới Fabric REST API
     */
    async request<T = unknown>(
        method: "GET" | "POST" | "PATCH" | "DELETE",
        path: string,
        body?: unknown
    ): Promise<T> {
        const token = await this.getAccessToken();
        const url = `${FABRIC_API_BASE}${path}`;

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
                    `Fabric API Error ${response.status}: ${response.statusText}\n${errorBody}`
                );
            }

            // Một số API trả về 202 (Accepted) không có body
            if (response.status === 202 || response.status === 204) {
                return { status: response.status, headers: Object.fromEntries(response.headers.entries()) } as T;
            }

            return (await response.json()) as T;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * GET request helper
     */
    async get<T = unknown>(path: string): Promise<T> {
        return this.request<T>("GET", path);
    }

    /**
     * POST request helper
     */
    async post<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>("POST", path, body);
    }

    /**
     * Lấy workspace ID từ config hoặc env
     */
    getWorkspaceId(): string {
        const wsId = this.config.workspaceId;
        if (!wsId) {
            throw new Error(
                "FABRIC_WORKSPACE_ID is not configured. Please add it to your .env file."
            );
        }
        return wsId;
    }

    /**
     * Thông tin kết nối
     */
    getConnectionInfo(): Record<string, string> {
        return {
            type: "Fabric REST API",
            baseUrl: FABRIC_API_BASE,
            workspaceId: this.config.workspaceId || "not configured",
        };
    }
}
