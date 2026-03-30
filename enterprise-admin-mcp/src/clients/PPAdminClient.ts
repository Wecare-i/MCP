/**
 * PPAdminClient — HTTP client for Power Platform Admin APIs
 * Auth: Azure Service Principal → OAuth2 Client Credentials
 *
 * APIs used:
 *   - https://api.powerplatform.com  (Admin)
 *   - https://api.bap.microsoft.com  (Business Application Platform — environments)
 *   - https://graph.microsoft.com    (Microsoft 365 — Service Health, etc.)
 */

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

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

export class PPAdminClient {
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
    this.tokenCache.set(scope, {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope,
    });

    return data.access_token;
  }

  private async headers(scope: string): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${await this.getToken(scope)}`,
      "Content-Type": "application/json",
    };
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────────

  async get<T>(baseUrl: string, path: string, scope: string): Promise<T> {
    const res = await fetchWithRetry(`${baseUrl}${path}`, {
      headers: await this.headers(scope),
    });
    if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${await parseErrorBody(res)}`);
    return res.json() as Promise<T>;
  }

  async post<T>(baseUrl: string, path: string, body: unknown, scope: string): Promise<T> {
    const res = await fetchWithRetry(`${baseUrl}${path}`, {
      method: "POST",
      headers: await this.headers(scope),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${await parseErrorBody(res)}`);
    if (res.status === 202 || res.headers.get("content-length") === "0") return {} as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  async patch<T>(baseUrl: string, path: string, body: unknown, scope: string): Promise<T> {
    const res = await fetchWithRetry(`${baseUrl}${path}`, {
      method: "PATCH",
      headers: await this.headers(scope),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed (${res.status}): ${await parseErrorBody(res)}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  async delete(baseUrl: string, path: string, scope: string): Promise<void> {
    const res = await fetchWithRetry(`${baseUrl}${path}`, {
      method: "DELETE",
      headers: await this.headers(scope),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed (${res.status}): ${await parseErrorBody(res)}`);
  }

  /**
   * Paginate through all pages following `nextLink`.
   * Returns flat array of all items from `value` field.
   */
  async getAll<T>(baseUrl: string, path: string, scope: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = `${baseUrl}${path}`;

    while (nextUrl) {
      const isAbsolute = nextUrl.startsWith("http");
      const url = isAbsolute ? nextUrl : `${baseUrl}${nextUrl}`;
      const headers = await this.headers(scope);
      const res = await fetchWithRetry(url, { headers });
      if (!res.ok) throw new Error(`GET ${url} failed (${res.status}): ${await parseErrorBody(res)}`);
      const data = (await res.json()) as { value?: T[]; "@odata.nextLink"?: string; nextLink?: string };
      results.push(...(data.value ?? []));
      nextUrl = data["@odata.nextLink"] ?? data.nextLink ?? null;
    }

    return results;
  }

  // ─── Convenience scopes ────────────────────────────────────────────────

  static SCOPE_ADMIN = "https://service.powerapps.com/.default";
  static SCOPE_FLOW = "https://service.flow.microsoft.com/.default";
  static SCOPE_GRAPH = "https://graph.microsoft.com/.default";

  static BASE_ADMIN = "https://api.powerplatform.com";
  static BASE_BAP = "https://api.bap.microsoft.com";
  static BASE_GRAPH = "https://graph.microsoft.com";
}

