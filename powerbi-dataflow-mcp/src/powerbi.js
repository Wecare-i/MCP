/**
 * Gọi Power BI REST API bằng tài khoản người dùng.
 *
 * Lần gọi đầu tiên mở trình duyệt tới trang đăng nhập Microsoft.
 * Token được giữ trong bộ nhớ và tự làm mới đến khi MCP server tắt.
 */

import { InteractiveBrowserCredential } from "@azure/identity";

const API_BASE = "https://api.powerbi.com/v1.0/myorg";
const SCOPE = "https://analysis.windows.net/powerbi/api/.default";
const REQUEST_TIMEOUT_MS = 60_000;

export class PowerBIClient {
    /**
     * @param {{ credential?: { getToken(scope: string): Promise<{ token: string } | null> }, fetchImpl?: typeof fetch }} [options]
     */
    constructor({ credential, fetchImpl } = {}) {
        this.credential = credential ?? createCredential();
        this.fetch = fetchImpl ?? fetch;
    }

    /**
     * GET một endpoint và trả về body dạng text (giữ nguyên nội dung API trả về).
     * @param {string} path Ví dụ: /groups/{groupId}/dataflows/{dataflowId}
     */
    async getText(path) {
        // Không tính thời gian đăng nhập vào timeout: người dùng có thể cần vài phút để đăng nhập
        const accessToken = await this.credential.getToken(SCOPE);
        if (!accessToken) throw new Error("Không lấy được access token Power BI.");

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const response = await this.fetch(`${API_BASE}${path}`, {
                headers: { Authorization: `Bearer ${accessToken.token}` },
                signal: controller.signal,
            });
            const body = await response.text();
            if (!response.ok) {
                throw new Error(`Power BI API Error ${response.status} ${response.statusText}: ${body}`);
            }
            return body;
        } finally {
            clearTimeout(timer);
        }
    }

    /** @param {string} path */
    async getJson(path) {
        return JSON.parse(await this.getText(path));
    }
}

function createCredential() {
    return new InteractiveBrowserCredential({
        tenantId: process.env.POWERBI_TENANT_ID || "organizations",
        // Không truyền clientId thì Azure Identity dùng public client mặc định của SDK.
        // Tenant chặn client đó thì đăng ký app riêng và đặt POWERBI_CLIENT_ID
        ...(process.env.POWERBI_CLIENT_ID ? { clientId: process.env.POWERBI_CLIENT_ID } : {}),
    });
}
