"use client";

import { motion } from "framer-motion";

interface DateTimelineProps {
  dates: { date: string; category: string; productCount: number }[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  isLoading?: boolean;
}

export function DateTimeline({
  dates,
  selectedDate,
  onSelectDate,
  isLoading,
}: DateTimelineProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse-dot" />
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Loading Timeline...
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-16 w-24 rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <p className="text-slate-500 text-sm">
          No archived snapshots imported yet. Use the Import Panel below to
          discover and import historical data.
        </p>
      </div>
    );
  }

  // Group dates by year for visual separation
  const byYear: Record<string, typeof dates> = {};
  for (const d of dates) {
    const year = d.date.split("-")[0];
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(d);
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
          Snapshot Timeline
        </span>
        <span className="text-[10px] text-slate-700 ml-auto">
          {dates.length} snapshot{dates.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-thin">
        {Object.entries(byYear)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([year, yearDates]) => (
            <div key={year} className="flex-shrink-0">
              <p className="text-[10px] text-slate-600 font-medium mb-2">
                {year}
              </p>
              <div className="flex gap-1.5">
                {yearDates.map((d) => {
                  const isSelected = selectedDate === d.date;
                  const month = new Date(d.date + "T00:00:00").toLocaleString(
                    "en-US",
                    { month: "short" }
                  );
                  const day = new Date(d.date + "T00:00:00").getDate();

                  return (
                    <motion.button
                      key={d.date}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectDate(d.date)}
                      className={`
                        flex flex-col items-center justify-center
                        w-14 h-16 rounded-lg text-center transition-all duration-200 cursor-pointer
                        ${
                          isSelected
                            ? "bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/10"
                            : "bg-white/[0.03] border border-transparent hover:bg-white/[0.07] hover:border-white/[0.1] text-slate-400"
                        }
                      `}
                      title={`${d.date} — ${d.productCount} products`}
                    >
                      <span className="text-[10px] font-medium opacity-60">
                        {month}
                      </span>
                      <span className="text-sm font-bold">{day}</span>
                      <span className="text-[9px] opacity-50">
                        {d.productCount}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
