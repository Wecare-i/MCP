/**
 * NotebookLM API Client — HTTP/RPC infrastructure.
 * 
 * Handles batchexecute RPC protocol, authentication, CSRF token management,
 * and automatic auth recovery (3-layer).
 */

import {
  BASE_URL,
  BATCHEXECUTE_URL,
  QUERY_ENDPOINT,
  BL_FALLBACK,
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_BASE_DELAY,
  DEFAULT_MAX_DELAY,
  RPC_NAMES,
} from "./constants.js";
import { AuthenticationError } from "./errors.js";
import type { AuthTokens, CookieRecord, ConversationTurn } from "./types.js";
import { cookiesToHeader, loadCachedTokens } from "./auth.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";

const PAGE_FETCH_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "sec-ch-ua":
    '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
};

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

// ============================================================================
// NotebookLMClient
// ============================================================================

export class NotebookLMClient {
  private cookies: CookieRecord[] | Record<string, string>;
  private csrfToken: string;
  private sessionId: string;
  private bl: string;
  private conversationCache: Map<string, ConversationTurn[]> = new Map();
  private reqidCounter: number;
  public debug: boolean;

  constructor(options: {
    cookies: CookieRecord[] | Record<string, string>;
    csrfToken?: string;
    sessionId?: string;
    buildLabel?: string;
    debug?: boolean;
  }) {
    this.cookies = options.cookies;
    this.csrfToken = options.csrfToken ?? "";
    this.sessionId = options.sessionId ?? "";
    this.bl = options.buildLabel ?? "";
    this.debug = options.debug ?? false;
    this.reqidCounter = Math.floor(Math.random() * 900000) + 100000;
  }

  /**
   * Initialize the client — refresh CSRF token if not provided.
   * Must be called after construction.
   */
  async init(): Promise<void> {
    if (!this.csrfToken) {
      await this.refreshAuthTokens();
    }
  }

  // ==========================================================================
  // Cookie handling
  // ==========================================================================

  private getCookieHeader(): string {
    return cookiesToHeader(this.cookies);
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/`,
      "X-Same-Domain": "1",
      "User-Agent": USER_AGENT,
      Cookie: this.getCookieHeader(),
    };
    if (this.csrfToken) {
      headers["X-Goog-Csrf-Token"] = this.csrfToken;
    }
    return headers;
  }

  // ==========================================================================
  // RPC Protocol
  // ==========================================================================

  private buildRequestBody(rpcId: string, params: unknown): string {
    const paramsJson = JSON.stringify(params);
    const fReq = [[[rpcId, paramsJson, null, "generic"]]];
    const fReqJson = JSON.stringify(fReq);

    const parts = [`f.req=${encodeURIComponent(fReqJson)}`];
    if (this.csrfToken) {
      parts.push(`at=${encodeURIComponent(this.csrfToken)}`);
    }
    return parts.join("&") + "&";
  }

  private buildUrl(rpcId: string, sourcePath = "/"): string {
    const params = new URLSearchParams({
      rpcids: rpcId,
      "source-path": sourcePath,
      bl: process.env.NOTEBOOKLM_BL ?? this.bl ?? BL_FALLBACK,
      hl: process.env.NOTEBOOKLM_HL ?? "en",
      rt: "c",
    });
    if (this.sessionId) {
      params.set("f.sid", this.sessionId);
    }
    return `${BATCHEXECUTE_URL}?${params.toString()}`;
  }

  private parseResponse(responseText: string): unknown[] {
    // Remove anti-XSSI prefix
    let text = responseText;
    if (text.startsWith(")]}'")) {
      text = text.slice(4);
    }

    const lines = text.trim().split("\n");
    const results: unknown[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      // Try parsing as byte count marker
      const num = parseInt(line, 10);
      if (!isNaN(num) && String(num) === line) {
        i++;
        if (i < lines.length) {
          try {
            results.push(JSON.parse(lines[i]));
          } catch {
            // Not valid JSON, skip
          }
        }
        i++;
      } else {
        try {
          results.push(JSON.parse(line));
        } catch {
          // Not valid JSON, skip
        }
        i++;
      }
    }

    return results;
  }

  private extractRpcResult(parsed: unknown[], rpcId: string): unknown {
    for (const chunk of parsed) {
      if (!Array.isArray(chunk)) continue;
      for (const item of chunk) {
        if (!Array.isArray(item) || item.length < 3) continue;
        if (item[0] === "wrb.fr" && item[1] === rpcId) {
          // Check for auth error (error code 16)
          if (
            item.length > 6 &&
            item[6] === "generic" &&
            Array.isArray(item[5]) &&
            item[5].includes(16)
          ) {
            throw new AuthenticationError("RPC Error 16: Authentication expired");
          }

          const resultStr = item[2];
          if (typeof resultStr === "string") {
            try {
              return JSON.parse(resultStr);
            } catch {
              return resultStr;
            }
          }
          return resultStr;
        }
      }
    }
    return null;
  }

  /**
   * Execute an RPC call with automatic auth retry.
   */
  async callRpc(
    rpcId: string,
    params: unknown,
    options: {
      path?: string;
      timeout?: number;
      _retry?: boolean;
      _deepRetry?: boolean;
      _serverRetry?: number;
    } = {}
  ): Promise<unknown> {
    const {
      path = "/",
      timeout = DEFAULT_TIMEOUT,
      _retry = false,
      _deepRetry = false,
      _serverRetry = 0,
    } = options;

    const body = this.buildRequestBody(rpcId, params);
    const url = this.buildUrl(rpcId, path);

    if (this.debug) {
      const methodName = RPC_NAMES[rpcId] ?? "unknown";
      console.error(`[RPC] ${rpcId} (${methodName})`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: this.getDefaultHeaders(),
        body,
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (this.debug) {
        console.error(`[RPC] Response: ${response.status}`);
      }

      // Retry on transient server errors
      if (isRetryableStatus(response.status)) {
        if (_serverRetry < DEFAULT_MAX_RETRIES) {
          const delay = Math.min(
            DEFAULT_BASE_DELAY * 2 ** _serverRetry,
            DEFAULT_MAX_DELAY
          );
          console.error(
            `[RPC] Server error ${response.status}, retry ${_serverRetry + 1}/${DEFAULT_MAX_RETRIES + 1} in ${delay}ms...`
          );
          await sleep(delay);
          return this.callRpc(rpcId, params, {
            ...options,
            _serverRetry: _serverRetry + 1,
          });
        }
        throw new Error(
          `Server error ${response.status} after ${DEFAULT_MAX_RETRIES + 1} attempts`
        );
      }

      // Auth failure at HTTP level
      if (response.status === 401 || response.status === 403) {
        // Fall through to auth recovery
      } else {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        const parsed = this.parseResponse(text);
        const result = this.extractRpcResult(parsed, rpcId);
        return result;
      }
    } catch (err) {
      if (err instanceof AuthenticationError) {
        // Fall through to auth recovery
      } else if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`RPC call ${rpcId} timed out after ${timeout}ms`);
      } else {
        throw err;
      }
    }

    // -- Auth recovery --

    // Layer 1: Refresh CSRF/session tokens
    if (!_retry) {
      try {
        await this.refreshAuthTokens();
        return this.callRpc(rpcId, params, { ...options, _retry: true });
      } catch {
        // CSRF refresh failed, continue to layer 2
      }
    }

    // Layer 2: Reload from disk
    if (!_deepRetry) {
      if (this.tryReloadFromDisk()) {
        return this.callRpc(rpcId, params, {
          ...options,
          _retry: true,
          _deepRetry: true,
        });
      }
    }

    throw new AuthenticationError(
      "Authentication expired. Run 'nlm login' in your terminal to re-authenticate."
    );
  }

  // ==========================================================================
  // Query endpoint (streaming gRPC-style)
  // ==========================================================================

  /**
   * Send a query to a notebook.
   */
  async query(
    notebookId: string,
    queryText: string,
    options: {
      sourceIds?: string[];
      conversationId?: string;
      timeout?: number;
    } = {}
  ): Promise<{
    answer: string;
    conversationId: string;
    sourceIds: string[];
  }> {
    const { sourceIds, conversationId, timeout = 120_000 } = options;

    // Build conversation history for follow-ups
    const history: Array<{ query: string; answer: string }> = [];
    if (conversationId && this.conversationCache.has(conversationId)) {
      const turns = this.conversationCache.get(conversationId)!;
      for (const turn of turns) {
        history.push({ query: turn.query, answer: turn.answer });
      }
    }

    // Build the streaming query request
    const reqid = this.reqidCounter++;
    const endpoint = `${BASE_URL}${QUERY_ENDPOINT}`;

    // Request body: the streaming query uses a different format
    const queryPayload = [
      null,
      null,
      queryText,
      null,
      null,
      notebookId,
      history.length > 0
        ? history.map((h) => [h.query, h.answer])
        : null,
      null,
      null,
      null,
      sourceIds ?? null,
    ];

    const body = `f.req=${encodeURIComponent(JSON.stringify([[queryPayload]]))}` +
      (this.csrfToken ? `&at=${encodeURIComponent(this.csrfToken)}` : "") +
      `&_reqid=${reqid}&`;

    const hl = process.env.NOTEBOOKLM_HL ?? "en";
    const queryUrl = `${endpoint}?bl=${encodeURIComponent(this.bl || BL_FALLBACK)}&hl=${hl}&rt=c` +
      (this.sessionId ? `&f.sid=${this.sessionId}` : "");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(queryUrl, {
        method: "POST",
        headers: this.getDefaultHeaders(),
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Query failed: HTTP ${response.status}`);
      }

      const text = await response.text();
      const { answer, convId, sources } = this.parseQueryResponse(text);

      // Cache conversation turn
      const actualConvId = convId || conversationId || notebookId;
      if (!this.conversationCache.has(actualConvId)) {
        this.conversationCache.set(actualConvId, []);
      }
      this.conversationCache.get(actualConvId)!.push({
        query: queryText,
        answer,
        sourceIds: sources,
      });

      return {
        answer,
        conversationId: actualConvId,
        sourceIds: sources,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Query timed out after ${timeout}ms`);
      }
      throw err;
    }
  }

  private parseQueryResponse(text: string): {
    answer: string;
    convId: string;
    sources: string[];
  } {
    // The streaming response has a specific format
    // Remove anti-XSSI prefix
    let content = text;
    if (content.startsWith(")]}'")) {
      content = content.slice(4);
    }

    let answer = "";
    let convId = "";
    const sources: string[] = [];

    // Parse chunks line by line
    const lines = content.trim().split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i++;
        continue;
      }
      // Check if numeric (chunk size)
      const num = parseInt(line, 10);
      if (!isNaN(num) && String(num) === line) {
        i++;
        if (i < lines.length) {
          try {
            const data = JSON.parse(lines[i]);
            // Extract answer from streaming chunk
            if (Array.isArray(data)) {
              const extracted = this.extractAnswerFromChunk(data);
              if (extracted.text) answer += extracted.text;
              if (extracted.convId) convId = extracted.convId;
              if (extracted.sources.length > 0) sources.push(...extracted.sources);
            }
          } catch {
            // skip
          }
        }
        i++;
      } else {
        try {
          const data = JSON.parse(line);
          if (Array.isArray(data)) {
            const extracted = this.extractAnswerFromChunk(data);
            if (extracted.text) answer += extracted.text;
            if (extracted.convId) convId = extracted.convId;
            if (extracted.sources.length > 0) sources.push(...extracted.sources);
          }
        } catch {
          // skip
        }
        i++;
      }
    }

    return { answer, convId, sources };
  }

  private extractAnswerFromChunk(data: unknown[]): {
    text: string;
    convId: string;
    sources: string[];
  } {
    let text = "";
    let convId = "";
    const sources: string[] = [];

    try {
      // Navigate the nested array structure
      // The answer text is typically at data[0][2][1] or similar positions
      if (Array.isArray(data) && data.length > 0) {
        const inner = data[0];
        if (Array.isArray(inner) && inner.length > 2) {
          // Extract text
          if (typeof inner[2] === "string") {
            text = inner[2];
          } else if (Array.isArray(inner[2])) {
            if (typeof inner[2][0] === "string") {
              text = inner[2][0];
            } else if (Array.isArray(inner[2][0]) && typeof inner[2][0][0] === "string") {
              text = inner[2][0][0];
            }
          }
          // Extract conversation ID (usually at inner[3] or inner[4])
          if (typeof inner[3] === "string") {
            convId = inner[3];
          }
        }
      }
    } catch {
      // Best effort extraction
    }

    return { text, convId, sources };
  }

  // ==========================================================================
  // Auth management
  // ==========================================================================

  /**
   * Refresh CSRF token and session ID by fetching the NotebookLM page.
   */
  async refreshAuthTokens(): Promise<void> {
    const response = await fetch(`${BASE_URL}/`, {
      method: "GET",
      headers: {
        ...PAGE_FETCH_HEADERS,
        Cookie: this.getCookieHeader(),
      },
      redirect: "follow",
    });

    // Check redirect to login
    if (response.url.includes("accounts.google.com")) {
      throw new AuthenticationError(
        "Authentication expired. Run 'nlm login' in your terminal to re-authenticate.",
        "Cookies have expired, need to re-login"
      );
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch NotebookLM page: HTTP ${response.status}`
      );
    }

    const html = await response.text();

    // Extract CSRF token (SNlM0e)
    const csrfMatch = html.match(/"SNlM0e":"([^"]+)"/);
    if (!csrfMatch) {
      throw new Error(
        "Could not extract CSRF token from page. The page structure may have changed."
      );
    }
    this.csrfToken = csrfMatch[1];

    // Extract session ID (FdrFJe) — optional
    const sidMatch = html.match(/"FdrFJe":"([^"]+)"/);
    if (sidMatch) {
      this.sessionId = sidMatch[1];
    }

    // Extract build label (cfb2h)
    const blMatch = html.match(/"cfb2h":"([^"]+)"/);
    if (blMatch) {
      this.bl = blMatch[1];
    }

    if (this.debug) {
      console.error("[Auth] CSRF token refreshed successfully");
    }
  }

  /**
   * Try to reload auth tokens from disk.
   */
  private tryReloadFromDisk(): boolean {
    const cached = loadCachedTokens();
    if (cached?.cookies) {
      this.cookies = cached.cookies;
      this.csrfToken = ""; // Force re-extraction
      this.sessionId = "";
      return true;
    }
    return false;
  }

  /**
   * Clear conversation cache.
   */
  clearConversation(conversationId?: string): void {
    if (conversationId) {
      this.conversationCache.delete(conversationId);
    } else {
      this.conversationCache.clear();
    }
  }
}

// ============================================================================
// Singleton client management
// ============================================================================

let _client: NotebookLMClient | null = null;
let _queryTimeout = Number(process.env.NOTEBOOKLM_QUERY_TIMEOUT ?? "120") * 1000;
let _debugMode = process.env.NOTEBOOKLM_MCP_DEBUG?.toLowerCase() === "true";

export function getQueryTimeout(): number {
  return _queryTimeout;
}

export function setQueryTimeout(timeoutMs: number): void {
  _queryTimeout = timeoutMs;
}

export function setDebugMode(debug: boolean): void {
  _debugMode = debug;
}

/**
 * Get or create the API client.
 */
export async function getClient(): Promise<NotebookLMClient> {
  if (_client) return _client;

  const cookieHeader = process.env.NOTEBOOKLM_COOKIES ?? "";
  const envCsrf = process.env.NOTEBOOKLM_CSRF_TOKEN ?? "";
  const envSessionId = process.env.NOTEBOOKLM_SESSION_ID ?? "";

  let cookies: CookieRecord[] | Record<string, string>;
  let csrfToken = envCsrf;
  let sessionId = envSessionId;
  let buildLabel = "";

  if (cookieHeader) {
    // Parse from env
    const parsed: Record<string, string> = {};
    for (const pair of cookieHeader.split(";")) {
      const trimmed = pair.trim();
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        parsed[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
      }
    }
    cookies = parsed;
  } else {
    // Try cached tokens
    const cached = loadCachedTokens();
    if (!cached) {
      throw new Error(
        "No authentication found. Either:\n" +
        "1. Run 'nlm login' to authenticate via Chrome, or\n" +
        "2. Set NOTEBOOKLM_COOKIES environment variable manually"
      );
    }
    cookies = cached.cookies;
    csrfToken = csrfToken || cached.csrfToken;
    sessionId = sessionId || cached.sessionId;
    buildLabel = cached.buildLabel;
  }

  _client = new NotebookLMClient({
    cookies,
    csrfToken,
    sessionId,
    buildLabel,
    debug: _debugMode,
  });

  await _client.init();
  return _client;
}

/**
 * Reset the client (force re-initialization).
 */
export function resetClient(): void {
  _client = null;
}
