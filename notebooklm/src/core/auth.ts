/**
 * Authentication helper for NotebookLM MCP.
 * Reads auth tokens from ~/.notebooklm-mcp-cli/ (shared with Python CLI).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AuthTokens, CookieRecord } from "./types.js";
import { REQUIRED_COOKIES } from "./constants.js";

// ============================================================================
// Paths
// ============================================================================

const CONFIG_DIR = join(homedir(), ".notebooklm-mcp-cli");
const AUTH_CACHE_FILE = join(CONFIG_DIR, "auth.json");
const PROFILES_DIR = join(CONFIG_DIR, "profiles");

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getProfileDir(profileName = "default"): string {
  return join(PROFILES_DIR, profileName);
}

// ============================================================================
// Load / Save tokens
// ============================================================================

/**
 * Load tokens from default profile or legacy auth cache.
 */
export function loadCachedTokens(): AuthTokens | null {
  // 1. Try default profile first
  const defaultProfile = getProfileDir("default");
  const cookiesFile = join(defaultProfile, "cookies.json");
  const metadataFile = join(defaultProfile, "metadata.json");

  if (existsSync(cookiesFile)) {
    try {
      const cookies = JSON.parse(readFileSync(cookiesFile, "utf-8"));
      let metadata: Record<string, string> = {};
      if (existsSync(metadataFile)) {
        metadata = JSON.parse(readFileSync(metadataFile, "utf-8"));
      }
      return {
        cookies,
        csrfToken: metadata.csrf_token ?? "",
        sessionId: metadata.session_id ?? "",
        buildLabel: metadata.build_label ?? "",
        extractedAt: metadata.last_validated
          ? new Date(metadata.last_validated).getTime() / 1000
          : Date.now() / 1000,
      };
    } catch {
      // Corrupted profile, fall through to legacy
    }
  }

  // 2. Fallback to legacy auth.json
  if (!existsSync(AUTH_CACHE_FILE)) return null;

  try {
    const data = JSON.parse(readFileSync(AUTH_CACHE_FILE, "utf-8"));
    return {
      cookies: data.cookies,
      csrfToken: data.csrf_token ?? "",
      sessionId: data.session_id ?? "",
      buildLabel: data.build_label ?? "",
      extractedAt: data.extracted_at ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Save tokens to legacy auth cache.
 */
export function saveTokensToCache(tokens: AuthTokens): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const data = {
    cookies: tokens.cookies,
    csrf_token: tokens.csrfToken,
    session_id: tokens.sessionId,
    build_label: tokens.buildLabel,
    extracted_at: tokens.extractedAt,
  };

  writeFileSync(AUTH_CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ============================================================================
// Cookie helpers
// ============================================================================

/**
 * Validate that required cookies are present.
 */
export function validateCookies(
  cookies: CookieRecord[] | Record<string, string>
): boolean {
  if (Array.isArray(cookies)) {
    const names = new Set(cookies.map((c) => c.name));
    return REQUIRED_COOKIES.every((r) => names.has(r));
  }
  return REQUIRED_COOKIES.every((r) => r in cookies);
}

/**
 * Convert cookies to a simple Record<string, string>.
 */
export function cookiesToDict(
  cookies: CookieRecord[] | Record<string, string>
): Record<string, string> {
  if (Array.isArray(cookies)) {
    const result: Record<string, string> = {};
    for (const c of cookies) {
      if (c.name && c.value) result[c.name] = c.value;
    }
    return result;
  }
  return cookies;
}

/**
 * Convert cookies to a Cookie header string.
 */
export function cookiesToHeader(
  cookies: CookieRecord[] | Record<string, string>
): string {
  const dict = cookiesToDict(cookies);
  return Object.entries(dict)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Parse cookies from a Chrome export header string.
 */
export function extractCookiesFromChromeExport(
  cookieHeader: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      result[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
  return result;
}
