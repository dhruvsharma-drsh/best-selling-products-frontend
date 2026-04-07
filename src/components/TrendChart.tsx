"use client";

import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendDataPoint {
  date: string;
  rank: number;
  category: string;
  rating: number | null;
  reviewCount: number | null;
}

interface ProductTrend {
  asin: string;
  productName: string;
  dataPoints: TrendDataPoint[];
}

interface TrendChartProps {
  trends: ProductTrend[];
  isLoading?: boolean;
}

const TREND_COLORS = [
  { line: "rgba(139, 92, 246, 1)", fill: "rgba(139, 92, 246, 0.08)" },
  { line: "rgba(59, 130, 246, 1)", fill: "rgba(59, 130, 246, 0.08)" },
  { line: "rgba(16, 185, 129, 1)", fill: "rgba(16, 185, 129, 0.08)" },
  { line: "rgba(245, 158, 11, 1)", fill: "rgba(245, 158, 11, 0.08)" },
  { line: "rgba(244, 63, 94, 1)", fill: "rgba(244, 63, 94, 0.08)" },
  { line: "rgba(99, 102, 241, 1)", fill: "rgba(99, 102, 241, 0.08)" },
];

export function TrendChart({ trends, isLoading }: TrendChartProps) {
  const chartRef = useRef<any>(null);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="shimmer h-64 rounded-lg" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">📈</div>
        <p className="text-slate-400 text-sm">
          Click on products in the table to compare their rank trends over time
        </p>
      </div>
    );
  }

  // Collect all unique dates across all trends
  const allDates = new Set<string>();
  for (const trend of trends) {
    for (const dp of trend.dataPoints) {
      allDates.add(dp.date);
    }
  }
  const sortedDates = Array.from(allDates).sort();

  // Format dates for display
  const labels = sortedDates.map((d) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  });

  const datasets = trends.map((trend, idx) => {
    const color = TREND_COLORS[idx % TREND_COLORS.length];

    // Map dates to ranks — null for dates where product wasn't ranked
    const data = sortedDates.map((date) => {
      const dp = trend.dataPoints.find((p) => p.date === date);
      return dp ? dp.rank : null;
    });

    return {
      label: trend.productName.length > 40
        ? trend.productName.slice(0, 37) + "..."
        : trend.productName,
      data,
      borderColor: color.line,
      backgroundColor: color.fill,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color.line,
      pointBorderColor: "rgba(15, 17, 23, 1)",
      pointBorderWidth: 2,
      tension: 0.3,
      fill: true,
      spanGaps: true,
    };
  });

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        reverse: true, // Rank 1 at top
        min: 1,
        title: {
          display: true,
          text: "Rank Position",
          color: "rgba(148, 163, 184, 0.6)",
          font: { size: 11, family: "Inter" },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.04)",
        },
        ticks: {
          color: "rgba(148, 163, 184, 0.5)",
          font: { size: 10, family: "DM Mono" },
          stepSize: 1,
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.04)",
        },
        ticks: {
          color: "rgba(148, 163, 184, 0.5)",
          font: { size: 10, family: "Inter" },
          maxRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgba(148, 163, 184, 0.8)",
          font: { size: 11, family: "Inter" },
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 17, 23, 0.95)",
        titleColor: "rgba(241, 245, 249, 1)",
        bodyColor: "rgba(148, 163, 184, 1)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 12, family: "Inter" },
        bodyFont: { size: 11, family: "DM Mono" },
        callbacks: {
          label: (ctx: any) => {
            const rank = ctx.parsed.y;
            return rank ? `${ctx.dataset.label}: Rank #${rank}` : "";
          },
        },
      },
    },
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
          Rank Trend Comparison
        </span>
        <span className="text-[10px] text-slate-700 ml-auto">
          {trends.length} product{trends.length !== 1 ? "s" : ""} · {sortedDates.length} date{sortedDates.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{ height: "320px" }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
