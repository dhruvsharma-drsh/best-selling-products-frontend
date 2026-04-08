"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";

import { DateTimeline } from "@/components/DateTimeline";
import { ArchiveTable } from "@/components/ArchiveTable";
import { TrendChart } from "@/components/TrendChart";
import { ImportPanel } from "@/components/ImportPanel";

import {
  fetchArchiveSnapshots,
  fetchArchiveProducts,
  fetchAvailableArchives,
  fetchProductTrend,
  triggerArchiveImport,
  triggerBulkArchiveImport,
  type ProductTrend,
} from "@/lib/api";
import { getApiBase, getApiBaseDisplay } from "@/lib/api-config";

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackedAsins, setTrackedAsins] = useState<string[]>([]);

  // Fetch imported snapshot dates
  const {
    data: snapshots = [],
    isLoading: snapshotsLoading,
    isError: snapshotsError,
    error: snapshotsErrorObj,
    refetch: refetchSnapshots,
  } = useQuery({
    queryKey: ["archive-snapshots", category],
    queryFn: () => fetchArchiveSnapshots(category !== "all" ? category : undefined),
    retry: 2,
  });

  // Fetch products for selected date
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["archive-products", selectedDate, category, searchQuery],
    queryFn: () =>
      fetchArchiveProducts(selectedDate!, category, searchQuery || undefined),
    enabled: !!selectedDate,
  });

  // Fetch trends for tracked products
  const { data: trendsData = [], isLoading: trendsLoading } = useQuery({
    queryKey: ["archive-trends", trackedAsins],
    queryFn: async () => {
      const results: ProductTrend[] = [];
      for (const asin of trackedAsins) {
        try {
          const trend = await fetchProductTrend(asin);
          if (trend.dataPoints.length > 0) results.push(trend);
        } catch {
          // skip failed
        }
      }
      return results;
    },
    enabled: trackedAsins.length > 0,
  });

  const handleProductClick = useCallback(
    (asin: string) => {
      setTrackedAsins((prev) => {
        if (prev.includes(asin)) return prev.filter((a) => a !== asin);
        if (prev.length >= 6) return prev; // Max 6 products
        return [...prev, asin];
      });
    },
    []
  );

  const handleDiscover = useCallback(
    async (cat: string) => {
      return await fetchAvailableArchives(cat);
    },
    []
  );

  const handleImport = useCallback(
    async (archiveUrl: string, cat: string, date: string) => {
      await triggerArchiveImport(archiveUrl, cat, date);
      // Refresh snapshots after short delay
      setTimeout(() => refetchSnapshots(), 5000);
    },
    [refetchSnapshots]
  );

  const handleBulkImport = useCallback(
    async (
      cat: string,
      snaps: { archiveUrl: string; date: string }[]
    ) => {
      await triggerBulkArchiveImport(cat, snaps);
      setTimeout(() => refetchSnapshots(), 8000);
    },
    [refetchSnapshots]
  );

  // Get unique categories from snapshots
  const availableCategories = Array.from(
    new Set(snapshots.map((s) => s.category))
  );

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  ⏳
                </motion.div>
              </Link>
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Historical Trends
                </h1>
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-dot" />
                  Wayback Machine Archive Explorer
                </p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-56 hidden lg:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:border-purple-500/40 focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 text-xs">
                  🔍
                </span>
              </div>

              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-slate-400 focus:border-purple-500/40 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#151820]">
                  All Categories
                </option>
                {availableCategories.map((c) => (
                  <option key={c} value={c} className="bg-[#151820]">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>

              {/* Back to Dashboard */}
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6 relative z-10">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="glass-card rounded-xl p-4"
          >
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
              Snapshots
            </p>
            <p className="text-xl font-bold text-white font-mono">
              {snapshots.length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
              Date Range
            </p>
            <p className="text-sm font-medium text-slate-300 font-mono">
              {snapshots.length > 0
                ? `${snapshots[snapshots.length - 1]?.date.slice(0, 7)} → ${snapshots[0]?.date.slice(0, 7)}`
                : "—"}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-4"
          >
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
              Tracked Products
            </p>
            <p className="text-xl font-bold text-purple-400 font-mono">
              {trackedAsins.length}
              <span className="text-[10px] text-slate-600 ml-1">/ 6</span>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-4"
          >
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
              Selected Date
            </p>
            <p className="text-sm font-medium text-slate-300 font-mono">
              {selectedDate || "None"}
            </p>
          </motion.div>
        </div>

        {/* Backend Connection Error */}
        {snapshotsError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5 border border-red-500/20 bg-red-500/5"
          >
            <div className="flex items-start gap-3">
              <div className="text-xl mt-0.5">⚠️</div>
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">
                  Backend Connection Failed
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Could not connect to the API server at{" "}
                  <code className="px-1.5 py-0.5 bg-white/[0.06] rounded text-amber-400 text-[11px]">
                    {getApiBaseDisplay()}
                  </code>
                  .{" "}
                  {getApiBase() ? (
                    <>
                      Check this health endpoint:{" "}
                      <code className="px-1.5 py-0.5 bg-white/[0.06] rounded text-amber-400 text-[11px]">
                        {getApiBase()}/health
                      </code>
                    </>
                  ) : (
                    <>
                      Set{" "}
                      <code className="px-1.5 py-0.5 bg-white/[0.06] rounded text-amber-400 text-[11px]">
                        NEXT_PUBLIC_API_URL
                      </code>
                      {" "}in Vercel and redeploy the frontend.
                    </>
                  )}
                </p>
                <button
                  onClick={() => refetchSnapshots()}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-all cursor-pointer"
                >
                  🔄 Retry Connection
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Date Timeline */}
        <DateTimeline
          dates={snapshots}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          isLoading={snapshotsLoading}
        />

        {/* Trend Chart (when tracking products) */}
        {trackedAsins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-300">
                Rank Trends
              </h2>
              <button
                onClick={() => setTrackedAsins([])}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
            {/* Tracked product pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {trackedAsins.map((asin) => {
                const trend = trendsData.find((t) => t.asin === asin);
                return (
                  <button
                    key={asin}
                    onClick={() => handleProductClick(asin)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                    title="Click to remove"
                  >
                    {trend
                      ? trend.productName.slice(0, 30) +
                        (trend.productName.length > 30 ? "..." : "")
                      : asin}{" "}
                    ×
                  </button>
                );
              })}
            </div>
            <TrendChart trends={trendsData} isLoading={trendsLoading} />
          </motion.div>
        )}

        {/* Product Rankings Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-300">
              Product Rankings
            </h2>
            {selectedDate && (
              <p className="text-[10px] text-slate-600">
                Click a row to track its rank trend
              </p>
            )}
          </div>
          <ArchiveTable
            products={productsData?.data || []}
            isLoading={productsLoading}
            selectedDate={selectedDate}
            onProductClick={handleProductClick}
          />
        </div>

        {/* Import Panel */}
        <ImportPanel
          onDiscover={handleDiscover}
          onImport={handleImport}
          onBulkImport={handleBulkImport}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-12 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <p>
              Historical Trends · Data sourced from Wayback Machine archives
              (web.archive.org)
            </p>
            <p>
              Rankings extracted from archived Amazon.in bestseller pages
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
