/**
 * Gear Closet Types
 * Types for managing user's personal gear collection
 */

import { Timestamp } from "firebase/firestore";

export type GearCategory = 
  | "shelter" 
  | "sleep" 
  | "kitchen" 
  | "water"
  | "lighting"
  | "tools"
  | "safety"
  | "clothing" 
  | "camp_comfort"
  | "electronics"
  | "hygiene"
  | "documents_essentials"
  | "optional_extras"
  | "seating";

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
  { value: "water", label: "Water" },
  { value: "lighting", label: "Lighting" },
  { value: "tools", label: "Tools" },
  { value: "safety", label: "Safety" },
  { value: "clothing", label: "Clothing" },
  { value: "camp_comfort", label: "Camp Comfort" },
  { value: "electronics", label: "Electronics" },
  { value: "hygiene", label: "Hygiene" },
  { value: "documents_essentials", label: "Documents & Essentials" },
  { value: "optional_extras", label: "Optional Extras" },
  { value: "seating", label: "Seating" },
];
