/**
 * API Client — All data-fetching functions for the platform.
 *
 * Consumes the centralized api-config layer for URL resolution,
 * timeout handling, and automatic online → local fallback.
 *
 * No hardcoded URLs — everything is driven by environment variables.
 */

import { apiFetch, getApiBaseDisplay } from "./api-config";

// Re-export for backward compatibility (used by ProductTable error state)
export const API_BASE_DISPLAY = getApiBaseDisplay();

// ─── Types ──────────────────────────────────────────────────────

export interface Product {
  rank: number;
  asin: string;
  country: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  productUrl: string;
  category: string;
  bsrCategory: number;
  estimatedMonthlySales?: number;
  estimatedMonthlyRevenue?: number;
  priceLocal?: number;
  priceUsd?: number;
  priceCurrency?: { code: string; symbol: string; locale: string };
  rating?: number;
  reviewCount?: number;
  lastUpdated?: string;
}

export interface ProductDetail {
  product: {
    asin: string;
    title: string;
    brand?: string;
    imageUrl?: string;
    productUrl: string;
    category: string;
    priceLocal?: number;
    priceUsd?: number;
    priceCurrency?: { code: string; symbol: string; locale: string };
    priceConversion?: {
      usdStatus: "available" | "unavailable";
      usdSource:
        | "stored_product"
        | "stored_snapshot"
        | "live_api"
        | "missing_price"
        | "conversion_error";
      exchangeRate?: number | null;
      message?: string | null;
    };
  };
  analytics: {
    currentBsr?: number;
    estimatedMonthlySales?: number;
    estimatedMonthlyRevenue?: number;
    confidenceLevel?: "high" | "medium" | "low";
    confidenceReason?: string;
    stabilityScore?: number;
    trend?: "rising" | "falling" | "stable";
    peakBsr?: number;
    avgBsr?: number;
  };
  history: {
    time: string;
    bsr: number;
    estimatedSales: number;
    revenue: number;
  }[];
}

export interface PlatformStats {
  totalProducts: number;
  totalSnapshots: number;
  lastUpdated: string | null;
  categoriesTracked: number;
}

export interface TriggerWorldScrapeResponse {
  success: boolean;
  jobIds: string[];
  runId?: string | null;
  startedAt: string;
  priorityCountry?: string;
  selectedCountries?: string[];
  scope?: "all" | "selected";
  countryCount: number;
  categoryCount: number;
  totalJobs: number;
  productLimit?: number;
  replacedActiveJobId?: string | null;
  removedWaitingJobs?: number;
}

export interface ScrapeBatchProgress {
  runId?: string;
  isFetching?: boolean;
  status?: "idle" | "running" | "completed" | "completed_with_issues" | "stopped";
  totalCountries?: number;
  totalCategoriesPerCountry?: number;
  totalJobs?: number;
  startedJobs: number;
  finishedJobs?: number;
  productsFound: number;
  countriesStarted: number;
  completedCountries?: string[];
  currentCountry?: string | null;
  currentCategory?: string | null;
  countryProgress?: Array<{
    country: string;
    status: "fetching" | "completed";
    completedCategories: number;
    totalCategories: number;
    failedCategories: number;
  }>;
  statusBreakdown: Record<string, number>;
  recentJobs: Array<{
    id: number | string;
    country: string;
    category: string;
    status: string;
    productsFound: number;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  }>;
}

export interface CategoryInfo {
  key: string;
  displayName: string;
  totalProductsEstimate: number;
}

export interface SyncCountryConfig {
  code: string;
  label: string;
  domain: string;
  currencyCode: string;
  currencySymbol: string;
  platform: "amazon" | "local_fallback";
  locale: string;
}

export interface SyncConfigResponse {
  defaultProductLimit: number;
  productLimitOptions: number[];
  countries: SyncCountryConfig[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    timeframe: string;
    totalPages: number;
  };
}

// ─── Core API Functions ─────────────────────────────────────────

export async function fetchTopProducts(params: {
  country?: string;
  startDate?: string | null;
  endDate?: string | null;
  category?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params.country) searchParams.set("country", params.country);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.category && params.category !== "all")
    searchParams.set("category", params.category);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);

  const res = await apiFetch(`/api/products/top?${searchParams}`);
  return res.json();
}

export async function fetchProductDetail(
  asin: string,
  country: string = "US"
): Promise<ProductDetail> {
  const res = await apiFetch(`/api/products/${asin}?country=${country}`);
  return res.json();
}

export async function fetchStats(
  country?: string,
  category?: string
): Promise<PlatformStats> {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (category && category !== "all") params.set("category", category);

  const query = params.toString();
  const res = await apiFetch(`/api/stats${query ? `?${query}` : ""}`);
  return res.json();
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const res = await apiFetch("/api/categories");
  return res.json();
}

export async function triggerScrapeAll(
  country: string = "US",
  productLimit?: number
): Promise<{ success: boolean; jobIds: string[]; productLimit: number }> {
  const params = new URLSearchParams({ country });
  if (productLimit) params.set("limit", String(productLimit));
  const res = await apiFetch(
    `/api/admin/scrape/all?${params}`,
    { method: "POST" },
    { timeoutMs: 45_000 }
  );
  return res.json();
}

export async function triggerScrapeWorldwide(
  priorityCountry?: string,
  productLimit?: number,
  selectedCountries?: string[],
  includeRemainingCountries: boolean = true
): Promise<TriggerWorldScrapeResponse> {
  const params = new URLSearchParams();
  if (priorityCountry) params.set("country", priorityCountry);
  if (productLimit) params.set("limit", String(productLimit));
  if (selectedCountries && selectedCountries.length > 0) {
    params.set("countries", selectedCountries.join(","));
  }
  params.set("scope", includeRemainingCountries ? "all" : "selected");
  const url = `/api/admin/scrape/world${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await apiFetch(
    url,
    { method: "POST" },
    { timeoutMs: 45_000 }
  );
  return res.json();
}

export async function fetchScrapeBatchProgress(
  since: string
): Promise<ScrapeBatchProgress> {
  const params = new URLSearchParams({ since });
  const res = await apiFetch(`/api/admin/scrape-jobs/progress?${params}`);
  return res.json();
}

export async function syncRealTime(
  category: string,
  country: string,
  productLimit?: number
): Promise<{ success: boolean; jobId: string; productLimit: number }> {
  const res = await apiFetch("/api/products/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, country, productLimit }),
  });
  return res.json();
}

export async function fetchSyncConfig(): Promise<SyncConfigResponse> {
  const res = await apiFetch("/api/meta/sync-config");
  return res.json();
}

export async function stopRealTimeSync(
  kind: "bulk" | "realtime" = "realtime"
): Promise<{ success: boolean; kind: "bulk" | "realtime"; activeJobId: string | null; removedWaitingJobs: number }> {
  const res = await apiFetch(
    "/api/products/sync/stop",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    },
    { timeoutMs: 45_000 }
  );
  return res.json();
}

// ─── Archive / Wayback Machine API ──────────────────────────────

export interface ArchiveSnapshotDate {
  date: string;
  category: string;
  productCount: number;
}

export interface ArchiveProduct {
  id: number;
  asin: string;
  productName: string;
  rank: number;
  category: string;
  date: string;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  archiveUrl: string;
}

export interface ArchiveProductsResponse {
  data: ArchiveProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AvailableSnapshot {
  timestamp: string;
  originalUrl: string;
  date: string;
  archiveUrl: string;
  alreadyImported: boolean;
}

export interface AvailableSnapshotsResponse {
  category: string;
  totalAvailable: number;
  snapshots: AvailableSnapshot[];
}

export interface ProductTrend {
  asin: string;
  productName: string;
  dataPoints: {
    date: string;
    rank: number;
    category: string;
    rating: number | null;
    reviewCount: number | null;
  }[];
}

export async function fetchArchiveSnapshots(
  category?: string
): Promise<ArchiveSnapshotDate[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  const res = await apiFetch(`/api/archive/snapshots?${params}`);
  return res.json();
}

export async function fetchArchiveProducts(
  date: string,
  category?: string,
  search?: string,
  page: number = 1,
  limit: number = 50
): Promise<ArchiveProductsResponse> {
  const params = new URLSearchParams({ date, page: String(page), limit: String(limit) });
  if (category && category !== "all") params.set("category", category);
  if (search) params.set("search", search);
  const res = await apiFetch(`/api/archive/products?${params}`);
  return res.json();
}

export async function fetchAvailableArchives(
  category: string = "electronics"
): Promise<AvailableSnapshot[]> {
  const res = await apiFetch(
    `/api/archive/available?category=${category}&limit=200`
  );
  const data: AvailableSnapshotsResponse = await res.json();
  return data.snapshots;
}

export async function fetchProductTrend(asin: string): Promise<ProductTrend> {
  const res = await apiFetch(`/api/archive/trends/${asin}`);
  return res.json();
}

export async function triggerArchiveImport(
  archiveUrl: string,
  category: string,
  date: string
): Promise<{ success: boolean; jobId: number }> {
  const res = await apiFetch("/api/archive/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archiveUrl, category, date }),
  });
  return res.json();
}

export async function triggerBulkArchiveImport(
  category: string,
  snapshots: { archiveUrl: string; date: string }[]
): Promise<{ success: boolean; jobIds: number[] }> {
  const res = await apiFetch("/api/archive/import/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, snapshots }),
  });
  return res.json();
}

export async function fetchImportStatus(): Promise<
  {
    id: number;
    archiveUrl: string;
    category: string;
    date: string;
    status: string;
    productsFound: number;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  }[]
> {
  const res = await apiFetch("/api/archive/import/status");
  return res.json();
}
