"use client";

import { StatsBar } from "@/components/StatsBar";
import { FiltersBar } from "@/components/FiltersBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductTable } from "@/components/ProductTable";
import { ProductDrawer } from "@/components/ProductDrawer";
import { SearchBar } from "@/components/SearchBar";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25"
              >
                AI
              </motion.div>
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Amazon Sales Intelligence
                </h1>
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  BSR Analytics Platform
                </p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              <div className="w-64 hidden lg:block">
                <SearchBar />
              </div>
              <FiltersBar />
              <Link
                href="/history"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/30 hidden md:flex items-center gap-1.5"
              >
                <span>⏳</span> History
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6 relative z-10">
        {/* Mobile search */}
        <div className="lg:hidden">
          <SearchBar />
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Category Filter */}
        <CategoryFilter />

        {/* Product Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-300">
              Top Products by Estimated Sales
            </h2>
            <p className="text-[11px] text-slate-600">
              Click any row for details
            </p>
          </div>
          <ProductTable />
        </div>
      </main>

      {/* Product Detail Drawer */}
      <ProductDrawer />

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-12 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <p>
              Amazon Sales Intelligence Platform · BSR estimation uses
              category-calibrated logarithmic interpolation
            </p>
            <p>
              Accuracy: 70-85% on stable products · Data refreshes hourly
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
