/**
 * AzureCostClient — HTTP client for Azure Cost Management + Billing REST APIs
 * Auth: Azure Service Principal → OAuth2 Client Credentials
 *
 * APIs used:
 *   - https://management.azure.com  (Cost Management, Consumption, Billing)
 */

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

interface Config {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

/** Parse error body — try JSON first, fallback text */
async function parseErrorBody(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { error?: { message?: string; code?: string }; message?: string };
    if (json.error?.message) return `[${json.error.code ?? res.status}] ${json.error.message}`;
    if (json.message) return json.message;
    return text;
  } catch {
    return text || res.statusText;
  }
}

/** Fetch with AbortController timeout */
async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Retry với exponential backoff cho 429/503 */
async function fetchWithRetry(url: string, options: RequestInit, attempt = 0): Promise<Response> {
  const res = await fetchWithTimeout(url, options);

  if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "0", 10);
    const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 16_000);
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, options, attempt + 1);
  }

  return res;
}

export class AzureCostClient {
  private config: Config;
  private tokenCache: TokenCache | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  get subscriptionId(): string {
    return this.config.subscriptionId;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────

  async getToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60_000) {
      return this.tokenCache.token;
    }

    const url = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: AzureCostClient.SCOPE,
    });

    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await parseErrorBody(res);
      throw new Error(`Auth failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  }

  private async headers(): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${await this.getToken()}`,
      "Content-Type": "application/json",
    };
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────────

  async get<T>(path: string): Promise<T> {
    const url = `${AzureCostClient.BASE}${path}`;
    const res = await fetchWithRetry(url, { headers: await this.headers() });
    if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${await parseErrorBody(res)}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${AzureCostClient.BASE}${path}`;
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${await parseErrorBody(res)}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  /** Paginate through nextLink automatically */
  async getAll<T>(path: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = `${AzureCostClient.BASE}${path}`;

    while (nextUrl) {
      const res = await fetchWithRetry(nextUrl, { headers: await this.headers() });
      if (!res.ok) throw new Error(`GET ${nextUrl} failed (${res.status}): ${await parseErrorBody(res)}`);
      const data = (await res.json()) as { value?: T[]; nextLink?: string };
      results.push(...(data.value ?? []));
      nextUrl = data.nextLink ?? null;
    }

    return results;
  }

  // ─── Scopes & Base URLs ────────────────────────────────────────────────

  static SCOPE = "https://management.azure.com/.default";
  static BASE = "https://management.azure.com";
}
