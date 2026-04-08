"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useRef } from "react";
// hello 
export function CategoryFilter() {
  const { category, setCategory } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000,
  });

  const allCategories = [
    { key: "all", displayName: "All Categories" },
    ...(categories ?? []),
  ];

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0f1117] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0f1117] to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {allCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`relative flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              category === cat.key
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-slate-300"
            }`}
          >
            {category === cat.key && (
              <motion.div
                layoutId="category-active"
                className="absolute inset-0 bg-blue-500/20 border border-blue-500/30 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
