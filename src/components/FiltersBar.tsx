"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import {
  fetchSyncConfig,
  fetchScrapeBatchProgress,
  stopRealTimeSync,
  syncRealTime,
  triggerScrapeAll,
  triggerScrapeWorldwide,
  type SyncCountryConfig,
  type TriggerWorldScrapeResponse,
} from "@/lib/api";

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

const WORLDWIDE_COUNTRY_CODE = "ALL";
const COUNTRY_FLAG_MAP: Record<string, string> = {
  US: "🇺🇸",
  UK: "🇬🇧",
  CA: "🇨🇦",
  DE: "🇩🇪",
  FR: "🇫🇷",
  JP: "🇯🇵",
  IN: "🇮🇳",
  MX: "🇲🇽",
  BR: "🇧🇷",
  AU: "🇦🇺",
  AE: "🇦🇪",
  SA: "🇸🇦",
  SG: "🇸🇬",
  TR: "🇹🇷",
  NL: "🇳🇱",
  PL: "🇵🇱",
  SE: "🇸🇪",
  BE: "🇧🇪",
  CN: "🇨🇳",
};

function formatElapsed(startedAt: string, tick: number): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);

  if (totalSeconds < 60) {
    return `${Math.max(totalSeconds, tick * 5)}s elapsed`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s elapsed`;
}

function statusTone(status: string): string {
  if (status === "completed") return "text-emerald-300 border-emerald-400/20 bg-emerald-500/10";
  if (status === "running") return "text-blue-300 border-blue-400/20 bg-blue-500/10";
  if (status === "failed") return "text-rose-300 border-rose-400/20 bg-rose-500/10";
  if (status === "cancelled") return "text-amber-300 border-amber-400/20 bg-amber-500/10";
  return "text-slate-300 border-white/10 bg-white/5";
}

function formatSyncError(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  return `${fallback} ${error.message}`;
}

export function FiltersBar() {
  const {
    country,
    setCountry,
    productLimit,
    setProductLimit,
    startDate,
    endDate,
    setDateRange,
    category,
    isSyncing,
    activeSyncTarget,
    setIsSyncing,
    setActiveSyncTarget,
    currentSyncCountry,
    currentSyncCategory,
    completedSyncCountries,
    setSyncProgressState,
    resetSyncProgressState,
  } = useAppStore();

  const [localStart, setLocalStart] = useState(startDate || "");
  const [localEnd, setLocalEnd] = useState(endDate || "");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isTriggeringLocalSync, setIsTriggeringLocalSync] = useState(false);
  const [isTriggeringGlobalSync, setIsTriggeringGlobalSync] = useState(false);
  const [globalSyncRun, setGlobalSyncRun] =
    useState<TriggerWorldScrapeResponse | null>(null);
  const [selectedGlobalCountries, setSelectedGlobalCountries] = useState<string[]>([]);
  const [globalScope, setGlobalScope] = useState<"all" | "selected">("all");
  const [showGlobalSyncOptions, setShowGlobalSyncOptions] = useState(false);
  const globalStallTicksRef = useRef(0);
  const globalProgressFingerprintRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { data: syncConfig } = useQuery({
    queryKey: ["sync-config"],
    queryFn: fetchSyncConfig,
    staleTime: 5 * 60 * 1000,
  });
  const countryOptions: SyncCountryConfig[] = syncConfig?.countries ?? [
    {
      code: country,
      label: country,
      domain: "amazon.com",
      currencyCode: "USD",
      currencySymbol: "$",
      platform: "amazon",
      locale: "en-US",
    },
  ];
  const productLimitOptions = syncConfig?.productLimitOptions ?? [10, 20, 50, 100];
  const localFallbackSelected = selectedGlobalCountries.filter((code) =>
    countryOptions.some((item) => item.code === code && item.platform === "local_fallback")
  );
  useEffect(() => {
    if (countryOptions.length === 0) return;
    if (selectedGlobalCountries.length > 0) return;
    setSelectedGlobalCountries([country]);
  }, [country, countryOptions.length, selectedGlobalCountries.length]);

  const localSyncActive =
    isSyncing &&
    !!activeSyncTarget &&
    activeSyncTarget.country !== WORLDWIDE_COUNTRY_CODE;

  const globalSyncActive =
    isSyncing &&
    !!activeSyncTarget &&
    activeSyncTarget.country === WORLDWIDE_COUNTRY_CODE &&
    activeSyncTarget.kind === "bulk";

  const selectedCountryLabel =
    countryOptions.find((item) => item.code === country)?.label || country;

  const selectedCountryFlag =
    COUNTRY_FLAG_MAP[country] || "🌐";

  const selectedCategoryLabel =
    category && category !== "all"
      ? CATEGORY_LABELS[category] || category
      : "all categories";

  const { data: globalProgress } = useQuery({
    queryKey: ["scrape-progress", globalSyncRun?.startedAt],
    queryFn: () => fetchScrapeBatchProgress(globalSyncRun!.startedAt),
    enabled: !!globalSyncRun && globalSyncActive,
    refetchInterval: globalSyncActive ? 5000 : false,
    refetchOnWindowFocus: false,
  });

  const completedJobs =
    (globalProgress?.statusBreakdown.completed ?? 0) +
    (globalProgress?.statusBreakdown.failed_then_continued ?? 0);
  const runningJobs = globalProgress?.statusBreakdown.running ?? 0;
  const failedJobs = globalProgress?.statusBreakdown.failed ?? 0;
  const cancelledJobs = globalProgress?.statusBreakdown.cancelled ?? 0;
  const startedJobs = globalProgress?.startedJobs ?? 0;
  const totalGlobalJobs = globalProgress?.totalJobs ?? globalSyncRun?.totalJobs ?? 0;
  const queuedJobs = Math.max(totalGlobalJobs - startedJobs, 0);
  const finishedJobs = globalProgress?.finishedJobs ?? completedJobs + failedJobs + cancelledJobs;
  const progressPercent =
    totalGlobalJobs > 0
      ? Math.min(100, Math.round((finishedJobs / totalGlobalJobs) * 100))
      : 0;
  const globalSyncComplete =
    !!globalSyncRun &&
    !!globalProgress &&
    totalGlobalJobs > 0 &&
    globalProgress.isFetching === false &&
    globalProgress.currentCountry == null &&
    globalProgress.currentCategory == null &&
    finishedJobs >= totalGlobalJobs;
  const recentFailedJob = globalProgress?.recentJobs.find(
    (job) => job.status === "failed" && job.errorMessage
  );
  const showGlobalProgressCard =
    isTriggeringGlobalSync || globalSyncActive || !!globalSyncRun;

  const handleApplyDates = () => {
    setDateRange(localStart || null, localEnd || null);
  };

  const handleClearDates = () => {
    setLocalStart("");
    setLocalEnd("");
    setDateRange(null, null);
  };

  useEffect(() => {
    if (!isSyncing) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["products-top"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail"] });

      setPollCount((count) => {
        const nextCount = count + 1;

        if (localSyncActive && nextCount >= 24) {
          clearInterval(interval);
          queueMicrotask(() => {
            setIsSyncing(false);
            setActiveSyncTarget(null);
            setSyncMessage(null);
          });
          return 0;
        }

        return nextCount;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [
    isSyncing,
    localSyncActive,
    queryClient,
    setActiveSyncTarget,
    setIsSyncing,
  ]);

  useEffect(() => {
    if (!globalSyncActive || !globalProgress) return;

    setSyncProgressState({
      currentCountry: globalProgress.currentCountry ?? null,
      currentCategory: globalProgress.currentCategory ?? null,
      completedCountries: globalProgress.completedCountries ?? [],
      isFetching: globalProgress.isFetching ?? true,
    });

    const fingerprint = JSON.stringify({
      currentCountry: globalProgress.currentCountry,
      currentCategory: globalProgress.currentCategory,
      startedJobs: globalProgress.startedJobs,
      finishedJobs: globalProgress.finishedJobs,
      completedCountries: globalProgress.completedCountries ?? [],
      status: globalProgress.status,
    });

    if (fingerprint === globalProgressFingerprintRef.current) {
      globalStallTicksRef.current += 1;
    } else {
      globalProgressFingerprintRef.current = fingerprint;
      globalStallTicksRef.current = 0;
    }

    if (globalStallTicksRef.current >= 24) {
      setIsSyncing(false);
      setActiveSyncTarget(null);
      setSyncMessage("Global sync appears stalled. Please retry or check backend worker status.");
      globalStallTicksRef.current = 0;
    }
  }, [
    globalProgress,
    globalSyncActive,
    setActiveSyncTarget,
    setIsSyncing,
    setSyncProgressState,
  ]);

  useEffect(() => {
    if (!globalSyncActive || !globalSyncComplete || !globalSyncRun) return;

    setIsSyncing(false);
    setActiveSyncTarget(null);
    resetSyncProgressState();
    queryClient.invalidateQueries({ queryKey: ["products-top"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["product-detail"] });

    const completionSummary =
      failedJobs > 0 || cancelledJobs > 0
        ? `Worldwide sync finished with issues: ${completedJobs} completed, ${failedJobs} failed, ${cancelledJobs} cancelled.`
        : `Worldwide sync finished: ${completedJobs} jobs completed across ${globalSyncRun.countryCount} countries.`;

    setSyncMessage(completionSummary);
    globalStallTicksRef.current = 0;
    globalProgressFingerprintRef.current = null;
  }, [
    cancelledJobs,
    completedJobs,
    failedJobs,
    globalSyncActive,
    globalSyncComplete,
    globalSyncRun,
    queryClient,
    setActiveSyncTarget,
    setIsSyncing,
    resetSyncProgressState,
  ]);

  const clearGlobalSyncUi = () => {
    setGlobalSyncRun(null);
    setPollCount(0);
    resetSyncProgressState();
    globalStallTicksRef.current = 0;
    globalProgressFingerprintRef.current = null;
  };

  const stopSync = async (kind: "bulk" | "realtime", message: string) => {
    try {
      await stopRealTimeSync(kind);
      setIsSyncing(false);
      setActiveSyncTarget(null);
      setPollCount(0);
      resetSyncProgressState();
      setSyncMessage(message);
      if (kind === "bulk" && activeSyncTarget?.country === WORLDWIDE_COUNTRY_CODE) {
        clearGlobalSyncUi();
      }
      queryClient.invalidateQueries({ queryKey: ["products-top"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail"] });
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (error) {
      setSyncMessage(formatSyncError(error, "Failed to stop sync."));
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleLocalSync = async () => {
    setSyncMessage(null);
    setIsTriggeringLocalSync(true);
    const nextKind = !category || category === "all" ? "bulk" : "realtime";
    const hadActiveSync = isSyncing;

    try {
      if (!category || category === "all") {
        await triggerScrapeAll(country, productLimit);
        setActiveSyncTarget({ country, category: "all", kind: nextKind });
        setSyncMessage(
          `Syncing all categories for ${selectedCountryLabel}... Data will auto-refresh.`
        );
      } else {
        await syncRealTime(category, country, productLimit);
        setActiveSyncTarget({ country, category, kind: nextKind });
        setSyncMessage(
          `Syncing ${selectedCategoryLabel} for ${selectedCountryLabel}... Data will auto-refresh.`
        );
      }

      setIsSyncing(true);
      setPollCount(0);
    } catch (error) {
      if (!hadActiveSync) {
        setIsSyncing(false);
        setActiveSyncTarget(null);
      }
      setSyncMessage(formatSyncError(error, "Failed to trigger sync."));
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsTriggeringLocalSync(false);
    }
  };

  const handleGlobalSync = async () => {
    setSyncMessage(null);
    setIsTriggeringGlobalSync(true);
    const hadActiveSync = isSyncing;

    try {
      const response = await triggerScrapeWorldwide(
        country,
        productLimit,
        selectedGlobalCountries.length > 0 ? selectedGlobalCountries : [country],
        globalScope === "all"
      );
      setGlobalSyncRun(response);
      setShowGlobalSyncOptions(false);
      setIsSyncing(true);
      setActiveSyncTarget({
        country: WORLDWIDE_COUNTRY_CODE,
        category: "all",
        kind: "bulk",
      });
      setPollCount(0);
      const replacedInfo =
        (response.removedWaitingJobs ?? 0) > 0
          ? ` Replaced ${response.removedWaitingJobs} old queued bulk jobs.`
          : response.replacedActiveJobId
            ? " Replaced the active bulk scrape and started a fresh worldwide batch."
            : "";
      setSyncMessage(
        `Queued ${response.totalJobs} scrape jobs across ${response.countryCount} countries and ${response.categoryCount} categories.${replacedInfo}`
      );
    } catch (error) {
      if (!hadActiveSync) {
        setIsSyncing(false);
        setActiveSyncTarget(null);
      }
      clearGlobalSyncUi();
      setSyncMessage(formatSyncError(error, "Failed to trigger global sync."));
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsTriggeringGlobalSync(false);
    }
  };

  const stoppedOrInfoMessage = syncMessage && !syncMessage.startsWith("Failed");
  const localButtonDisabled =
    globalSyncActive || isTriggeringGlobalSync || isTriggeringLocalSync;
  const globalButtonDisabled =
    localSyncActive || isTriggeringGlobalSync || isTriggeringLocalSync;
  const globalSyncHeading = isTriggeringGlobalSync
    ? "Preparing worldwide scrape"
    : globalSyncComplete
      ? "Worldwide scrape complete"
      : "Worldwide scrape is running";
  const globalSyncSubheading = globalSyncComplete
    ? "Every country/category batch has finished. Review the summary or launch another clean run."
    : "Scraping every category across every supported country.";
  const controlsDisabled = isSyncing || isTriggeringGlobalSync || isTriggeringLocalSync;

  return (
    <div className="flex flex-col gap-3">
      {/* Control Panel */}
      <div className="control-panel">
        <div className="flex flex-wrap items-center gap-3">
          {/* Region selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                Region
              </span>
            </div>
            <select
              id="country"
              name="country"
              aria-label="Select country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={controlsDisabled}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {countryOptions.map((item) => (
                <option
                  key={item.code}
                  value={item.code}
                  className="bg-[#0f1117]"
                >
                  {(COUNTRY_FLAG_MAP[item.code] || "🌐")} {item.label} ({item.code})
                </option>
              ))}
            </select>
          </div>
          {showGlobalSyncOptions && localFallbackSelected.length > 0 && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-100">
              Fallback country selected ({localFallbackSelected.join(", ")}): Amazon scraping is skipped and marked failed-then-continued.
            </div>
          )}

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/[0.06]" />

          {/* Sync-all country selector */}
          {showGlobalSyncOptions && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03]">
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                Sync All Scope
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
              <select
                id="global-scope"
                name="globalScope"
                aria-label="Select sync-all scope"
                value={globalScope}
                onChange={(e) => setGlobalScope(e.target.value as "all" | "selected")}
                disabled={controlsDisabled}
                className="bg-transparent text-xs text-slate-300 focus:outline-none"
              >
                <option value="all" className="bg-[#0f1117]">Selected + Remaining</option>
                <option value="selected" className="bg-[#0f1117]">Selected Only</option>
              </select>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex max-w-[320px] flex-wrap gap-1">
                {countryOptions.map((item) => {
                  const isActive = selectedGlobalCountries.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      disabled={controlsDisabled}
                      onClick={() =>
                        setSelectedGlobalCountries((prev) =>
                          prev.includes(item.code)
                            ? prev.filter((code) => code !== item.code)
                            : [...prev, item.code]
                        )
                      }
                      className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                        isActive
                          ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                          : "border-white/15 bg-black/20 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {(COUNTRY_FLAG_MAP[item.code] || "🌐")} {item.code}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/[0.06]" />

          {/* Product limit selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03]">
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                Limit
              </span>
            </div>
            <select
              id="product-limit"
              name="productLimit"
              aria-label="Select product limit"
              value={productLimit}
              onChange={(e) => setProductLimit(Number(e.target.value))}
              disabled={controlsDisabled}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {productLimitOptions.map((option) => (
                <option key={option} value={option} className="bg-[#0f1117]">
                  {option} products
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/[0.06]" />

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-2.5 py-1.5 focus-within:border-blue-500/50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              id="start-date"
              name="startDate"
              aria-label="Start date"
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              disabled={controlsDisabled}
              className="bg-transparent text-sm text-slate-300 w-32 focus:outline-none [color-scheme:dark]"
            />
            <span className="text-slate-600 px-0.5">→</span>
            <input
              id="end-date"
              name="endDate"
              aria-label="End date"
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              disabled={controlsDisabled}
              className="bg-transparent text-sm text-slate-300 w-32 focus:outline-none [color-scheme:dark]"
            />
            <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2 ml-1">
              <button
                onClick={handleApplyDates}
                disabled={controlsDisabled}
                className="px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] rounded-lg transition-colors font-medium"
              >
                Apply
              </button>
              {(localStart || localEnd) && (
                <button
                  onClick={handleClearDates}
                  disabled={controlsDisabled}
                  className="px-2.5 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] rounded-lg transition-colors font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/[0.06]" />

          {/* Sync Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={
                localSyncActive
                  ? () =>
                      stopSync(
                        activeSyncTarget?.kind ?? "realtime",
                        "Selection sync stopped."
                      )
                  : handleLocalSync
              }
              disabled={localButtonDisabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-white shadow-lg ${
                localButtonDisabled
                  ? "bg-slate-700/50 text-slate-400 shadow-none cursor-not-allowed"
                  : localSyncActive
                    ? "bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02]"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
              }`}
              title={
                localSyncActive
                  ? "Stop the current scrape"
                  : localButtonDisabled
                    ? "Another sync action is already starting or running"
                    : category === "all"
                      ? "Sync all categories for the selected country"
                      : `Sync top 50 products for ${selectedCategoryLabel}`
              }
            >
              {isTriggeringLocalSync ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Starting...
                </>
              ) : localSyncActive ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-sm" />
                  </span>
                  Stop Sync
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M2.13 15.57a9 9 0 0 0 15.14 5.43L21.5 16M2.5 22v-6h6M21.87 8.43A9 9 0 0 0 6.73 3 9 9 0 0 0 2.5 8l4.23 4" />
                  </svg>
                  <span className="hidden sm:inline">Sync {selectedCountryFlag}</span>
                  <span className="sm:hidden">Sync</span>
                </>
              )}
            </button>

            <button
              onClick={
                globalSyncActive
                  ? () => stopSync("bulk", "Global sync stopped.")
                  : showGlobalSyncOptions
                    ? handleGlobalSync
                    : () => setShowGlobalSyncOptions(true)
              }
              disabled={globalButtonDisabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-white shadow-lg ${
                globalButtonDisabled
                  ? "bg-slate-700/50 text-slate-400 shadow-none cursor-not-allowed"
                  : globalSyncActive
                    ? "bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02]"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
              }`}
              title={
                globalSyncActive
                  ? "Stop the global scrape"
                  : globalButtonDisabled
                    ? "Another sync action is already starting or running"
                    : "Scrape every supported country across every category"
              }
            >
              {isTriggeringGlobalSync ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Queuing...
                </>
              ) : globalSyncActive ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-sm" />
                  </span>
                  Stop Global
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                  </svg>
                  <span className="hidden sm:inline">
                    {showGlobalSyncOptions ? "Start Sync All" : "Sync All Countries"}
                  </span>
                  <span className="sm:hidden">Worldwide</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global Sync Progress Card */}
      {showGlobalProgressCard && (
        <div
          className={`rounded-2xl border p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.05)] transition-all duration-500 ${
            globalSyncComplete
              ? "border-emerald-300/25 bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-sky-500/8"
              : "border-emerald-400/12 bg-gradient-to-br from-emerald-500/10 via-teal-500/6 to-sky-500/6"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  globalSyncComplete
                    ? "bg-emerald-300/15 border-emerald-200/20"
                    : "bg-emerald-400/12 border-emerald-300/15"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-emerald-200 ${globalSyncComplete ? "" : "animate-pulse"}`}
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {globalSyncHeading}
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      globalSyncComplete
                        ? "border-emerald-200/20 bg-emerald-200/10 text-emerald-100"
                        : "border-white/10 bg-white/8 text-emerald-100/80"
                    }`}
                  >
                    {isTriggeringGlobalSync
                      ? "Starting"
                      : globalSyncComplete
                        ? "Complete"
                        : "Running"}
                  </span>
                </div>
                <p className="text-xs text-emerald-100/75">
                  {globalSyncSubheading}
                </p>
                {globalSyncRun && (
                  <p className="text-xs text-slate-300/80">
                    {globalSyncRun.countryCount} countries ×{" "}
                    {globalSyncRun.categoryCount} categories ={" "}
                    {globalSyncRun.totalJobs} scrape jobs
                  </p>
                )}
            {selectedGlobalCountries.length > 0 && (
              <p className="text-xs text-slate-400/90">
                Scope: {globalScope === "all" ? "Selected + remaining countries" : "Selected countries only"} | Selected: {selectedGlobalCountries.join(", ")}
              </p>
            )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/60">
                {globalSyncComplete ? "Run Summary" : "Global Progress"}
              </p>
              <p className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {isTriggeringGlobalSync ? "—" : `${progressPercent}%`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 transition-all duration-700 ease-out"
              style={{ width: `${isTriggeringGlobalSync ? 12 : Math.max(progressPercent, 4)}%` }}
            />
          </div>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6">
            {[
              { label: "Total Jobs", value: globalSyncRun?.totalJobs ?? "—", color: "text-white" },
              { label: "Queued", value: isTriggeringGlobalSync ? "—" : queuedJobs, color: "text-slate-100" },
              { label: "Running", value: isTriggeringGlobalSync ? "—" : runningJobs, color: "text-blue-200" },
              { label: "Completed", value: isTriggeringGlobalSync ? "—" : completedJobs, color: "text-emerald-200" },
              { label: "Failed", value: isTriggeringGlobalSync ? "—" : failedJobs, color: "text-rose-200" },
              {
                label: "Countries",
                value: isTriggeringGlobalSync
                  ? "—"
                  : `${(globalProgress?.completedCountries?.length ?? completedSyncCountries.length)}/${globalProgress?.totalCountries ?? globalSyncRun?.countryCount ?? countryOptions.length}`,
                color: "text-white",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className={`mt-1 text-lg font-semibold tabular-nums ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300/80">
            {globalSyncRun && (
              <span>{formatElapsed(globalSyncRun.startedAt, pollCount)}</span>
            )}
            {!isTriggeringGlobalSync && (
              <span>
                {globalProgress?.productsFound ?? 0} products saved
                {globalSyncComplete ? " in this run" : " so far"}
              </span>
            )}
            {!isTriggeringGlobalSync && (globalProgress?.currentCountry || currentSyncCountry) && (
              <span>
                Current: {(globalProgress?.currentCountry ?? currentSyncCountry) || "—"}
                {" / "}
                {(globalProgress?.currentCategory ?? currentSyncCategory) || "—"}
              </span>
            )}
            {!isTriggeringGlobalSync && (globalProgress?.completedCountries?.length ?? completedSyncCountries.length) > 0 && (
              <span>
                {(globalProgress?.completedCountries?.length ?? completedSyncCountries.length)} countries completed
              </span>
            )}
            {!isTriggeringGlobalSync && failedJobs > 0 && (
              <span className="text-rose-200">{failedJobs} failed</span>
            )}
            {!isTriggeringGlobalSync && cancelledJobs > 0 && (
              <span className="text-amber-200">{cancelledJobs} cancelled</span>
            )}
          </div>

          {/* Failed job error */}
          {!isTriggeringGlobalSync && recentFailedJob?.errorMessage && (
            <div className="mt-4 rounded-2xl border border-rose-300/10 bg-rose-500/8 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-rose-200/70">
                Latest Failure
              </p>
              <p className="mt-1 text-sm text-rose-100">
                {recentFailedJob.country} - {CATEGORY_LABELS[recentFailedJob.category] || recentFailedJob.category}
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-100/75">
                {recentFailedJob.errorMessage}
              </p>
            </div>
          )}

          {/* Recent jobs pills */}
          {!isTriggeringGlobalSync &&
            globalProgress &&
            globalProgress.recentJobs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {globalProgress.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`rounded-full border px-3 py-1 text-[11px] ${statusTone(job.status)}`}
                  >
                    {job.country} - {CATEGORY_LABELS[job.category] || job.category} -{" "}
                    {job.status}
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Local sync in-progress banner */}
      {isSyncing && syncMessage && !globalSyncActive && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-xs text-blue-300 font-medium">
              {syncMessage}
            </span>
          </div>
          <span className="text-[10px] text-blue-400/60 ml-auto tabular-nums">
            Auto-refreshing every 5s ({Math.max(0, 120 - pollCount * 5)}s remaining)
          </span>
        </div>
      )}

      {/* Stopped / error message */}
      {!isSyncing && syncMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
            stoppedOrInfoMessage
              ? "bg-amber-500/8 border-amber-500/15"
              : "bg-red-500/8 border-red-500/15"
          }`}
        >
          <span
            className={`text-xs ${
              stoppedOrInfoMessage ? "text-amber-300" : "text-red-400"
            }`}
          >
            {syncMessage}
          </span>
        </div>
      )}
    </div>
  );
}
