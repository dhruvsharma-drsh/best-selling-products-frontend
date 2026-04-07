const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  priceUsd?: number;
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
    priceUsd?: number;
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

export interface CategoryInfo {
  key: string;
  displayName: string;
  totalProductsEstimate: number;
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

  const res = await fetch(`${API_BASE}/api/products/top?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchProductDetail(
  asin: string,
  country: string = "US"
): Promise<ProductDetail> {
  const res = await fetch(`${API_BASE}/api/products/${asin}?country=${country}`);
  if (!res.ok) throw new Error("Failed to fetch product detail");
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
  const res = await fetch(`${API_BASE}/api/stats${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const res = await fetch(`${API_BASE}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function triggerScrapeAll(country: string = "US"): Promise<{ success: boolean; jobIds: string[] }> {
  const res = await fetch(`${API_BASE}/api/admin/scrape/all?country=${country}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger scrape");
  return res.json();
}

export async function syncRealTime(category: string, country: string): Promise<{ success: boolean; jobId: string }> {
  const res = await fetch(`${API_BASE}/api/products/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, country }),
  });
  if (!res.ok) throw new Error("Failed to trigger sync");
  return res.json();
}

export async function stopRealTimeSync(
  kind: "bulk" | "realtime" = "realtime"
): Promise<{ success: boolean; kind: "bulk" | "realtime"; activeJobId: string | null; removedWaitingJobs: number }> {
  const res = await fetch(`${API_BASE}/api/products/sync/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  if (!res.ok) throw new Error("Failed to stop sync");
  return res.json();
}

// ─── Archive / Wayback Machine API ───

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
  const res = await fetch(`${API_BASE}/api/archive/snapshots?${params}`);
  if (!res.ok) throw new Error("Failed to fetch archive snapshots");
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
  const res = await fetch(`${API_BASE}/api/archive/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch archive products");
  return res.json();
}

export async function fetchAvailableArchives(
  category: string = "electronics"
): Promise<AvailableSnapshot[]> {
  const res = await fetch(
    `${API_BASE}/api/archive/available?category=${category}&limit=200`
  );
  if (!res.ok) throw new Error("Failed to fetch available archives");
  const data: AvailableSnapshotsResponse = await res.json();
  return data.snapshots;
}

export async function fetchProductTrend(asin: string): Promise<ProductTrend> {
  const res = await fetch(`${API_BASE}/api/archive/trends/${asin}`);
  if (!res.ok) throw new Error("Failed to fetch product trend");
  return res.json();
}

export async function triggerArchiveImport(
  archiveUrl: string,
  category: string,
  date: string
): Promise<{ success: boolean; jobId: number }> {
  const res = await fetch(`${API_BASE}/api/archive/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archiveUrl, category, date }),
  });
  if (!res.ok) throw new Error("Failed to trigger archive import");
  return res.json();
}

export async function triggerBulkArchiveImport(
  category: string,
  snapshots: { archiveUrl: string; date: string }[]
): Promise<{ success: boolean; jobIds: number[] }> {
  const res = await fetch(`${API_BASE}/api/archive/import/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, snapshots }),
  });
  if (!res.ok) throw new Error("Failed to trigger bulk import");
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
  const res = await fetch(`${API_BASE}/api/archive/import/status`);
  if (!res.ok) throw new Error("Failed to fetch import status");
  return res.json();
}
