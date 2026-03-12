interface Config { tenantId: string; clientId: string; clientSecret: string; }
interface TokenCache { token: string; expiresAt: number; }

export class FlowClient {
  private config: Config;
  private cache: TokenCache | null = null;

  static SCOPE = "https://service.flow.microsoft.com/.default";
  static BASE = "https://api.flow.microsoft.com";

  constructor(config: Config) { this.config = config; }

  async getToken(): Promise<string> {
    if (this.cache && this.cache.expiresAt > Date.now() + 60_000) return this.cache.token;
    const res = await fetch(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: FlowClient.SCOPE,
        }).toString(),
      }
    );
    if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.cache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }

  async get<T>(path: string): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${FlowClient.BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown = {}): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${FlowClient.BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${await res.text()}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }
}
