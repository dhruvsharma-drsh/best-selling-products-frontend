"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

const statCards = [
  {
    key: "totalProducts",
    label: "Products Tracked",
    format: (v: number) => v?.toLocaleString() ?? "—",
    color: "text-white",
    icon: "📦",
    gradient: "from-blue-500/10 to-transparent",
  },
  {
    key: "categoriesTracked",
    label: "Categories Monitored",
    format: (v: number) => String(v ?? "—"),
    color: "text-blue-400",
    icon: "🗂️",
    gradient: "from-indigo-500/10 to-transparent",
  },
  {
    key: "totalSnapshots",
    label: "BSR Snapshots",
    format: (v: number) =>
      v ? (v > 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)) : "—",
    color: "text-emerald-400",
    icon: "📊",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    key: "lastUpdated",
    label: "Last Refresh",
    format: (v: string | null) =>
      v ? new Date(v).toLocaleTimeString() : "Never",
    color: "text-amber-400",
    icon: "⏱️",
    gradient: "from-amber-500/10 to-transparent",
  },
];

export function StatsBar() {
  const { country, category } = useAppStore();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", country, category],
    queryFn: () => fetchStats(country, category),
    refetchInterval: 30_000,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className={`glass-card rounded-xl p-4 bg-gradient-to-br ${stat.gradient} group hover:border-white/10 transition-all duration-300`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{stat.icon}</span>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
              {stat.label}
            </p>
          </div>
          {isLoading ? (
            <div className="h-8 shimmer rounded w-24" />
          ) : (
            <p className={`text-2xl font-mono font-semibold ${stat.color}`}>
              {stat.format((stats as any)?.[stat.key])}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
