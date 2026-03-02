/**
 * @file dataverse-client.ts
 * @description HTTP wrapper cho Dataverse Web API với OData headers
 */

import { MsalAuth } from "../auth/msal-auth.js";

export class DataverseClient {
    private baseUrl: string;
    private apiUrl: string;
    private auth: MsalAuth;

    constructor(dataverseUrl: string, auth: MsalAuth) {
        // Bỏ trailing slash nếu có
        this.baseUrl = dataverseUrl.replace(/\/+$/, "");
        this.apiUrl = `${this.baseUrl}/api/data/v9.2`;
        this.auth = auth;
    }

    /**
     * Tạo headers chuẩn cho Dataverse Web API
     */
    private async getHeaders(
        extra?: Record<string, string>
    ): Promise<Record<string, string>> {
        const token = await this.auth.getAccessToken();
        return {
            Authorization: `Bearer ${token}`,
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Prefer: 'odata.include-annotations="*"',
            ...extra,
        };
    }

    /**
     * GET request đến Dataverse Web API
     */
    async get<T = unknown>(path: string): Promise<T> {
        const url = path.startsWith("http") ? path : `${this.apiUrl}${path}`;
        const headers = await this.getHeaders();

        const response = await fetch(url, { method: "GET", headers });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Dataverse API Error [${response.status}]: ${errorBody}`
            );
        }

        return (await response.json()) as T;
    }

    /**
     * POST request (tạo record hoặc gọi action)
     */
    async post<T = unknown>(path: string, body: unknown): Promise<T> {
        const url = `${this.apiUrl}${path}`;
        const headers = await this.getHeaders();

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Dataverse API Error [${response.status}]: ${errorBody}`
            );
        }

        // POST tạo record thường trả về 204 No Content với OData-EntityId header
        if (response.status === 204) {
            const entityId = response.headers.get("OData-EntityId");
            return { entityId } as T;
        }

        return (await response.json()) as T;
    }

    /**
     * PATCH request (cập nhật record)
     */
    async patch(path: string, body: unknown): Promise<void> {
        const url = `${this.apiUrl}${path}`;
        const headers = await this.getHeaders();

        const response = await fetch(url, {
            method: "PATCH",
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Dataverse API Error [${response.status}]: ${errorBody}`
            );
        }
    }

    /**
     * DELETE request (xóa entity definition hoặc record)
     */
    async delete(path: string): Promise<void> {
        const url = `${this.apiUrl}${path}`;
        const headers = await this.getHeaders();

        const response = await fetch(url, { method: "DELETE", headers });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Dataverse API Error [${response.status}]: ${errorBody}`
            );
        }
    }

    /**
     * POST FetchXML query
     * Dataverse hỗ trợ FetchXML qua URL parameter trên GET request
     */
    async fetchXml<T = unknown>(
        entitySetName: string,
        fetchXml: string
    ): Promise<T> {
        const encodedXml = encodeURIComponent(fetchXml);
        const url = `${this.apiUrl}/${entitySetName}?fetchXml=${encodedXml}`;
        const headers = await this.getHeaders();

        const response = await fetch(url, { method: "GET", headers });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Dataverse FetchXML Error [${response.status}]: ${errorBody}`
            );
        }

        return (await response.json()) as T;
    }
}
