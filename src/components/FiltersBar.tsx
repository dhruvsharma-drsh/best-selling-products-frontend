"use client";

import { useAppStore } from "@/lib/store";
import { stopRealTimeSync, syncRealTime } from "@/lib/api";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "AU", label: "Australia" },
  { value: "AE", label: "UAE" },
];

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  kitchen: "Kitchen & Dining",
  beauty: "Beauty & Personal Care",
  toys: "Toys & Games",
  sports: "Sports & Outdoors",
  clothing: "Clothing, Shoes & Accessories",
  health: "Health & Household",
  home: "Home & Kitchen",
  books: "Books",
  grocery: "Grocery & Gourmet Food",
  office: "Office Products",
  petSupplies: "Pet Supplies",
  automotive: "Automotive",
  baby: "Baby",
  tools: "Tools & Home Improvement",
  videogames: "Video Games",
};

export function FiltersBar() {
  const {
    country,
    setCountry,
    startDate,
    endDate,
    setDateRange,
    category,
    isSyncing,
    activeSyncTarget,
    setIsSyncing,
    setActiveSyncTarget,
  } = useAppStore();
  const [localStart, setLocalStart] = useState(startDate || "");
  const [localEnd, setLocalEnd] = useState(endDate || "");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const queryClient = useQueryClient();

  const selectionCoveredByActiveSync =
    isSyncing &&
    !!activeSyncTarget &&
    activeSyncTarget.country === country &&
    (activeSyncTarget.kind === "bulk" || activeSyncTarget.category === category);

  const handleApplyDates = () => {
    setDateRange(localStart || null, localEnd || null);
  };

  const handleClearDates = () => {
    setLocalStart("");
    setLocalEnd("");
    setDateRange(null, null);
  };

  // Auto-refresh data while syncing
  useEffect(() => {
    if (!isSyncing) {
      setPollCount(0);
      return;
    }

    const interval = setInterval(() => {
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["products-top"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      
      setPollCount((c) => c + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isSyncing, queryClient]);

  // Handle auto-stop polling after ~2 minutes (24 polls × 5 seconds)
  useEffect(() => {
    if (pollCount >= 24 && isSyncing) {
      setIsSyncing(false);
      setActiveSyncTarget(null);
      setSyncMessage(null);
    }
  }, [pollCount, isSyncing, setActiveSyncTarget, setIsSyncing]);

  const handleSync = async () => {
    setSyncMessage(null);
    const nextKind = !category || category === "all" ? "bulk" : "realtime";
    const hadActiveSync = isSyncing;

    try {
      if (!category || category === "all") {
        const { triggerScrapeAll } = await import('@/lib/api');
        await triggerScrapeAll(country);
        setIsSyncing(true);
        setActiveSyncTarget({ country, category: "all", kind: nextKind });
        setPollCount(0);
        setSyncMessage(`Syncing all categories for ${COUNTRIES.find(c => c.value === country)?.label || country}... Data will auto-refresh.`);
      } else {
        await syncRealTime(category, country);
        setIsSyncing(true);
        setActiveSyncTarget({ country, category, kind: nextKind });
        setPollCount(0);
        const categoryLabel = CATEGORY_LABELS[category] || category;
        setSyncMessage(`Syncing ${categoryLabel} for ${COUNTRIES.find(c => c.value === country)?.label || country}... Data will auto-refresh.`);
      }
    } catch (err) {
      if (!hadActiveSync) {
        setIsSyncing(false);
      }
      setSyncMessage("Failed to trigger sync. Is the backend running?");
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleStop = async () => {
    try {
      const kind = activeSyncTarget?.kind ?? (!category || category === "all" ? "bulk" : "realtime");
      await stopRealTimeSync(kind);
      setIsSyncing(false);
      setActiveSyncTarget(null);
      setPollCount(0);
      setSyncMessage("Scrape stopped.");
      queryClient.invalidateQueries({ queryKey: ["products-top"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setSyncMessage("Failed to stop sync.");
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const selectedCategoryLabel = category && category !== "all"
    ? CATEGORY_LABELS[category] || category
    : "all categories";
  const stoppedOrInfoMessage = syncMessage && !syncMessage.startsWith("Failed");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Country Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Region</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0f1117]">
                {c.label} ({c.value})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-2 py-1.5 focus-within:border-blue-500/50 transition-colors">
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="bg-transparent text-sm text-slate-300 w-32 focus:outline-none [color-scheme:dark]"
          />
          <span className="text-slate-600 px-1">→</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="bg-transparent text-sm text-slate-300 w-32 focus:outline-none [color-scheme:dark]"
          />
          <div className="flex items-center gap-1 border-l border-white/[0.1] pl-2 ml-1">
            <button
              onClick={handleApplyDates}
              className="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] rounded transition-colors font-medium "
            >
              Apply
            </button>
            {(localStart || localEnd) && (
              <button
                onClick={handleClearDates}
                className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] rounded transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sync Button */}
        <button
          onClick={selectionCoveredByActiveSync ? handleStop : handleSync}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-white shadow-lg hover:scale-[1.02] ${
            selectionCoveredByActiveSync
              ? "bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/20 hover:shadow-rose-500/40"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40"
          }`}
          title={selectionCoveredByActiveSync ? "Stop current scrape" : category === "all" ? "Sync all categories now" : `Sync top 50 products for ${selectedCategoryLabel}`}
        >
          {selectionCoveredByActiveSync ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-sm" />
              </span>
              Stop
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.13 15.57a9 9 0 0 0 15.14 5.43L21.5 16M2.5 22v-6h6M21.87 8.43A9 9 0 0 0 6.73 3 9 9 0 0 0 2.5 8l4.23 4" />
              </svg>
              Sync Now
            </>
          )}
        </button>
      </div>

      {/* Sync Status Banner */}
      {selectionCoveredByActiveSync && syncMessage && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-xs text-blue-300 font-medium">{syncMessage}</span>
          </div>
          <span className="text-[10px] text-blue-400/60 ml-auto">
            Auto-refreshing every 5s ({Math.max(0, 120 - pollCount * 5)}s remaining)
          </span>
        </div>
      )}

      {/* Error/Success message when not syncing */}
      {!selectionCoveredByActiveSync && syncMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            stoppedOrInfoMessage
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
        >
          <span className={`text-xs ${stoppedOrInfoMessage ? "text-amber-300" : "text-red-400"}`}>{syncMessage}</span>
        </div>
      )}
    </div>
  );
}
