import { create } from "zustand";

export type SyncKind = "bulk" | "realtime";

export interface ActiveSyncTarget {
  country: string;
  category: string;
  kind: SyncKind;
}

interface AppState {
  country: string;
  startDate: string | null;
  endDate: string | null;
  category: string;
  sortBy: "estimated_sales" | "bsr" | "revenue";
  selectedAsin: string | null;
  drawerOpen: boolean;
  searchQuery: string;
  isSyncing: boolean;
  activeSyncTarget: ActiveSyncTarget | null;

  setCountry: (country: string) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  setCategory: (cat: string) => void;
  setSortBy: (sort: "estimated_sales" | "bsr" | "revenue") => void;
  openDrawer: (asin: string) => void;
  closeDrawer: () => void;
  setSearchQuery: (q: string) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setActiveSyncTarget: (target: ActiveSyncTarget | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  country: "US",
  startDate: null,
  endDate: null,
  category: "all",
  sortBy: "estimated_sales",
  selectedAsin: null,
  drawerOpen: false,
  searchQuery: "",
  isSyncing: false,
  activeSyncTarget: null,

  setCountry: (country) => set({ country }),
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy }),
  openDrawer: (asin) => set({ selectedAsin: asin, drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false, selectedAsin: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setActiveSyncTarget: (activeSyncTarget) => set({ activeSyncTarget }),
}));
