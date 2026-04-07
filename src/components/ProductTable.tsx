"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE, fetchTopProducts, Product } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

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

export function ProductTable() {
  const { country, startDate, endDate, category, sortBy, setSortBy, openDrawer, searchQuery, isSyncing } =
    useAppStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [country, startDate, endDate, category, searchQuery]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products-top", country, startDate, endDate, category, sortBy, page, searchQuery],
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
    setPage(1);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-slate-400 text-sm text-center">
          Failed to load products from{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-amber-400">
            {API_BASE}
          </code>
          .
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-white/[0.03] text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-left w-14 font-medium">#</th>
                <th className="py-3 px-4 text-left font-medium">Product</th>
                <th className="py-3 px-4 text-left font-medium w-24">
                  Category
                </th>
                <th
                  className="py-3 px-4 text-right font-medium cursor-pointer hover:text-slate-300 transition-colors w-24"
                  onClick={() => handleSort("bsr")}
                >
                  BSR{" "}
                  {sortBy === "bsr" && (
                    <span className="text-blue-400">↑</span>
                  )}
                </th>
                <th
                  className="py-3 px-4 text-right font-medium cursor-pointer hover:text-slate-300 transition-colors w-32"
                  onClick={() => handleSort("estimated_sales")}
                >
                  Est. Sales/mo{" "}
                  {sortBy === "estimated_sales" && (
                    <span className="text-emerald-400">↓</span>
                  )}
                </th>
                <th
                  className="py-3 px-4 text-right font-medium cursor-pointer hover:text-slate-300 transition-colors w-32"
                  onClick={() => handleSort("revenue")}
                >
                  Est. Revenue/mo{" "}
                  {sortBy === "revenue" && (
                    <span className="text-emerald-400">↓</span>
                  )}
                </th>
                <th className="py-3 px-4 text-right font-medium w-20">
                  Price
                </th>
                <th className="py-3 px-4 text-right font-medium w-20">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {products.map((product: Product, index: number) => (
                  <motion.tr
                    key={`${product.asin}-${index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.015, duration: 0.3 }}
                    onClick={() => openDrawer(product.asin)}
                    className="border-t border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-500 text-sm font-medium">
                        {product.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 group/link">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-10 h-10 object-contain bg-white/[0.04] rounded-lg flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/[0.04] rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-slate-600">
                            📦
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 font-medium truncate max-w-xs group-hover:text-blue-400 transition-colors duration-200">
                            {product.title}
                          </p>
                          {product.brand && (
                            <p className="text-[11px] text-slate-600 truncate">
                              {product.brand}
                            </p>
                          )}
                        </div>
                        <a
                          href={product.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover/link:opacity-100 p-1.5 rounded-md hover:bg-white/[0.08] text-slate-500 hover:text-blue-400 transition-all flex-shrink-0"
                          title="View on Amazon"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] bg-blue-500/10 text-blue-400/80 px-2 py-0.5 rounded-full border border-blue-500/10">
                        {CATEGORY_DISPLAY[product.category] ?? product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-sm text-slate-400">
                        #{product.bsrCategory?.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {product.estimatedMonthlySales != null ? (
                        <span className="font-mono text-sm text-emerald-400 font-medium">
                          {product.estimatedMonthlySales.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {product.estimatedMonthlyRevenue != null ? (
                        <span className="font-mono text-sm text-white/80">
                          $
                          {Math.round(
                            product.estimatedMonthlyRevenue
                          ).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-sm text-slate-400">
                        {product.priceUsd
                          ? `$${product.priceUsd.toFixed(2)}`
                          : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {product.rating ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="font-mono text-sm text-slate-400">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {products.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          {isSyncing ? (
            <>
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">📡</div>
              </div>
              <h3 className="text-lg font-medium text-slate-300">Scraping in progress...</h3>
              <p className="text-slate-500 text-sm text-center max-w-sm">
                Fetching products from Amazon for this region and category.
                Data will appear automatically once ready.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs text-blue-400">Auto-refreshing every 5 seconds</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl opacity-30 mb-2">📊</div>
              <h3 className="text-lg font-medium text-slate-300">No products found</h3>
              <p className="text-slate-500 text-sm text-center max-w-sm mb-4">
                It looks like there&apos;s no data for this region and category yet.
              </p>
              <div className="text-sm text-slate-400 bg-blue-500/10 text-blue-400/90 px-4 py-2 flex items-center gap-3 rounded-lg border border-blue-500/20">
                Click <strong>Sync Now</strong> at the top right to start scraping products from Amazon.
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-1">
          <span className="text-xs">
            Showing{" "}
            <span className="text-slate-300">
              {(page - 1) * 50 + 1}–{Math.min(page * 50, meta.total)}
            </span>{" "}
            of{" "}
            <span className="text-slate-300">{meta.total.toLocaleString()}</span>{" "}
            products
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-400 font-mono">
              {page}/{meta.totalPages || 1}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(meta.totalPages || 1, p + 1))
              }
              disabled={page >= (meta.totalPages || 1)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
