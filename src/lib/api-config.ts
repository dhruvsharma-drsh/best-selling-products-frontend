/**
 * Centralized API Configuration Layer
 *
 * All services consume the API via this single module.
 * Supports multiple environments (dev, staging, prod) through
 * environment variables, with automatic fallback from online → local.
 *
 * Environment variables (set in .env.local or hosting platform):
 *   NEXT_PUBLIC_API_URL          — Primary API URL (online/prod)
 *   NEXT_PUBLIC_API_URL_FALLBACK — Fallback API URL (local dev server)
 *   NEXT_PUBLIC_API_TIMEOUT      — Request timeout in ms (default: 8000)
 */

// ─── Configuration ──────────────────────────────────────────────

interface ApiConfig {
  /** Primary API base URL (online / production) */
  primaryUrl: string;
  /** Fallback API base URL (local dev server) */
  fallbackUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Currently active base URL (switches on fallback) */
  activeUrl: string;
  /** Whether we've fallen back to the secondary URL */
  isFallbackActive: boolean;
}

function normalizeUrl(url: string | undefined): string {
  return (url ?? "").trim().replace(/\/+$/, "");
}

const PRIMARY_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL);
const FALLBACK_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_API_URL_FALLBACK || "http://localhost:3001"
);
const TIMEOUT_MS = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "8000",
  10
);

const config: ApiConfig = {
  primaryUrl: PRIMARY_URL,
  fallbackUrl: FALLBACK_URL,
  timeoutMs: TIMEOUT_MS,
  activeUrl: PRIMARY_URL || FALLBACK_URL,
  isFallbackActive: !PRIMARY_URL,
};

// ─── Public Accessors ───────────────────────────────────────────

/** The currently active API base URL. */
export function getApiBase(): string {
  return config.activeUrl;
}

/** Human-readable display of active URL (used in error messages). */
export function getApiBaseDisplay(): string {
  if (!config.activeUrl) return "No API URL configured";
  const tag = config.isFallbackActive ? " (fallback)" : "";
  return `${config.activeUrl}${tag}`;
}

/** Build a full API URL from a path segment. */
export function buildApiUrl(path: string): string {
  const base = getApiBase();
  if (!base) {
    throw new Error(
      "No API URL configured. Set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_URL_FALLBACK."
    );
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// ─── Resilient Fetch with Fallback ──────────────────────────────

/**
 * Performs a fetch request against the active API endpoint.
 * If the primary URL fails (network error or timeout), automatically
 * retries against the fallback URL.
 *
 * Once fallback succeeds, subsequent requests continue using fallback
 * until the primary is confirmed reachable again via `checkPrimaryHealth()`.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const fullUrl = buildApiUrl(path);

  try {
    const res = await fetchWithTimeout(fullUrl, init, config.timeoutMs);
    return res;
  } catch (primaryError) {
    // If we're already on fallback, or there's no distinct fallback, re-throw
    if (
      config.isFallbackActive ||
      config.fallbackUrl === config.activeUrl ||
      !config.fallbackUrl
    ) {
      throw primaryError;
    }

    // Attempt fallback
    console.warn(
      `[api-config] Primary API failed (${config.primaryUrl}), falling back to ${config.fallbackUrl}`
    );

    const fallbackFullUrl = `${config.fallbackUrl}${path.startsWith("/") ? path : `/${path}`}`;

    try {
      const res = await fetchWithTimeout(
        fallbackFullUrl,
        init,
        config.timeoutMs
      );

      // Fallback succeeded — switch active URL
      config.activeUrl = config.fallbackUrl;
      config.isFallbackActive = true;

      return res;
    } catch (fallbackError) {
      // Both failed — throw the original primary error
      throw primaryError;
    }
  }
}

// ─── Health Check & Recovery ────────────────────────────────────

/**
 * Attempts to reach the primary API health endpoint.
 * If successful and we were on fallback, switches back to primary.
 * Call this periodically (e.g. every 60s) to auto-recover.
 */
export async function checkPrimaryHealth(): Promise<boolean> {
  if (!config.primaryUrl || !config.isFallbackActive) return true;

  try {
    const res = await fetchWithTimeout(
      `${config.primaryUrl}/api/health`,
      { method: "GET" },
      5000
    );
    if (res.ok) {
      console.info(
        "[api-config] Primary API recovered — switching back from fallback"
      );
      config.activeUrl = config.primaryUrl;
      config.isFallbackActive = false;
      return true;
    }
  } catch {
    // Primary still down
  }
  return false;
}

// ─── Internal Helpers ───────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const existingSignal = init?.signal;

  // Combine external abort signal with our timeout
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (existingSignal) {
    existingSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res;
  } finally {
    clearTimeout(timeout);
  }
}
