/**
 * Packing Templates V2 - Simplified template system
 * 9 pre-built templates with ~117+ items total
 */

import { Ionicons } from "@expo/vector-icons";
import { PackingTemplateKey } from "../state/packingStore";

// ============================================================================
// TYPES
// ============================================================================

export interface PackingTemplateItem {
  name: string;
  category: string;
  essential: boolean;
}

export interface PackingTemplate {
  key: PackingTemplateKey;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: PackingTemplateItem[];
}

// ============================================================================
// DEFAULT SECTIONS (empty list categories)
// ============================================================================

export const DEFAULT_SECTIONS = [
  "Shelter & Sleep",
  "Clothing",
  "Cooking & Food",
  "Navigation & Safety",
  "Personal Care",
  "Tools & Utilities",
  "Camp Comfort",
  "Entertainment",
  "Other",
];

// ============================================================================
// TEMPLATES
// ============================================================================

const ESSENTIAL_CAMPING: PackingTemplate = {
  key: "essential",
  name: "Essential Camping Gear",
  description: "The must-have basics for any camping trip",
  icon: "checkmark-circle",
  items: [
    { name: "Tent", category: "Shelter & Sleep", essential: true },
    { name: "Tent footprint/ground cloth", category: "Shelter & Sleep", essential: false },
    { name: "Tent stakes", category: "Shelter & Sleep", essential: true },
    { name: "Sleeping bag", category: "Shelter & Sleep", essential: true },
    { name: "Sleeping pad", category: "Shelter & Sleep", essential: true },
    { name: "Pillow", category: "Shelter & Sleep", essential: false },
    { name: "Camp stove", category: "Cooking & Food", essential: true },
    { name: "Fuel", category: "Cooking & Food", essential: true },
    { name: "Lighter/matches", category: "Cooking & Food", essential: true },
    { name: "Headlamp", category: "Navigation & Safety", essential: true },
    { name: "Extra batteries", category: "Navigation & Safety", essential: true },
    { name: "First aid kit", category: "Navigation & Safety", essential: true },
    { name: "Multi-tool or knife", category: "Tools & Utilities", essential: true },
  ],
};

const COOKING_FOOD: PackingTemplate = {
  key: "cooking",
  name: "Cooking & Food",
  description: "Everything you need for camp cooking",
  icon: "restaurant",
  items: [
    { name: "Camp stove", category: "Cooking & Food", essential: true },
    { name: "Fuel canister", category: "Cooking & Food", essential: true },
    { name: "Lighter/matches", category: "Cooking & Food", essential: true },
    { name: "Pot/pan", category: "Cooking & Food", essential: true },
    { name: "Cooking utensils", category: "Cooking & Food", essential: true },
    { name: "Plates/bowls", category: "Cooking & Food", essential: true },
    { name: "Cups/mugs", category: "Cooking & Food", essential: true },
    { name: "Cooler", category: "Cooking & Food", essential: false },
    { name: "Cutting board", category: "Cooking & Food", essential: false },
    { name: "Dish soap & sponge", category: "Cooking & Food", essential: true },
  ],
};

const SAFETY_FIRST_AID: PackingTemplate = {
  key: "safety",
  name: "Safety & First Aid",
  description: "Be prepared for emergencies",
  icon: "medkit",
  items: [
    { name: "First aid kit", category: "Navigation & Safety", essential: true },
    { name: "Emergency whistle", category: "Navigation & Safety", essential: true },
    { name: "Emergency blanket", category: "Navigation & Safety", essential: true },
    { name: "Sunscreen", category: "Personal Care", essential: true },
    { name: "Bug spray", category: "Personal Care", essential: true },
    { name: "Personal medications", category: "Personal Care", essential: true },
    { name: "Map/GPS", category: "Navigation & Safety", essential: false },
  ],
};

const CLOTHING_PERSONAL: PackingTemplate = {
  key: "clothing",
  name: "Clothing & Personal",
  description: "Clothes and personal items",
  icon: "shirt",
  items: [
    { name: "Hiking pants/shorts", category: "Clothing", essential: true },
    { name: "T-shirts", category: "Clothing", essential: true },
    { name: "Underwear", category: "Clothing", essential: true },
    { name: "Socks (wool preferred)", category: "Clothing", essential: true },
    { name: "Rain jacket", category: "Clothing", essential: true },
    { name: "Warm layer (fleece/jacket)", category: "Clothing", essential: true },
    { name: "Sleep clothes", category: "Clothing", essential: false },
    { name: "Hat/cap", category: "Clothing", essential: false },
  ],
};

const PERSONAL_CARE_HYGIENE: PackingTemplate = {
  key: "hygiene",
  name: "Personal Care & Hygiene",
  description: "Toiletries and hygiene essentials",
  icon: "body",
  items: [
    { name: "Toothbrush", category: "Personal Care", essential: true },
    { name: "Toothpaste", category: "Personal Care", essential: true },
    { name: "Deodorant", category: "Personal Care", essential: false },
    { name: "Shampoo/body wash", category: "Personal Care", essential: false },
    { name: "Comb/brush", category: "Personal Care", essential: false },
    { name: "Razor", category: "Personal Care", essential: false },
    { name: "Lip balm", category: "Personal Care", essential: false },
    { name: "Toilet paper", category: "Personal Care", essential: true },
    { name: "Hand sanitizer", category: "Personal Care", essential: true },
    { name: "Towel/camp towel", category: "Personal Care", essential: false },
    { name: "Mirror (small)", category: "Personal Care", essential: false },
  ],
};

const MEAL_PLANNING: PackingTemplate = {
  key: "meals",
  name: "Meal Planning Essentials",
  description: "Food and meal prep items",
  icon: "nutrition",
  items: [
    { name: "Breakfast food", category: "Cooking & Food", essential: true },
    { name: "Lunch food", category: "Cooking & Food", essential: true },
    { name: "Dinner food", category: "Cooking & Food", essential: true },
    { name: "Snacks", category: "Cooking & Food", essential: true },
    { name: "Coffee/tea", category: "Cooking & Food", essential: false },
    { name: "Water bottles", category: "Cooking & Food", essential: true },
    { name: "Water filter/purification", category: "Cooking & Food", essential: false },
    { name: "Trash bags", category: "Cooking & Food", essential: true },
    { name: "Food storage containers", category: "Cooking & Food", essential: false },
    { name: "Bear canister/hang bag", category: "Cooking & Food", essential: false },
    { name: "Spices/condiments", category: "Cooking & Food", essential: false },
  ],
};

const BACKPACKING: PackingTemplate = {
  key: "backpacking",
  name: "Backpacking Essentials",
  description: "Lightweight gear for backcountry trips",
  icon: "walk",
  items: [
    { name: "Backpack (60-70L)", category: "Other", essential: true },
    { name: "Ultralight tent", category: "Shelter & Sleep", essential: true },
    { name: "Lightweight sleeping bag", category: "Shelter & Sleep", essential: true },
    { name: "Inflatable sleeping pad", category: "Shelter & Sleep", essential: true },
    { name: "Trekking poles", category: "Tools & Utilities", essential: false },
    { name: "Trail runners/hiking boots", category: "Clothing", essential: true },
    { name: "Gaiters", category: "Clothing", essential: false },
    { name: "Water bladder", category: "Cooking & Food", essential: true },
    { name: "Water filter", category: "Cooking & Food", essential: true },
    { name: "Lightweight stove", category: "Cooking & Food", essential: true },
    { name: "Bear canister", category: "Cooking & Food", essential: false },
    { name: "Trowel", category: "Personal Care", essential: true },
  ],
};

const CAR_CAMPING: PackingTemplate = {
  key: "car-camping",
  name: "Camp Comfort",
  description: "Furniture and comfort items for your campsite",
  icon: "car",
  items: [
    { name: "Camp chairs", category: "Camp Comfort", essential: false },
    { name: "Camp table", category: "Camp Comfort", essential: false },
    { name: "Lantern", category: "Navigation & Safety", essential: false },
    { name: "Large cooler", category: "Cooking & Food", essential: true },
    { name: "Ice", category: "Cooking & Food", essential: true },
    { name: "Tablecloth", category: "Camp Comfort", essential: false },
    { name: "Camp rug", category: "Camp Comfort", essential: false },
    { name: "Air mattress", category: "Shelter & Sleep", essential: false },
    { name: "Extra blankets", category: "Shelter & Sleep", essential: false },
    { name: "Portable speaker", category: "Entertainment", essential: false },
    { name: "Games/cards", category: "Entertainment", essential: false },
  ],
};

const WINTER_CAMPING: PackingTemplate = {
  key: "winter",
  name: "Winter Camping",
  description: "Stay warm in cold weather",
  icon: "snow",
  items: [
    { name: "4-season tent", category: "Shelter & Sleep", essential: true },
    { name: "Cold-rated sleeping bag (0-20°F)", category: "Shelter & Sleep", essential: true },
    { name: "Insulated sleeping pad (R4+)", category: "Shelter & Sleep", essential: true },
    { name: "Insulated jacket", category: "Clothing", essential: true },
    { name: "Base layers (top & bottom)", category: "Clothing", essential: true },
    { name: "Warm hat/beanie", category: "Clothing", essential: true },
    { name: "Insulated gloves", category: "Clothing", essential: true },
    { name: "Warm socks (wool)", category: "Clothing", essential: true },
    { name: "Insulated boots", category: "Clothing", essential: true },
    { name: "Hand/toe warmers", category: "Clothing", essential: false },
    { name: "Hot drink supplies", category: "Cooking & Food", essential: false },
    { name: "Snow stakes", category: "Shelter & Sleep", essential: false },
  ],
};

const PETS: PackingTemplate = {
  key: "pets",
  name: "Camping with Pets",
  description: "Everything your furry friend needs",
  icon: "paw",
  items: [
    // Food & Water
    { name: "Dog food (measured portions)", category: "Pet Supplies", essential: true },
    { name: "Collapsible food bowl", category: "Pet Supplies", essential: true },
    { name: "Collapsible water bowl", category: "Pet Supplies", essential: true },
    { name: "Treats", category: "Pet Supplies", essential: false },
    { name: "Food container", category: "Pet Supplies", essential: true },
    // Comfort & Sleep
    { name: "Dog bed or blanket", category: "Pet Supplies", essential: true },
    { name: "Familiar toy", category: "Pet Supplies", essential: false },
    { name: "Dog jacket (if cold)", category: "Pet Supplies", essential: false },
    // Safety & Control
    { name: "Leash", category: "Pet Supplies", essential: true },
    { name: "Collar with ID tags", category: "Pet Supplies", essential: true },
    { name: "Long tie-out line", category: "Pet Supplies", essential: false },
    { name: "Stake for tie-out", category: "Pet Supplies", essential: false },
    { name: "Harness", category: "Pet Supplies", essential: false },
    { name: "Dog boots (for rough terrain)", category: "Pet Supplies", essential: false },
    // Health & Hygiene
    { name: "Pet first aid kit", category: "Pet Supplies", essential: true },
    { name: "Flea/tick prevention", category: "Pet Supplies", essential: true },
    { name: "Medications (if needed)", category: "Pet Supplies", essential: true },
    { name: "Poop bags", category: "Pet Supplies", essential: true },
    { name: "Towel for drying", category: "Pet Supplies", essential: false },
    { name: "Dog-safe bug spray", category: "Pet Supplies", essential: false },
    { name: "Dog sunscreen (for light-colored dogs)", category: "Pet Supplies", essential: false },
    // Cleanup
    { name: "Pet brush", category: "Pet Supplies", essential: false },
    { name: "Enzyme cleaner", category: "Pet Supplies", essential: false },
    // Documents
    { name: "Vaccination records", category: "Pet Supplies", essential: true },
    { name: "Recent photo of pet", category: "Pet Supplies", essential: false },
    { name: "Vet contact info", category: "Pet Supplies", essential: true },
    // Night Safety
    { name: "Reflective collar or light", category: "Pet Supplies", essential: true },
    { name: "Glow stick for collar", category: "Pet Supplies", essential: false },
    // Car Travel
    { name: "Car seat cover/liner", category: "Pet Supplies", essential: false },
    { name: "Car safety harness or crate", category: "Pet Supplies", essential: false },
    // Extras
    { name: "Portable water bottle with bowl", category: "Pet Supplies", essential: false },
    { name: "Cooling mat (for hot weather)", category: "Pet Supplies", essential: false },
    { name: "Calming treats or spray", category: "Pet Supplies", essential: false },
  ],
};

const FAMILY_CAMPING: PackingTemplate = {
  key: "family",
  name: "Family Camping",
  description: "Extra items for camping with kids",
  icon: "people",
  items: [
    { name: "Large family tent", category: "Shelter & Sleep", essential: true },
    { name: "Sleeping bags for all", category: "Shelter & Sleep", essential: true },
    { name: "Sleeping pads/air mattresses", category: "Shelter & Sleep", essential: true },
    { name: "Extra blankets", category: "Shelter & Sleep", essential: false },
    { name: "Kids' comfort items", category: "Shelter & Sleep", essential: false },
    { name: "Kid-friendly meals", category: "Cooking & Food", essential: true },
    { name: "Lots of snacks", category: "Cooking & Food", essential: true },
    { name: "S'mores supplies", category: "Cooking & Food", essential: false },
    { name: "Kid-friendly cups/plates", category: "Cooking & Food", essential: true },
    { name: "Wet wipes/baby wipes", category: "Personal Care", essential: true },
    { name: "Diapers (if needed)", category: "Personal Care", essential: false },
    { name: "Kid sunscreen", category: "Personal Care", essential: true },
    { name: "Kid-safe bug spray", category: "Personal Care", essential: true },
    { name: "Extra kid clothes", category: "Clothing", essential: true },
    { name: "Swimsuits", category: "Clothing", essential: false },
    { name: "Games and toys", category: "Entertainment", essential: false },
    { name: "Glow sticks", category: "Entertainment", essential: false },
    { name: "Coloring books/crayons", category: "Entertainment", essential: false },
    { name: "Frisbee/ball", category: "Entertainment", essential: false },
    { name: "Flashlight for each kid", category: "Navigation & Safety", essential: true },
    { name: "Whistle for each kid", category: "Navigation & Safety", essential: true },
    { name: "Camp chairs for all", category: "Camp Comfort", essential: false },
  ],
};

// ============================================================================
// EXPORT ALL TEMPLATES
// ============================================================================

export const PACKING_TEMPLATES: PackingTemplate[] = [
  ESSENTIAL_CAMPING,
  COOKING_FOOD,
  SAFETY_FIRST_AID,
  CLOTHING_PERSONAL,
  PERSONAL_CARE_HYGIENE,
  MEAL_PLANNING,
  BACKPACKING,
  CAR_CAMPING,
  WINTER_CAMPING,
  PETS,
  FAMILY_CAMPING,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTemplatesByKeys(keys: PackingTemplateKey[]): PackingTemplate[] {
  return PACKING_TEMPLATES.filter((t) => keys.includes(t.key));
}

export function getTemplateByKey(key: PackingTemplateKey): PackingTemplate | undefined {
  return PACKING_TEMPLATES.find((t) => t.key === key);
}

// ============================================================================
// TRIP TYPE & SEASON OPTIONS
// ============================================================================

export const TRIP_TYPE_OPTIONS = [
  { value: "one-night", label: "One Night", icon: "moon" as const },
  { value: "weekend", label: "Weekend", icon: "calendar" as const },
  { value: "multi-day", label: "Multi-Day", icon: "calendar-outline" as const },
  { value: "backpacking", label: "Backpacking", icon: "walk" as const },
  { value: "car-camping", label: "Car Camping", icon: "car" as const },
  { value: "day-hike", label: "Day Hike", icon: "sunny" as const },
];

export const SEASON_OPTIONS = [
  { value: "spring", label: "Spring", icon: "flower" as const },
  { value: "summer", label: "Summer", icon: "sunny" as const },
  { value: "fall", label: "Fall", icon: "leaf" as const },
  { value: "winter", label: "Winter", icon: "snow" as const },
];
