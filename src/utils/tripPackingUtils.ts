/**
 * Trip Packing Utilities
 * Helpers for deriving season, computing trip days, and applying smart recommendations
 */

import { Season, PackingTemplateKey } from "../state/packingStore";
import { 
  PackingTemplateItem, 
  PackingTemplate, 
  Season as TemplateSeason,
} from "../constants/packingTemplatesV2";

// ============================================================================
// SEASON DERIVATION
// ============================================================================

/**
 * Derive season from a date
 * Dec-Feb => winter, Mar-May => spring, Jun-Aug => summer, Sep-Nov => fall
 */
export function deriveSeasonFromDate(date: Date | string): Season {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = d.getMonth(); // 0-indexed

  if (month >= 11 || month <= 1) return "winter"; // Dec, Jan, Feb
  if (month >= 2 && month <= 4) return "spring";  // Mar, Apr, May
  if (month >= 5 && month <= 7) return "summer";  // Jun, Jul, Aug
  return "fall"; // Sep, Oct, Nov
}

/**
 * Get human-readable season label
 */
export function getSeasonLabel(season: Season): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

// ============================================================================
// TRIP DAYS COMPUTATION
// ============================================================================

/**
 * Compute trip duration in days from start and end dates
 * Returns at least 1 day
 */
export function computeTripDays(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  
  // Reset time to midnight for accurate day calculation
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffMs = endMidnight.getTime() - startMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
  
  return Math.max(1, diffDays);
}

// ============================================================================
// TRIP CONTEXT FOR PACKING
// ============================================================================

export interface PackingTripContext {
  tripId: string;
  tripName: string;
  tripDays: number;
  season: Season;
}

/**
 * Build packing context from trip data
 */
export function buildPackingContext(trip: {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  season?: Season;
}): PackingTripContext {
  const tripDays = computeTripDays(trip.startDate, trip.endDate);
  const season = trip.season ?? deriveSeasonFromDate(trip.startDate);
  
  return {
    tripId: trip.id,
    tripName: trip.name,
    tripDays,
    season,
  };
}

// ============================================================================
// QUANTITY MULTIPLIERS
// ============================================================================

export interface ItemQuantityRule {
  itemNamePattern: RegExp | string;
  category?: string;
  getQuantity: (tripDays: number) => number;
  unit?: string;
  note?: string;
}

/**
 * Quantity rules for duration-based items
 */
export const DURATION_QUANTITY_RULES: ItemQuantityRule[] = [
  // Clothing basics - scale with trip length
  {
    itemNamePattern: /socks/i,
    category: "Clothing",
    getQuantity: (days) => days + 1,
    unit: "pair",
  },
  {
    itemNamePattern: /underwear/i,
    category: "Clothing",
    getQuantity: (days) => days + 1,
  },
  {
    itemNamePattern: /t-shirt|shirt/i,
    category: "Clothing",
    getQuantity: (days) => Math.ceil(days / 2) + 1,
  },
  // Meal Prep consumables - light scaling
  {
    itemNamePattern: /trash bag/i,
    category: "Meal Prep",
    getQuantity: (days) => Math.max(2, Math.ceil(days / 2)),
  },
  {
    itemNamePattern: /paper towel/i,
    category: "Meal Prep",
    getQuantity: () => 1,
    note: "Bring extra roll for trips over 3 nights",
  },
  // Ice packs
  {
    itemNamePattern: /ice pack/i,
    getQuantity: (days) => Math.max(2, Math.ceil(days / 2)),
  },
];

/**
 * Get quantity recommendation for an item based on trip duration
 */
export function getItemQuantity(
  itemName: string,
  category: string,
  tripDays: number
): { qty: number; unit?: string; note?: string } | null {
  for (const rule of DURATION_QUANTITY_RULES) {
    const pattern = typeof rule.itemNamePattern === "string"
      ? new RegExp(rule.itemNamePattern, "i")
      : rule.itemNamePattern;
    
    if (pattern.test(itemName)) {
      // Check category match if specified
      if (rule.category && !category.toLowerCase().includes(rule.category.toLowerCase())) {
        continue;
      }
      return {
        qty: rule.getQuantity(tripDays),
        unit: rule.unit,
        note: rule.note,
      };
    }
  }
  return null;
}

// ============================================================================
// SEASON MODIFIERS
// ============================================================================

export interface SeasonalItem {
  name: string;
  category: string;
  essential: boolean;
  note?: string;
}

export const WINTER_ITEMS: SeasonalItem[] = [
  { name: "Hand warmers", category: "Clothing", essential: false },
  { name: "Extra base layers", category: "Clothing", essential: true },
  { name: "Insulated gloves", category: "Clothing", essential: true },
  { name: "Warm hat/beanie", category: "Clothing", essential: true },
  { name: "Neck gaiter", category: "Clothing", essential: false },
];

export const SUMMER_ITEMS: SeasonalItem[] = [
  { name: "Bug spray", category: "Personal Care", essential: true },
  { name: "Sunscreen", category: "Personal Care", essential: true },
  { name: "After-bite relief", category: "Personal Care", essential: false },
];

export const SPRING_FALL_NOTES: { itemPattern: RegExp; note: string }[] = [
  { itemPattern: /rain jacket|rain layer/i, note: "Essential for spring/fall - expect rain" },
  { itemPattern: /fleece|warm layer/i, note: "Temps can drop at night" },
];

export const WINTER_NOTES: { itemPattern: RegExp; note: string }[] = [
  { itemPattern: /sleeping bag/i, note: "Cold rated bag recommended (0-20°F)" },
  { itemPattern: /sleeping pad/i, note: "High R-value (4+) recommended for insulation" },
];

export const SUMMER_NOTES: { itemPattern: RegExp; note: string }[] = [
  { itemPattern: /water|hydration/i, note: "Bring extra water capacity for heat" },
];

/**
 * Get seasonal items to add based on season and selected categories
 */
export function getSeasonalItems(
  season: Season,
  selectedCategories: string[]
): SeasonalItem[] {
  const items: SeasonalItem[] = [];
  
  if (season === "winter") {
    for (const item of WINTER_ITEMS) {
      if (selectedCategories.some(cat => 
        cat.toLowerCase().includes(item.category.toLowerCase()) ||
        item.category.toLowerCase().includes("clothing")
      )) {
        items.push(item);
      }
    }
  }
  
  if (season === "summer") {
    for (const item of SUMMER_ITEMS) {
      if (selectedCategories.some(cat => 
        cat.toLowerCase().includes(item.category.toLowerCase()) ||
        item.category.toLowerCase() === "personal care"
      )) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * Get seasonal note for an item if applicable
 */
export function getSeasonalNote(itemName: string, season: Season): string | null {
  const noteRules = season === "winter" 
    ? WINTER_NOTES 
    : season === "summer"
    ? SUMMER_NOTES
    : (season === "spring" || season === "fall")
    ? SPRING_FALL_NOTES
    : [];
  
  for (const rule of noteRules) {
    if (rule.itemPattern.test(itemName)) {
      return rule.note;
    }
  }
  return null;
}

// ============================================================================
// PACKING LIST METADATA
// ============================================================================

export interface PackingListGenerationMeta {
  tripDaysUsedForGeneration: number;
  seasonUsedForGeneration: Season;
  selectedCategoryKeys: PackingTemplateKey[];
  generatedAt: string;
}

/**
 * Check if packing list needs regeneration based on trip changes
 */
export function needsRegeneration(
  meta: PackingListGenerationMeta | undefined,
  currentTripDays: number,
  currentSeason: Season
): boolean {
  if (!meta) return false;
  
  return (
    meta.tripDaysUsedForGeneration !== currentTripDays ||
    meta.seasonUsedForGeneration !== currentSeason
  );
}

// ============================================================================
// DE-DUPLICATION ALGORITHM
// ============================================================================

/**
 * Candidate item for de-duplication scoring
 */
interface DedupeCandidate {
  item: PackingTemplateItem;
  templateKey: PackingTemplateKey;
  precedenceTier: number;
  seasonScore: number; // 0-10 bonus for season match
  totalScore: number;
}

/**
 * Score a candidate item based on precedence and season match
 */
function scoreCandidate(
  item: PackingTemplateItem,
  template: PackingTemplate,
  targetSeason: Season
): DedupeCandidate {
  // Get precedence from item or fall back to template default
  const precedenceTier = item.precedenceTier ?? template.defaultPrecedence;
  
  // Season bonus: +10 if item is specifically tagged for target season
  let seasonScore = 0;
  if (item.seasonTags && item.seasonTags.includes(targetSeason as TemplateSeason)) {
    seasonScore = 10;
  }
  
  return {
    item,
    templateKey: template.key,
    precedenceTier,
    seasonScore,
    totalScore: precedenceTier + seasonScore,
  };
}

/**
 * De-duplicate items across templates
 * 
 * Algorithm:
 * 1. Collect all items from selected templates
 * 2. Group items by canonicalKey (items without canonicalKey are never de-duped)
 * 3. For each group, score candidates and keep the highest-scoring winner
 * 4. Remove any items that conflict with winners (via conflictsWith)
 * 
 * @param templates - Array of selected templates
 * @param targetSeason - Current trip season for scoring
 * @returns Deduplicated array of template items with their source template keys
 */
export function deduplicateTemplateItems(
  templates: PackingTemplate[],
  targetSeason: Season
): { item: PackingTemplateItem; templateKey: PackingTemplateKey }[] {
  // Step 1: Collect all items with their source templates
  const allItems: { item: PackingTemplateItem; template: PackingTemplate }[] = [];
  
  for (const template of templates) {
    for (const item of template.items) {
      allItems.push({ item, template });
    }
  }
  
  // Step 2: Group by canonicalKey
  const canonicalGroups = new Map<string, DedupeCandidate[]>();
  const standaloneItems: { item: PackingTemplateItem; templateKey: PackingTemplateKey }[] = [];
  
  for (const { item, template } of allItems) {
    if (item.canonicalKey) {
      // Item has canonical key - add to group for de-duplication
      const candidates = canonicalGroups.get(item.canonicalKey) ?? [];
      candidates.push(scoreCandidate(item, template, targetSeason));
      canonicalGroups.set(item.canonicalKey, candidates);
    } else {
      // No canonical key - standalone item, check for exact name duplicates later
      standaloneItems.push({ item, templateKey: template.key });
    }
  }
  
  // Step 3: For each canonical group, pick the winner
  const winners: { item: PackingTemplateItem; templateKey: PackingTemplateKey }[] = [];
  const winningCanonicalKeys = new Set<string>();
  
  for (const [canonicalKey, candidates] of canonicalGroups) {
    // Sort by total score descending
    candidates.sort((a, b) => b.totalScore - a.totalScore);
    
    // Winner is first (highest score)
    const winner = candidates[0];
    winners.push({ item: winner.item, templateKey: winner.templateKey });
    winningCanonicalKeys.add(canonicalKey);
  }
  
  // Step 4: Filter standalone items for exact name duplicates
  const seenNames = new Set<string>();
  
  // First, add all winner names
  for (const { item } of winners) {
    seenNames.add(item.name.toLowerCase());
  }
  
  // Filter standalone items - remove exact name duplicates
  const uniqueStandalone: { item: PackingTemplateItem; templateKey: PackingTemplateKey }[] = [];
  for (const { item, templateKey } of standaloneItems) {
    const nameLower = item.name.toLowerCase();
    if (!seenNames.has(nameLower)) {
      seenNames.add(nameLower);
      uniqueStandalone.push({ item, templateKey });
    }
  }
  
  // Step 5: Remove items that conflict with winners
  const conflictingKeys = new Set<string>();
  for (const { item } of winners) {
    if (item.conflictsWith) {
      for (const conflictKey of item.conflictsWith) {
        conflictingKeys.add(conflictKey);
      }
    }
  }
  
  // Filter out conflicting items
  const finalItems = [...winners, ...uniqueStandalone].filter(({ item }) => {
    // If this item's canonical key is in the conflict set, remove it
    if (item.canonicalKey && conflictingKeys.has(item.canonicalKey)) {
      return false;
    }
    return true;
  });
  
  return finalItems;
}
