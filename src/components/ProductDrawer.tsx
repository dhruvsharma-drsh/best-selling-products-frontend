"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { fetchProductDetail } from "@/lib/api";
import { formatCurrencyAmount, formatUsdAmount } from "@/lib/currency";
import { useAppStore } from "@/lib/store";
import { BsrSparkline, SalesChart } from "./BsrSparkline";

function getStabilityTone(score: number): string {
  if (score >= 70) {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (score >= 40) {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

export function ProductDrawer() {
  const { selectedAsin, drawerOpen, closeDrawer, country, isSyncing } =
    useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ["product-detail", selectedAsin, country],
    queryFn: () => fetchProductDetail(selectedAsin!, country),
    enabled: !!selectedAsin,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: drawerOpen && isSyncing ? 5000 : false,
  });

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-4 top-[6vh] z-50 mx-auto max-h-[88vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#151820] shadow-2xl shadow-black/40"
          >
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
              aria-label="Close popup"
            >
              x
            </button>

            {isLoading ? (
              <div className="space-y-4 p-6">
                <div className="h-8 w-2/3 rounded shimmer" />
                <div className="h-4 w-1/3 rounded shimmer" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-72 rounded-xl shimmer" />
                  <div className="h-72 rounded-xl shimmer" />
                </div>
              </div>
            ) : data ? (
              <div className="space-y-6 p-6">
                <div className="flex flex-wrap gap-4 pr-12">
                  {data.product.imageUrl ? (
                    <img
                      src={data.product.imageUrl}
                      alt=""
                      className="h-20 w-20 flex-shrink-0 rounded-xl bg-white/[0.04] object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-sm text-slate-500">
                      Box
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold leading-snug text-white">
                      {data.product.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300">
                        {data.product.category}
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-300">
                        {data.product.asin}
                      </span>
                      <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
                        {formatCurrencyAmount(
                          data.product.priceLocal,
                          data.product.priceCurrency
                        )}
                      </span>
                      <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 font-mono text-[11px] text-blue-300">
                        {data.product.priceUsd != null
                          ? formatUsdAmount(data.product.priceUsd)
                          : "USD unavailable"}
                      </span>
                    </div>
                    {data.product.brand && (
                      <p className="mt-3 text-sm text-slate-500">
                        {data.product.brand}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="Current BSR"
                    value={
                      data.analytics.currentBsr != null
                        ? `#${data.analytics.currentBsr.toLocaleString()}`
                        : "-"
                    }
                    tone="text-blue-300"
                  />
                  <MetricCard
                    label="BSR Stability"
                    value={
                      data.analytics.stabilityScore != null
                        ? `${data.analytics.stabilityScore}/100`
                        : "-"
                    }
                    tone={
                      data.analytics.stabilityScore != null
                        ? getStabilityTone(data.analytics.stabilityScore)
                        : "border-white/[0.08] bg-white/[0.03] text-slate-300"
                    }
                    highlighted
                  />
                  <MetricCard
                    label="Est. Sales/mo"
                    value={
                      data.analytics.estimatedMonthlySales != null
                        ? data.analytics.estimatedMonthlySales.toLocaleString()
                        : "-"
                    }
                    tone="text-emerald-300"
                  />
                  <MetricCard
                    label="Peak BSR (30d)"
                    value={
                      data.analytics.peakBsr != null
                        ? `#${data.analytics.peakBsr.toLocaleString()}`
                        : "-"
                    }
                    tone="text-slate-200"
                  />
                  <MetricCard
                    label="Avg BSR (30d)"
                    value={
                      data.analytics.avgBsr != null
                        ? `#${data.analytics.avgBsr.toLocaleString()}`
                        : "-"
                    }
                    tone="text-slate-200"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="glass-card rounded-xl p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-slate-500">
                          30-Day BSR Trend
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Better rank appears higher on the chart.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-400">
                        {data.history.length} points
                      </span>
                    </div>
                    <BsrSparkline data={data.history} height={280} />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="mb-4">
                      <h3 className="text-xs uppercase tracking-wider text-slate-500">
                        Estimated Sales History
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Sales estimate based on the stored BSR history.
                      </p>
                    </div>
                    <SalesChart data={data.history} height={280} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-500">
                Product not found
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetricCard({
  label,
  value,
  tone,
  highlighted = false,
}: {
  label: string;
  value: string;
  tone: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlighted ? tone : "border-white/[0.06] bg-black/10"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-sm font-semibold ${
          highlighted ? "" : tone
        }`}
      >
        {value}
      </p>
    </div>
  );
}
