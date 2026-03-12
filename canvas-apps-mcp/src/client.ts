interface Config { tenantId: string; clientId: string; clientSecret: string; }
interface TokenCache { token: string; expiresAt: number; }

export class CanvasAppsClient {
  private config: Config;
  private tokenCache = new Map<string, TokenCache>();

  static SCOPE = "https://service.powerapps.com/.default";
  static BASE = "https://api.powerapps.com";

  constructor(config: Config) { this.config = config; }

  async getToken(): Promise<string> {
    const cached = this.tokenCache.get("main");
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

    const res = await fetch(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: CanvasAppsClient.SCOPE,
        }).toString(),
      }
    );

    if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache.set("main", { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
    return data.access_token;
  }

  async get<T>(path: string): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${CanvasAppsClient.BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${CanvasAppsClient.BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${await res.text()}`);
    if (res.status === 200 || res.status === 202) {
      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    }
    return {} as T;
  }
}
