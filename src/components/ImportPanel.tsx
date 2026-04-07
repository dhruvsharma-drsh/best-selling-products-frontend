"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AvailableSnapshot {
  timestamp: string;
  originalUrl: string;
  date: string;
  archiveUrl: string;
  alreadyImported: boolean;
}

interface ImportPanelProps {
  onDiscover: (category: string) => Promise<AvailableSnapshot[]>;
  onImport: (archiveUrl: string, category: string, date: string) => Promise<void>;
  onBulkImport: (category: string, snapshots: { archiveUrl: string; date: string }[]) => Promise<void>;
}

const CATEGORIES = [
  { key: "electronics", label: "Electronics" },
  { key: "books", label: "Books" },
  { key: "kitchen", label: "Kitchen" },
  { key: "clothing", label: "Clothing" },
  { key: "beauty", label: "Beauty" },
  { key: "toys", label: "Toys & Games" },
  { key: "sports", label: "Sports" },
  { key: "software", label: "Software" },
  { key: "home-improvement", label: "Home Improvement" },
  { key: "automotive", label: "Automotive" },
];

export function ImportPanel({ onDiscover, onImport, onBulkImport }: ImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("electronics");
  const [snapshots, setSnapshots] = useState<AvailableSnapshot[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setSnapshots([]);
    setStatusMessage(null);
    try {
      const results = await onDiscover(category);
      setSnapshots(results);
      setStatusMessage(`Found ${results.length} snapshots for ${category}`);
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImport = async (snap: AvailableSnapshot) => {
    setIsImporting(snap.timestamp);
    try {
      await onImport(snap.archiveUrl, category, snap.date);
      setStatusMessage(`Import started for ${snap.date}`);
      // Mark as imported locally
      setSnapshots((prev) =>
        prev.map((s) =>
          s.timestamp === snap.timestamp ? { ...s, alreadyImported: true } : s
        )
      );
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setIsImporting(null);
    }
  };

  const handleBulkImport = async () => {
    const selected = snapshots.filter(
      (s) => selectedForBulk.has(s.timestamp) && !s.alreadyImported
    );
    if (selected.length === 0) return;

    setIsBulkImporting(true);
    try {
      await onBulkImport(
        category,
        selected.map((s) => ({ archiveUrl: s.archiveUrl, date: s.date }))
      );
      setStatusMessage(`Bulk import started for ${selected.length} snapshots`);
      setSnapshots((prev) =>
        prev.map((s) =>
          selectedForBulk.has(s.timestamp) ? { ...s, alreadyImported: true } : s
        )
      );
      setSelectedForBulk(new Set());
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error).message}`);
    } finally {
      setIsBulkImporting(false);
    }
  };

  const toggleBulkSelect = (timestamp: string) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(timestamp)) next.delete(timestamp);
      else next.add(timestamp);
      return next;
    });
  };

  const selectAllNew = () => {
    const newTimestamps = snapshots
      .filter((s) => !s.alreadyImported)
      .map((s) => s.timestamp);
    setSelectedForBulk(new Set(newTimestamps));
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/20">
            <span className="text-xs">📥</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-300">
              Import Historical Data
            </p>
            <p className="text-[10px] text-slate-600">
              Discover & import from Wayback Machine
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-slate-600 text-sm"
        >
          ▼
        </motion.span>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/[0.04]">
              {/* Category + Discover */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSnapshots([]);
                      setSelectedForBulk(new Set());
                    }}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-purple-500/40 focus:outline-none transition-colors appearance-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key} className="bg-[#151820]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleDiscover}
                  disabled={isDiscovering}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDiscovering ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      Scanning...
                    </span>
                  ) : (
                    "🔍 Discover"
                  )}
                </button>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-slate-500 px-3 py-2 bg-white/[0.02] rounded-lg"
                >
                  {statusMessage}
                </motion.div>
              )}

              {/* Snapshot List */}
              {snapshots.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Available Snapshots
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllNew}
                        className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        Select All New
                      </button>
                      {selectedForBulk.size > 0 && (
                        <button
                          onClick={handleBulkImport}
                          disabled={isBulkImporting}
                          className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isBulkImporting
                            ? "Importing..."
                            : `Import ${selectedForBulk.size} Selected`}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {snapshots.map((snap) => (
                      <div
                        key={snap.timestamp}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all
                          ${
                            snap.alreadyImported
                              ? "bg-emerald-500/5 border border-emerald-500/10 text-slate-500"
                              : selectedForBulk.has(snap.timestamp)
                              ? "bg-purple-500/10 border border-purple-500/20"
                              : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04]"
                          }
                        `}
                      >
                        {/* Checkbox for bulk */}
                        {!snap.alreadyImported && (
                          <input
                            type="checkbox"
                            checked={selectedForBulk.has(snap.timestamp)}
                            onChange={() => toggleBulkSelect(snap.timestamp)}
                            className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer"
                          />
                        )}

                        <span className="text-slate-400 font-mono flex-1">
                          {snap.date}
                        </span>

                        {snap.alreadyImported ? (
                          <span className="text-emerald-500 text-[10px]">
                            ✓ Imported
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImport(snap)}
                            disabled={isImporting === snap.timestamp}
                            className="text-[10px] px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isImporting === snap.timestamp
                              ? "..."
                              : "Import"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
