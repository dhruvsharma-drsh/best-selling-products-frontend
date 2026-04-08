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
  iconPath: string;
  gradient: string;
  iconColor: string;
}> = [
  {
    key: "totalProducts",
    label: "Products Tracked",
    render: (stats) => stats?.totalProducts?.toLocaleString() ?? "-",
    color: "text-white",
    iconPath:
      "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    gradient: "from-blue-500/10 to-transparent",
    iconColor: "text-blue-400",
  },
  {
    key: "categoriesTracked",
    label: "Categories Monitored",
    render: (stats) => String(stats?.categoriesTracked ?? "-"),
    color: "text-blue-400",
    iconPath: "M4 6h16M4 12h16M4 18h7",
    gradient: "from-indigo-500/10 to-transparent",
    iconColor: "text-indigo-400",
  },
  {
    key: "totalSnapshots",
    label: "BSR Snapshots",
    render: (stats) => {
      const value = stats?.totalSnapshots;
      return value
        ? value > 1000
          ? `${(value / 1000).toFixed(1)}K`
          : String(value)
        : "-";
    },
    color: "text-emerald-400",
    iconPath:
      "M22 12h-4l-3 9L9 3l-3 9H2",
    gradient: "from-emerald-500/10 to-transparent",
    iconColor: "text-emerald-400",
  },
  {
    key: "lastUpdated",
    label: "Last Refresh",
    render: (stats) =>
      stats?.lastUpdated
        ? new Date(stats.lastUpdated).toLocaleTimeString()
        : "Never",
    color: "text-amber-400",
    iconPath: "M12 2v10l4.5 4.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    gradient: "from-amber-500/10 to-transparent",
    iconColor: "text-amber-400",
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
          className={`glass-card group rounded-xl bg-gradient-to-br p-4 ${stat.gradient}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${stat.iconColor} opacity-60`}
            >
              <path d={stat.iconPath} />
            </svg>
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
