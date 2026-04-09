"use client";
// hi
import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip
);

interface SparklineProps {
  data: { time: string; bsr: number }[];
  height?: number;
}

function getDayKey(time: string): string {
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return time;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTooltipTimestamp(time: string | undefined): string {
  if (!time) return "";
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return time;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDay(time: string): string {
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return time;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatShortTime(time: string): string {
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return time;

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildSparseAxisLabels(data: { time: string }[]): string[] {
  if (data.length === 0) return [];

  const uniqueDays = Array.from(new Set(data.map((entry) => getDayKey(entry.time))));

  if (uniqueDays.length <= 1) {
    const desiredLabels = Math.min(6, data.length);
    const step = desiredLabels > 1
      ? Math.max(1, Math.floor((data.length - 1) / (desiredLabels - 1)))
      : 1;

    return data.map((entry, index) => {
      const isFirst = index === 0;
      const isLast = index === data.length - 1;
      const shouldShow = isFirst || isLast || index % step === 0;
      return shouldShow ? formatShortTime(entry.time) : "";
    });
  }

  return data.map((entry, index) => {
    const currentDay = getDayKey(entry.time);
    const previousDay = index > 0 ? getDayKey(data[index - 1].time) : null;
    const isDayChange = currentDay !== previousDay;
    const isLast = index === data.length - 1;

    if (isDayChange || isLast) {
      return formatShortDay(entry.time);
    }

    return "";
  });
}

export function BsrSparkline({ data, height = 120 }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No BSR history
      </div>
    );
  }

  const labels = buildSparseAxisLabels(data);

  // Invert: lower BSR = better, so we keep normal axis but note it
  const chartData = {
    labels,
    datasets: [
      {
        data: data.map((d) => d.bsr),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        borderWidth: 1.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#3b82f6",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: "#475569",
          font: { size: 9, family: "DM Mono" },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
        border: { display: false },
      },
      y: {
        reverse: true, // Lower BSR = better = higher on chart
        display: true,
        grid: { color: "rgba(255,255,255,0.03)" },
        ticks: {
          color: "#475569",
          font: { size: 9, family: "DM Mono" },
          maxTicksLimit: 5,
          callback: (v: any) => `#${Number(v).toLocaleString()}`,
        },
        border: { display: false },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { family: "Inter", size: 11 },
        bodyFont: { family: "DM Mono", size: 12 },
        padding: 10,
        cornerRadius: 8,
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        callbacks: {
          title: (items: any[]) =>
            formatTooltipTimestamp(data[items[0]?.dataIndex]?.time),
          label: (ctx: any) => `BSR: #${ctx.raw.toLocaleString()}`,
        },
      },
      legend: { display: false },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

interface SalesChartProps {
  data: { time: string; estimatedSales: number }[];
  height?: number;
}

export function SalesChart({ data, height = 120 }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No sales history
      </div>
    );
  }

  const labels = buildSparseAxisLabels(data);

  const chartData = {
    labels,
    datasets: [
      {
        data: data.map((d) => d.estimatedSales),
        backgroundColor: "rgba(16, 185, 129, 0.3)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 3,
        barPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: "#475569",
          font: { size: 9, family: "DM Mono" },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
        border: { display: false },
      },
      y: {
        display: true,
        grid: { color: "rgba(255,255,255,0.03)" },
        ticks: {
          color: "#475569",
          font: { size: 9, family: "DM Mono" },
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: "#1e293b",
        bodyFont: { family: "DM Mono", size: 12 },
        padding: 10,
        cornerRadius: 8,
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        callbacks: {
          title: (items: any[]) =>
            formatTooltipTimestamp(data[items[0]?.dataIndex]?.time),
        },
      },
      legend: { display: false },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
