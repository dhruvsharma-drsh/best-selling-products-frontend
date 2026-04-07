"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductDetail } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { BsrSparkline, SalesChart } from "./BsrSparkline";

const confidenceColors = {
  high: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "High Confidence" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Est. ±25%" },
  low: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Directional" },
};

const trendConfig = {
  rising: { icon: "↗", color: "text-emerald-400", label: "Rising Sales" },
  falling: { icon: "↘", color: "text-rose-400", label: "Declining" },
  stable: { icon: "→", color: "text-slate-400", label: "Stable" },
};

export function ProductDrawer() {
  const { selectedAsin, drawerOpen, closeDrawer, country } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ["product-detail", selectedAsin, country],
    queryFn: () => fetchProductDetail(selectedAsin!, country),
    enabled: !!selectedAsin,
  });

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#151820] border-l border-white/[0.06] z-50 overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={closeDrawer}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all z-10"
            >
              ✕
            </button>

            {isLoading ? (
              <div className="p-6 space-y-4">
                <div className="h-8 shimmer rounded w-3/4" />
                <div className="h-4 shimmer rounded w-1/2" />
                <div className="h-32 shimmer rounded mt-6" />
                <div className="h-32 shimmer rounded" />
              </div>
            ) : data ? (
              <div className="p-6 space-y-6">
                {/* Product Header */}
                <div className="flex gap-4 pr-10">
                  {data.product.imageUrl ? (
                    <img
                      src={data.product.imageUrl}
                      alt=""
                      className="w-20 h-20 object-contain bg-white/[0.04] rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white/[0.04] rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white leading-snug">
                      {data.product.title}
                    </h2>
                    {data.product.brand && (
                      <p className="text-xs text-slate-500 mt-1">
                        {data.product.brand}
                      </p>
                    )}
                    <p className="text-[11px] text-blue-400/70 mt-1">
                      {data.product.category} · {data.product.asin}
                    </p>
                  </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Current BSR"
                    value={
                      data.analytics.currentBsr
                        ? `#${data.analytics.currentBsr.toLocaleString()}`
                        : "—"
                    }
                    color="text-blue-400"
                  />
                  <MetricCard
                    label="Est. Sales/mo"
                    value={
                      data.analytics.estimatedMonthlySales
                        ? data.analytics.estimatedMonthlySales.toLocaleString()
                        : "—"
                    }
                    color="text-emerald-400"
                  />
                  <MetricCard
                    label="Est. Revenue/mo"
                    value={
                      data.analytics.estimatedMonthlyRevenue
                        ? `$${Math.round(data.analytics.estimatedMonthlyRevenue).toLocaleString()}`
                        : "—"
                    }
                    color="text-white"
                  />
                </div>

                {/* Confidence + Trend + Stability */}
                <div className="flex flex-wrap gap-2">
                  {data.analytics.confidenceLevel && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        confidenceColors[data.analytics.confidenceLevel].bg
                      } ${confidenceColors[data.analytics.confidenceLevel].text}`}
                      title={data.analytics.confidenceReason}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {confidenceColors[data.analytics.confidenceLevel].label}
                    </div>
                  )}

                  {data.analytics.trend && (
                    <div
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] ${
                        trendConfig[data.analytics.trend].color
                      }`}
                    >
                      <span className="text-sm">
                        {trendConfig[data.analytics.trend].icon}
                      </span>
                      {trendConfig[data.analytics.trend].label}
                    </div>
                  )}
                </div>

                {/* Stability Score */}
                {data.analytics.stabilityScore != null && (
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">
                        BSR Stability
                      </span>
                      <span className="font-mono text-sm text-slate-300">
                        {data.analytics.stabilityScore}/100
                      </span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${data.analytics.stabilityScore}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          data.analytics.stabilityScore >= 70
                            ? "bg-emerald-500"
                            : data.analytics.stabilityScore >= 40
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2">
                      {data.analytics.stabilityScore >= 70
                        ? "Stable BSR — reliable sales estimate"
                        : data.analytics.stabilityScore >= 40
                        ? "Moderate volatility — estimate has wider margin"
                        : "Volatile BSR — estimate is directional only"}
                    </p>
                  </div>
                )}

                {/* BSR History Chart */}
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    30-Day BSR Trend
                  </h3>
                  <BsrSparkline data={data.history} height={160} />
                  <p className="text-[10px] text-slate-600 mt-2">
                    ↑ Higher on chart = Better rank (lower BSR number)
                  </p>
                </div>

                {/* Sales History Chart */}
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    Estimated Sales History
                  </h3>
                  <SalesChart data={data.history} height={140} />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {data.analytics.peakBsr != null && (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-[10px] text-slate-600 uppercase">
                        Peak BSR (30d)
                      </p>
                      <p className="font-mono text-sm text-white mt-0.5">
                        #{data.analytics.peakBsr.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {data.analytics.avgBsr != null && (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-[10px] text-slate-600 uppercase">
                        Avg BSR (30d)
                      </p>
                      <p className="font-mono text-sm text-white mt-0.5">
                        #{data.analytics.avgBsr.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {data.product.priceUsd != null && (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-[10px] text-slate-600 uppercase">
                        Price
                      </p>
                      <p className="font-mono text-sm text-white mt-0.5">
                        ${data.product.priceUsd.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-[10px] text-slate-600 uppercase">
                      Data Points
                    </p>
                    <p className="font-mono text-sm text-white mt-0.5">
                      {data.history.length}
                    </p>
                  </div>
                </div>

                {/* Amazon Link */}
                <a
                  href={data.product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-blue-500/20"
                >
                  <span>View on Amazon</span>
                  <span className="text-xs">↗</span>
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
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
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-3 text-center">
      <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`font-mono text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
