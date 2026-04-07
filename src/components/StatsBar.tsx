"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats, type PlatformStats } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

const statCards: Array<{
  key: keyof PlatformStats;
  label: string;
  render: (stats?: PlatformStats) => string;
  color: string;
  icon: string;
  gradient: string;
}> = [
  {
    key: "totalProducts",
    label: "Products Tracked",
    render: (stats) => stats?.totalProducts?.toLocaleString() ?? "-",
    color: "text-white",
    icon: "Products",
    gradient: "from-blue-500/10 to-transparent",
  },
  {
    key: "categoriesTracked",
    label: "Categories Monitored",
    render: (stats) => String(stats?.categoriesTracked ?? "-"),
    color: "text-blue-400",
    icon: "Categories",
    gradient: "from-indigo-500/10 to-transparent",
  },
  {
    key: "totalSnapshots",
    label: "BSR Snapshots",
    render: (stats) => {
      const value = stats?.totalSnapshots;
      return value ? (value > 1000 ? `${(value / 1000).toFixed(1)}K` : String(value)) : "-";
    },
    color: "text-emerald-400",
    icon: "Snapshots",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    key: "lastUpdated",
    label: "Last Refresh",
    render: (stats) =>
      stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : "Never",
    color: "text-amber-400",
    icon: "Updated",
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className={`glass-card group rounded-xl bg-gradient-to-br p-4 transition-all duration-300 hover:border-white/10 ${stat.gradient}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{stat.icon}</span>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
          </div>
          {isLoading ? (
            <div className="shimmer h-8 w-24 rounded" />
          ) : (
            <p className={`font-mono text-2xl font-semibold ${stat.color}`}>
              {stat.render(stats)}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
