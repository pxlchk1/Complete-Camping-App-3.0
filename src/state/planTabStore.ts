import { create } from "zustand";

export type PlanTab = "trips" | "parks" | "weather" | "packing" | "meals";

interface PlanTabState {
  activeTab: PlanTab;
  setActiveTab: (tab: PlanTab) => void;
}

export const usePlanTabStore = create<PlanTabState>((set) => ({
  activeTab: "trips",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
