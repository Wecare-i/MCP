/**
 * PowerPlatformClient — HTTP client for Power Platform Admin APIs
 * Auth: Azure Service Principal → OAuth2 Client Credentials
 *
 * APIs used:
 *   - https://api.powerplatform.com  (Admin)
 *   - https://api.bap.microsoft.com  (Business Application Platform — environments)
 */

interface Config {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
  scope: string;
}

export class PowerPlatformClient {
  private config: Config;
  private tokenCache = new Map<string, TokenCache>();

  constructor(config: Config) {
    this.config = config;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────

  async getToken(scope: string): Promise<string> {
    const cached = this.tokenCache.get(scope);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.token;
    }

    const url = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Auth failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache.set(scope, {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope,
    });

    return data.access_token;
  }

  // ─── HTTP ──────────────────────────────────────────────────────────────

  async get<T>(baseUrl: string, path: string, scope: string): Promise<T> {
    const token = await this.getToken(scope);
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GET ${path} failed (${res.status}): ${err}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T>(baseUrl: string, path: string, body: unknown, scope: string): Promise<T> {
    const token = await this.getToken(scope);
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`POST ${path} failed (${res.status}): ${err}`);
    }
    // 202 Accepted returns empty body
    if (res.status === 202 || res.headers.get("content-length") === "0") {
      return {} as T;
    }
    return res.json() as Promise<T>;
  }

  // ─── Convenience scopes ────────────────────────────────────────────────

  static SCOPE_ADMIN = "https://service.powerapps.com/.default";
  static SCOPE_FLOW = "https://service.flow.microsoft.com/.default";

  static BASE_ADMIN = "https://api.powerplatform.com";
  static BASE_BAP = "https://api.bap.microsoft.com";
}
