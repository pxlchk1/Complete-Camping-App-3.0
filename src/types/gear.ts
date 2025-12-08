/**
 * Gear Closet Types
 * Types for managing user's personal gear collection
 */

import { Timestamp } from "firebase/firestore";

export type GearCategory = "shelter" | "sleep" | "kitchen" | "clothing" | "bags" | "lighting" | "misc";

export interface GearItem {
  id: string;
  ownerId: string;
  name: string;
  category: GearCategory;
  brand?: string;
  model?: string;
  weight?: string;
  notes?: string;
  imageUrl?: string;
  isFavorite: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CreateGearData {
  name: string;
  category: GearCategory;
  brand?: string;
  model?: string;
  weight?: string;
  notes?: string;
  imageUrl?: string;
  isFavorite?: boolean;
}

export interface UpdateGearData {
  name?: string;
  category?: GearCategory;
  brand?: string | null;
  model?: string | null;
  weight?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  isFavorite?: boolean;
}

export const GEAR_CATEGORIES: { value: GearCategory; label: string }[] = [
  { value: "shelter", label: "Shelter" },
  { value: "sleep", label: "Sleep" },
  { value: "kitchen", label: "Kitchen" },
  { value: "clothing", label: "Clothing" },
  { value: "bags", label: "Bags" },
  { value: "lighting", label: "Lighting" },
  { value: "misc", label: "Misc" },
];
