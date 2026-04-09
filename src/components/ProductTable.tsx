"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { API_BASE_DISPLAY, fetchTopProducts, Product } from "@/lib/api";
import { formatCurrencyAmount, formatUsdAmount } from "@/lib/currency";
import { useAppStore } from "@/lib/store";

const CATEGORY_DISPLAY: Record<string, string> = {
  electronics: "Electronics",
  kitchen: "Kitchen",
  beauty: "Beauty",
  toys: "Toys",
  sports: "Sports",
  clothing: "Clothing",
  health: "Health",
  home: "Home",
  books: "Books",
  grocery: "Grocery",
  office: "Office",
  petSupplies: "Pet",
  automotive: "Auto",
  baby: "Baby",
  tools: "Tools",
  videogames: "Games",
};

function getStabilityTone(score: number): string {
  if (score >= 70) {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (score >= 40) {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

export function ProductTable() {
  const {
    country,
    startDate,
    endDate,
    category,
    sortBy,
    setSortBy,
    openDrawer,
    searchQuery,
    isSyncing,
    activeSyncTarget,
  } = useAppStore();

  const filterKey = [
    country,
    startDate ?? "",
    endDate ?? "",
    category,
    searchQuery,
  ].join("|");

  const [pagination, setPagination] = useState({
    filterKey,
    page: 1,
  });

  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  const selectionCoveredByActiveSync =
    isSyncing &&
    !!activeSyncTarget &&
    (activeSyncTarget.country === "ALL" ||
      (activeSyncTarget.country === country &&
        (activeSyncTarget.kind === "bulk" ||
          activeSyncTarget.category === category)));

  const updatePage = (nextPage: number | ((page: number) => number)) => {
    setPagination((current) => {
      const currentPage = current.filterKey === filterKey ? current.page : 1;
      return {
        filterKey,
        page:
          typeof nextPage === "function" ? nextPage(currentPage) : nextPage,
      };
    });
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "products-top",
      country,
      startDate,
      endDate,
      category,
      sortBy,
      page,
      searchQuery,
    ],
    queryFn: () =>
      fetchTopProducts({
        country,
        startDate,
        endDate,
        category,
        sortBy,
        page,
        limit: 50,
        search: searchQuery || undefined,
      }),
    refetchInterval: 5 * 60 * 1000,
  });

  const handleSort = (col: "estimated_sales" | "bsr" | "revenue") => {
    setSortBy(col);
    updatePage(1);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="text-4xl text-amber-400">!</div>
        <p className="text-center text-sm text-slate-400">
          Failed to load products from{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-amber-400">
            {API_BASE_DISPLAY}
          </code>
          .
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-16 rounded-lg shimmer" />
        ))}
      </div>
    );
  }

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead>
              <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                <th className="w-14 px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="w-24 px-4 py-3 text-left font-medium">
                  Category
                </th>
                <th
                  className="w-24 cursor-pointer px-4 py-3 text-right font-medium transition-colors hover:text-slate-300"
                  onClick={() => handleSort("bsr")}
                >
                  BSR {sortBy === "bsr" && <span className="text-blue-400">^</span>}
                </th>
                <th className="w-28 px-4 py-3 text-right font-medium">
                  BSR Stability
                </th>
                <th className="w-28 px-4 py-3 text-right font-medium">
                  Local Price
                </th>
                <th className="w-28 px-4 py-3 text-right font-medium">
                  Price in USD
                </th>
                <th className="w-28 px-4 py-3 text-right font-medium">
                  Peak BSR (30d)
                </th>
                <th className="w-28 px-4 py-3 text-right font-medium">
                  Avg BSR (30d)
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: Product, index: number) => (
                <motion.tr
                  key={`${product.asin}-${index}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015, duration: 0.3 }}
                  className="group border-t border-white/[0.04] transition-colors duration-150 hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-slate-500">
                      {product.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="group/link flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-10 w-10 flex-shrink-0 rounded-lg bg-white/[0.04] object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-xs text-slate-600">
                          Box
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="max-w-xs truncate text-sm font-medium text-slate-200 transition-colors duration-200 group-hover:text-blue-400">
                          {product.title}
                        </p>
                        {product.brand && (
                          <p className="truncate text-[11px] text-slate-600">
                            {product.brand}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/link:opacity-100">
                        <a
                          href={product.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 rounded-md p-1.5 text-slate-500 transition-all hover:bg-white/[0.08] hover:text-blue-400"
                          title="View product"
                          aria-label={`Open Amazon page for ${product.title}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          onClick={() => openDrawer(product.asin)}
                          className="flex-shrink-0 rounded-md p-1.5 text-slate-500 transition-all hover:bg-white/[0.08] hover:text-emerald-400"
                          title="Open graph popup"
                          aria-label={`Open graph popup for ${product.title}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 3v18h18" />
                            <path d="m7 14 4-4 3 3 5-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-blue-500/10 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-400/80">
                      {CATEGORY_DISPLAY[product.category] ?? product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm text-slate-400">
                      #{product.bsrCategory?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.stabilityScore != null ? (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-xs font-medium ${getStabilityTone(
                          product.stabilityScore
                        )}`}
                      >
                        {product.stabilityScore}/100
                      </span>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.priceLocal != null ? (
                      <span className="font-mono text-sm text-slate-300">
                        {formatCurrencyAmount(
                          product.priceLocal,
                          product.priceCurrency
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.priceUsd != null ? (
                      <span className="font-mono text-sm text-slate-300">
                        {formatUsdAmount(product.priceUsd)}
                      </span>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.peakBsr != null ? (
                      <span className="font-mono text-sm text-slate-300">
                        #{product.peakBsr.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.avgBsr != null ? (
                      <span className="font-mono text-sm text-slate-300">
                        #{product.avgBsr.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-700">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {products.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          {selectionCoveredByActiveSync ? (
            <>
              <div className="relative mb-2">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center text-lg text-blue-300">
                  Sync
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-300">
                Scraping in progress...
              </h3>
              <p className="max-w-sm text-center text-sm text-slate-500">
                Fetching products from Amazon for this region and category. Data
                will appear automatically once ready.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span className="text-xs text-blue-400">
                  Auto-refreshing every 5 seconds
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 text-5xl opacity-30">Chart</div>
              <h3 className="text-lg font-medium text-slate-300">
                No products found
              </h3>
              <p className="mb-4 max-w-sm text-center text-sm text-slate-500">
                It looks like there&apos;s no data for this region and category
                yet.
              </p>
              <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400/90">
                Click <strong>Sync Now</strong> or{" "}
                <strong>Sync All Countries</strong> at the top right to start
                scraping products from Amazon.
              </div>
            </>
          )}
        </div>
      )}

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between px-1 text-sm text-slate-500">
          <span className="text-xs">
            Showing{" "}
            <span className="text-slate-300">
              {(page - 1) * 50 + 1}-{Math.min(page * 50, meta.total)}
            </span>{" "}
            of{" "}
            <span className="text-slate-300">{meta.total.toLocaleString()}</span>{" "}
            products
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                updatePage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1}
              className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.06] disabled:opacity-30"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 font-mono text-xs text-slate-400">
              {page}/{meta.totalPages || 1}
            </span>
            <button
              onClick={() =>
                updatePage((currentPage) =>
                  Math.min(meta.totalPages || 1, currentPage + 1)
                )
              }
              disabled={page >= (meta.totalPages || 1)}
              className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.06] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
