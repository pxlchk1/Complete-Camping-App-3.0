/**
 * Photo Post Types
 * Enhanced photo posts with post types, tags, and structured fields
 */

import { Timestamp } from "firebase/firestore";

// ==================== Post Types ====================

export type PhotoPostType =
  | "accessibility"
  | "camp-setups"
  | "campground-reviews"
  | "campsites"
  | "cooking"
  | "gear"
  | "pets"
  | "tips-hacks"
  | "trip-highlights"
  | "vehicles"
  | "wildlife-nature";

// Map legacy post types for backwards compatibility
export const mapLegacyPostType = (postType: string): PhotoPostType => {
  const legacyMap: Record<string, PhotoPostType> = {
    "tip-or-fix": "tips-hacks",
    "setup-ideas": "camp-setups",
    "campsite-spotlight": "campsites",
    "conditions-report": "trip-highlights",
    "gear-in-real-life": "gear",
    "camp-cooking": "cooking",
  };
  return legacyMap[postType] || (postType as PhotoPostType);
};

export const POST_TYPE_LABELS: Record<PhotoPostType, string> = {
  "accessibility": "Accessibility",
  "camp-setups": "Camp Setups",
  "campground-reviews": "Campground Reviews",
  "campsites": "Campsites",
  "cooking": "Cooking",
  "gear": "Gear",
  "pets": "Pets",
  "tips-hacks": "Tips & Hacks",
  "trip-highlights": "Trip Highlights",
  "vehicles": "Vehicles",
  "wildlife-nature": "Wildlife & Nature",
};

export const POST_TYPE_ICONS: Record<PhotoPostType, string> = {
  "accessibility": "accessibility",
  "camp-setups": "construct",
  "campground-reviews": "star",
  "campsites": "location",
  "cooking": "flame",
  "gear": "backpack",
  "pets": "paw",
  "tips-hacks": "bulb",
  "trip-highlights": "sunny",
  "vehicles": "car",
  "wildlife-nature": "leaf",
};

export const POST_TYPE_COLORS: Record<PhotoPostType, string> = {
  "accessibility": "#0891b2", // cyan
  "camp-setups": "#16a34a", // green
  "campground-reviews": "#eab308", // yellow
  "campsites": "#2563eb", // blue
  "cooking": "#dc2626", // red
  "gear": "#ea580c", // orange
  "pets": "#ec4899", // pink
  "tips-hacks": "#8b5cf6", // violet
  "trip-highlights": "#f59e0b", // amber
  "vehicles": "#6366f1", // indigo
  "wildlife-nature": "#059669", // emerald
};

// ==================== Trip Styles ====================

export type TripStyle =
  | "car-camping"
  | "tent-camping"
  | "backpacking"
  | "hiking"
  | "rv-trailer"
  | "group-camping"
  | "solo-camping"
  | "family-camping"
  | "winter-camping";

export const TRIP_STYLE_LABELS: Record<TripStyle, string> = {
  "car-camping": "Car camping",
  "tent-camping": "Tent camping",
  "backpacking": "Backpacking",
  "hiking": "Hiking",
  "rv-trailer": "RV or trailer",
  "group-camping": "Group camping",
  "solo-camping": "Solo camping",
  "family-camping": "Family camping",
  "winter-camping": "Winter camping",
};

// ==================== Detail Tags ====================

export type DetailTag =
  | "shade"
  | "privacy"
  | "flat-ground"
  | "windy"
  | "bugs"
  | "mud"
  | "snow"
  | "rain"
  | "quiet"
  | "near-bathrooms"
  | "near-water"
  | "scenic-view"
  | "pet-friendly"
  | "kid-friendly"
  | "accessible";

export const DETAIL_TAG_LABELS: Record<DetailTag, string> = {
  "shade": "Shade",
  "privacy": "Privacy",
  "flat-ground": "Flat ground",
  "windy": "Windy",
  "bugs": "Bugs",
  "mud": "Mud",
  "snow": "Snow",
  "rain": "Rain",
  "quiet": "Quiet",
  "near-bathrooms": "Near bathrooms",
  "near-water": "Near water",
  "scenic-view": "Scenic view",
  "pet-friendly": "Pet friendly",
  "kid-friendly": "Kid friendly",
  "accessible": "Accessible",
};

// ==================== Caption Placeholder Templates ====================
// No helper text - users write their own captions

export const CAPTION_TEMPLATES: Record<PhotoPostType, string> = {
  "accessibility": "",
  "camp-setups": "",
  "campground-reviews": "",
  "campsites": "",
  "cooking": "",
  "gear": "",
  "pets": "",
  "tips-hacks": "",
  "trip-highlights": "",
  "vehicles": "",
  "wildlife-nature": "",
};

// ==================== Photo Post Document ====================

export interface PhotoPost {
  id: string;
  userId: string;
  displayName?: string;
  userHandle?: string;
  photoUrls: string[];
  storagePaths?: string[];
  postType: PhotoPostType;
  caption: string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;

  // Campground/Campsite (for Campsite Spotlight)
  campgroundId?: string;
  campgroundName?: string;
  parkId?: string;
  parkName?: string;
  campsiteNumber?: string;
  hideCampsiteNumber?: boolean; // Hide exact site from public

  // Tags
  tripStyle?: TripStyle;
  detailTags?: DetailTag[];

  // Engagement
  helpfulCount: number;
  voteCount?: number; // Reddit-style upvote/downvote score
  saveCount?: number;
  commentCount?: number;

  // Location (for "Near Me" filtering)
  location?: {
    latitude: number;
    longitude: number;
  };

  // Moderation
  isHidden?: boolean;
  needsReview?: boolean;

  // Legacy support - if migrated from old system
  legacyTags?: string[];
}

// ==================== Helpful Reaction ====================

export interface PhotoPostHelpful {
  userId: string;
  createdAt: Timestamp | string;
}

// ==================== Feed Filters ====================

export interface PhotoFeedFilters {
  postType?: PhotoPostType;
  tripStyle?: TripStyle;
  detailTags?: DetailTag[];
  campgroundId?: string;
  state?: string;
  nearLocation?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  sortBy: "newest" | "most-helpful" | "near-me";
}

// ==================== Quick Post Tile ====================

export interface QuickPostTile {
  postType: PhotoPostType;
  label: string;
  icon: string;
  color: string;
}

// Primary 4 categories for the 2x2 grid on Photos page
export const PRIMARY_PHOTO_TILES: QuickPostTile[] = [
  {
    postType: "campsites",
    label: "Campsites",
    icon: "location",
    color: POST_TYPE_COLORS["campsites"],
  },
  {
    postType: "trip-highlights",
    label: "Trip Highlights",
    icon: "sunny",
    color: POST_TYPE_COLORS["trip-highlights"],
  },
  {
    postType: "camp-setups",
    label: "Camp Setups",
    icon: "construct",
    color: POST_TYPE_COLORS["camp-setups"],
  },
  {
    postType: "gear",
    label: "Gear",
    icon: "backpack",
    color: POST_TYPE_COLORS["gear"],
  },
];

// All available photo topics for the composer
export const QUICK_POST_TILES: QuickPostTile[] = [
  {
    postType: "accessibility",
    label: "Accessibility",
    icon: "accessibility",
    color: POST_TYPE_COLORS["accessibility"],
  },
  {
    postType: "camp-setups",
    label: "Camp Setups",
    icon: "construct",
    color: POST_TYPE_COLORS["camp-setups"],
  },
  {
    postType: "campground-reviews",
    label: "Campground Reviews",
    icon: "star",
    color: POST_TYPE_COLORS["campground-reviews"],
  },
  {
    postType: "campsites",
    label: "Campsites",
    icon: "location",
    color: POST_TYPE_COLORS["campsites"],
  },
  {
    postType: "cooking",
    label: "Cooking",
    icon: "flame",
    color: POST_TYPE_COLORS["cooking"],
  },
  {
    postType: "gear",
    label: "Gear",
    icon: "backpack",
    color: POST_TYPE_COLORS["gear"],
  },
  {
    postType: "pets",
    label: "Pets",
    icon: "paw",
    color: POST_TYPE_COLORS["pets"],
  },
  {
    postType: "tips-hacks",
    label: "Tips & Hacks",
    icon: "bulb",
    color: POST_TYPE_COLORS["tips-hacks"],
  },
  {
    postType: "trip-highlights",
    label: "Trip Highlights",
    icon: "sunny",
    color: POST_TYPE_COLORS["trip-highlights"],
  },
  {
    postType: "vehicles",
    label: "Vehicles",
    icon: "car",
    color: POST_TYPE_COLORS["vehicles"],
  },
  {
    postType: "wildlife-nature",
    label: "Wildlife & Nature",
    icon: "leaf",
    color: POST_TYPE_COLORS["wildlife-nature"],
  },
];
