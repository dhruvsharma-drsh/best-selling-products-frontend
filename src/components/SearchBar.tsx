"use client";

import { useAppStore } from "@/lib/store";
import { useRef, useEffect, useState } from "react";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localValue);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [localValue, setSearchQuery]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">
        🔍
      </span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-8 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all duration-200"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue("");
            setSearchQuery("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}
