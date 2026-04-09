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
  /** Whether the current API base has been health-checked locally */
  hasValidatedActiveUrl: boolean;
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
  hasValidatedActiveUrl: false,
};

const LOCAL_API_PORTS = ["3001", "3002", "3003"] as const;
let apiBaseDiscoveryPromise: Promise<string> | null = null;

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]"
  );
}

function shouldAutoDiscoverApi(): boolean {
  return (
    typeof window !== "undefined" &&
    isLocalHostname(window.location.hostname)
  );
}

function getApiCandidateUrls(): string[] {
  const candidates = new Set<string>();

  if (config.primaryUrl) candidates.add(config.primaryUrl);
  if (config.fallbackUrl) candidates.add(config.fallbackUrl);

  if (shouldAutoDiscoverApi()) {
    const { protocol, hostname, origin } = window.location;

    candidates.add(origin);

    for (const port of LOCAL_API_PORTS) {
      candidates.add(`${protocol}//${hostname}:${port}`);
    }

    if (hostname === "localhost") {
      for (const port of LOCAL_API_PORTS) {
        candidates.add(`${protocol}//127.0.0.1:${port}`);
      }
    }
  }

  return [...candidates].filter(Boolean);
}

async function probeApiBase(base: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(`${base}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!res.ok) {
      return false;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return false;
    }

    const body = (await res.json().catch(() => null)) as
      | { status?: string }
      | null;

    return body?.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureResolvedApiBase(): Promise<string> {
  if (config.hasValidatedActiveUrl || !shouldAutoDiscoverApi()) {
    return config.activeUrl;
  }

  if (!apiBaseDiscoveryPromise) {
    apiBaseDiscoveryPromise = (async () => {
      for (const candidate of getApiCandidateUrls()) {
        if (await probeApiBase(candidate)) {
          config.activeUrl = candidate;
          config.isFallbackActive = candidate === config.fallbackUrl;
          config.hasValidatedActiveUrl = true;
          return candidate;
        }
      }

      return config.activeUrl;
    })();
  }

  try {
    return await apiBaseDiscoveryPromise;
  } finally {
    apiBaseDiscoveryPromise = null;
  }
}

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
export interface ApiFetchOptions {
  timeoutMs?: number;
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions
): Promise<Response> {
  await ensureResolvedApiBase();
  const fullUrl = buildApiUrl(path);
  const timeoutMs = options?.timeoutMs ?? config.timeoutMs;

  try {
    const res = await fetchWithTimeout(fullUrl, init, timeoutMs);
    config.hasValidatedActiveUrl = true;
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
        timeoutMs
      );

      // Fallback succeeded — switch active URL
      config.activeUrl = config.fallbackUrl;
      config.isFallbackActive = true;
      config.hasValidatedActiveUrl = true;

      return res;
    } catch {
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
    if (await probeApiBase(config.primaryUrl)) {
      console.info(
        "[api-config] Primary API recovered — switching back from fallback"
      );
      config.activeUrl = config.primaryUrl;
      config.isFallbackActive = false;
      config.hasValidatedActiveUrl = true;
      return true;
    }
  } catch {
    // Primary still down
  }
  return false;
}

async function createHttpError(res: Response): Promise<Error> {
  const defaultMessage = `HTTP ${res.status}: ${res.statusText}`;
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await res.clone().json()) as {
        message?: string;
        error?: string;
      };
      const detail = body.message || body.error;
      if (detail) {
        return new Error(`HTTP ${res.status}: ${detail}`);
      }
    } else {
      const text = (await res.clone().text()).trim();
      if (text) {
        return new Error(`HTTP ${res.status}: ${text}`);
      }
    }
  } catch {
    // Fall back to the status text if the error payload is unreadable.
  }

  return new Error(defaultMessage);
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
      throw await createHttpError(res);
    }

    return res;
  } finally {
    clearTimeout(timeout);
  }
}
