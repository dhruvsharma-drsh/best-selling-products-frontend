"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProductDetail } from "@/lib/api";
import { formatCurrencyAmount, formatUsdAmount } from "@/lib/currency";
import { useAppStore } from "@/lib/store";
import { BsrSparkline, SalesChart } from "./BsrSparkline";

const confidenceColors = {
  high: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    label: "High Confidence",
  },
  medium: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    label: "Est. +/-25%",
  },
  low: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    label: "Directional",
  },
};

const trendConfig = {
  rising: { icon: "^", color: "text-emerald-400", label: "Rising Sales" },
  falling: { icon: "v", color: "text-rose-400", label: "Declining" },
  stable: { icon: "-", color: "text-slate-400", label: "Stable" },
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto border-l border-white/[0.06] bg-[#151820]"
          >
            <button
              onClick={closeDrawer}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
            >
              x
            </button>

            {isLoading ? (
              <div className="space-y-4 p-6">
                <div className="h-8 w-3/4 rounded shimmer" />
                <div className="h-4 w-1/2 rounded shimmer" />
                <div className="mt-6 h-32 rounded shimmer" />
                <div className="h-32 rounded shimmer" />
              </div>
            ) : data ? (
              <div className="space-y-6 p-6">
                <div className="flex gap-4 pr-10">
                  {data.product.imageUrl ? (
                    <img
                      src={data.product.imageUrl}
                      alt=""
                      className="h-20 w-20 flex-shrink-0 rounded-xl bg-white/[0.04] object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-2xl">
                      []
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold leading-snug text-white">
                      {data.product.title}
                    </h2>
                    {data.product.brand && (
                      <p className="mt-1 text-xs text-slate-500">
                        {data.product.brand}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-blue-400/70">
                      {data.product.category} · {data.product.asin}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Current BSR"
                    value={
                      data.analytics.currentBsr
                        ? `#${data.analytics.currentBsr.toLocaleString()}`
                        : "-"
                    }
                    color="text-blue-400"
                  />
                  <MetricCard
                    label="Est. Sales/mo"
                    value={
                      data.analytics.estimatedMonthlySales
                        ? data.analytics.estimatedMonthlySales.toLocaleString()
                        : "-"
                    }
                    color="text-emerald-400"
                  />
                  <MetricCard
                    label="Est. Revenue/mo"
                    value={
                      data.analytics.estimatedMonthlyRevenue
                        ? `$${Math.round(
                            data.analytics.estimatedMonthlyRevenue
                          ).toLocaleString()}`
                        : "-"
                    }
                    color="text-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {data.analytics.confidenceLevel && (
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        confidenceColors[data.analytics.confidenceLevel].bg
                      } ${confidenceColors[data.analytics.confidenceLevel].text}`}
                      title={data.analytics.confidenceReason}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {confidenceColors[data.analytics.confidenceLevel].label}
                    </div>
                  )}

                  {data.analytics.trend && (
                    <div
                      className={`flex items-center gap-1 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs font-medium ${
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

                {data.analytics.stabilityScore != null && (
                  <div className="glass-card rounded-xl p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-slate-500">
                        BSR Stability
                      </span>
                      <span className="font-mono text-sm text-slate-300">
                        {data.analytics.stabilityScore}/100
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.analytics.stabilityScore}%` }}
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
                    <p className="mt-2 text-[11px] text-slate-600">
                      {data.analytics.stabilityScore >= 70
                        ? "Stable BSR. Sales estimate is more reliable."
                        : data.analytics.stabilityScore >= 40
                          ? "Moderate volatility. Estimate has a wider margin."
                          : "Volatile BSR. Treat estimate as directional."}
                    </p>
                  </div>
                )}

                <div className="glass-card rounded-xl p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                    30-Day BSR Trend
                  </h3>
                  <BsrSparkline data={data.history} height={160} />
                  <p className="mt-2 text-[10px] text-slate-600">
                    Higher on the chart means a better rank.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                    Estimated Sales History
                  </h3>
                  <SalesChart data={data.history} height={140} />
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500">
                      Pricing
                    </h3>
                    {data.product.priceConversion?.usdSource === "live_api" && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                        Live FX
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-black/10 p-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs text-slate-400">
                            Local Price
                          </span>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            Displayed in local currency for {country}
                          </p>
                        </div>
                        <span className="text-right font-mono text-sm text-white">
                          {formatCurrencyAmount(
                            data.product.priceLocal,
                            data.product.priceCurrency
                          )}
                        </span>
                      </div>

                      <div className="h-px bg-white/[0.06]" />

                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs text-slate-400">
                            Price in USD
                          </span>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            Converted using the configured currency API
                          </p>
                        </div>
                        <span
                          className={`text-right font-mono text-sm ${
                            data.product.priceUsd != null
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }`}
                        >
                          {data.product.priceUsd != null
                            ? formatUsdAmount(data.product.priceUsd)
                            : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {data.product.priceConversion?.usdStatus === "unavailable" &&
                    data.product.priceConversion?.message && (
                      <p className="mt-3 text-[11px] leading-5 text-amber-300/85">
                        {data.product.priceConversion.message}
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {data.analytics.peakBsr != null && (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-[10px] uppercase text-slate-600">
                        Peak BSR (30d)
                      </p>
                      <p className="mt-0.5 font-mono text-sm text-white">
                        #{data.analytics.peakBsr.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {data.analytics.avgBsr != null && (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-[10px] uppercase text-slate-600">
                        Avg BSR (30d)
                      </p>
                      <p className="mt-0.5 font-mono text-sm text-white">
                        #{data.analytics.avgBsr.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-[10px] uppercase text-slate-600">
                      Data Points
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-white">
                      {data.history.length}
                    </p>
                  </div>
                </div>

                <a
                  href={data.product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-medium text-white transition-all duration-300 hover:from-blue-500 hover:to-blue-400"
                >
                  <span>View on Amazon</span>
                  <span className="text-xs">-&gt;</span>
                </a>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
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
      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p className={`font-mono text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
