"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { FiltersBar } from "@/components/FiltersBar";
import { ProductDrawer } from "@/components/ProductDrawer";
import { ProductTable } from "@/components/ProductTable";
import { SearchBar } from "@/components/SearchBar";
import { StatsBar } from "@/components/StatsBar";

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
              >
                AI
              </motion.div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-white">
                  Amazon Sales Intelligence
                </h1>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  BSR Analytics Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden w-72 lg:block">
                <SearchBar />
              </div>
              <Link
                href="/history"
                className="hidden items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-400 transition-colors hover:border-purple-500/30 hover:text-purple-300 md:flex"
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
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                History
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1440px] space-y-6 px-6 py-6">
        <div className="lg:hidden">
          <SearchBar />
        </div>

        <StatsBar />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <FiltersBar />
        </motion.div>

        <CategoryFilter />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">
              Top Products by Estimated Sales
            </h2>
            <p className="text-[11px] text-slate-600">
              Hover a product to view Amazon or open the graph popup
            </p>
          </div>
          <ProductTable />
        </div>
      </main>

      <ProductDrawer />

      <footer className="relative z-10 mt-12 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1440px] px-6 py-6">
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <p>
              Amazon Sales Intelligence Platform - BSR estimation uses
              category-calibrated logarithmic interpolation
            </p>
            <p>Accuracy: 70-85% on stable products - Data refreshes hourly</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
