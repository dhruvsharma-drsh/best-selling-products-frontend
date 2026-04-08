"use client";

import { motion, AnimatePresence } from "framer-motion";
// 
interface ArchiveProduct {
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

interface ArchiveTableProps {
  products: ArchiveProduct[];
  isLoading?: boolean;
  selectedDate: string | null;
  onProductClick?: (asin: string) => void;
  compareDates?: string[];
}

export function ArchiveTable({
  products,
  isLoading,
  selectedDate,
  onProductClick,
}: ArchiveTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="shimmer h-4 w-48 rounded" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="shimmer w-8 h-8 rounded-lg" />
              <div className="shimmer h-4 flex-1 rounded" />
              <div className="shimmer h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-slate-400 text-sm">
          Select a date from the timeline above to view product rankings
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-slate-400 text-sm">
          No products found for {selectedDate}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Rankings
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {selectedDate}
          </span>
        </div>
        <span className="text-[10px] text-slate-600">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-slate-600 uppercase tracking-wider border-b border-white/[0.04]">
              <th className="px-5 py-3 text-left font-medium w-12">#</th>
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium w-28">
                Category
              </th>
              <th className="px-5 py-3 text-center font-medium w-20">
                Rating
              </th>
              <th className="px-5 py-3 text-right font-medium w-20">
                Reviews
              </th>
              <th className="px-5 py-3 text-right font-medium w-16">
                Archive
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onProductClick?.(product.asin)}
                  className="border-b border-white/[0.03] hover:bg-white/[0.04] cursor-pointer transition-colors group"
                >
                  {/* Rank */}
                  <td className="px-5 py-3">
                    <div
                      className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                      ${
                        product.rank <= 3
                          ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20"
                          : product.rank <= 10
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                          : "bg-white/[0.04] text-slate-500"
                      }
                    `}
                    >
                      {product.rank}
                    </div>
                  </td>

                  {/* Product Name */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover bg-white/[0.05]"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate max-w-md group-hover:text-white transition-colors">
                          {product.productName}
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono">
                          {product.asin}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-3">
                    <span className="text-xs text-slate-500 capitalize">
                      {product.category}
                    </span>
                  </td>

                  {/* Rating */}
                  <td className="px-5 py-3 text-center">
                    {product.rating ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-amber-400 text-[10px]">★</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </td>

                  {/* Reviews */}
                  <td className="px-5 py-3 text-right">
                    {product.reviewCount ? (
                      <span className="text-xs text-slate-500 font-mono">
                        {product.reviewCount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </td>

                  {/* Archive Link */}
                  <td className="px-5 py-3 text-right">
                    <a
                      href={product.archiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      View ↗
                    </a>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
