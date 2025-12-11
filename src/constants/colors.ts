/**
 * Complete Camping App - Official Color Palette
 * Use these colors exactly as written. Do not substitute tints or lighten/darken values.
 */

// PRIMARY COLORS
export const DEEP_FOREST = "#485952";          // Primary text, headings, icons, buttons, navigation active
export const EARTH_GREEN = "#828872";          // Secondary text, muted labels, subtle borders, icons inactive
export const GRANITE_GOLD = "#AC9A6D";         // Accents, highlight text, decorative moments (use sparingly)

// TEXT COLORS
export const TEXT_PRIMARY_STRONG = "#3D2817";  // Dark brown - primary body text (AA contrast compliant)
export const TEXT_SECONDARY = "#4F655F";       // Secondary text, labels
export const TEXT_ON_DARK = "#FDF7E8";         // Text on dark backgrounds (hero overlays, dark headers)
export const TEXT_MUTED = "#7A8A82";           // Muted text, timestamps, subtle labels

// SECONDARY COLORS
export const RIVER_ROCK = "#607A77";           // Status badges, card accents, secondary emphasis icons
export const SIERRA_SKY = "#92AFB1";           // Soft backgrounds, light accents, dividers, weather elements

// BACKGROUNDS
export const PARCHMENT = "#F4EBD0";            // Universal background for screens, cards, ScrollViews
export const PARCHMENT_BACKGROUND = "#F4EBD0"; // Main screen background
export const CARD_BACKGROUND_LIGHT = "#FFF9EB"; // Light card backgrounds for better contrast
export const CARD_BACKGROUND_ALT = "#F9F1DD";   // Alternative card background
export const SURFACE_HEADER_DARK = "#485952";   // Dark surface for headers

// DERIVED COLORS
export const PARCHMENT_BORDER = "#D5C8A2";     // Thin, soft borders (never harsh black or gray)
export const PARCHMENT_95 = "rgba(244, 235, 208, 0.95)"; // Light card backgrounds
export const BORDER_SOFT = "#D9CDAF";          // Soft border color for cards
export const BORDER_STRONG = "#374543";        // Strong border for emphasis
export const HAIRLINE_RUST = "#B26A4A";        // Hairline separators, subtle accents with warmth

// LEGACY EXPORTS (for backward compatibility - migrate to new names above)
export const TL_FOREST_GREEN = DEEP_FOREST;
export const TL_SAGE = EARTH_GREEN;
export const TL_GOLDEN_TAN = GRANITE_GOLD;
export const TL_DEEP_SAGE = RIVER_ROCK;
export const TL_SKY_BLUE = SIERRA_SKY;
export const TL_PARCHMENT = PARCHMENT;

// Additional legacy exports (will be migrated to official palette)
export const TL_FOREST_SUBTLE = "rgba(72, 89, 82, 0.1)";  // Temporary - will use parchment
export const TL_PARCHMENT_SUBTLE = PARCHMENT;             // Use parchment instead
export const TL_INK = DEEP_FOREST;                        // Use Deep Forest for all text
export const TL_INK_LIGHT = EARTH_GREEN;                  // Use Earth Green for secondary text
export const TL_BROWN = GRANITE_GOLD;                     // Use Granite Gold for accents
export const LODGE_FOREST = DEEP_FOREST;                  // Use Deep Forest
export const LODGE_AMBER = GRANITE_GOLD;                  // Use Granite Gold
export const LODGE_STONE_600 = EARTH_GREEN;               // Use Earth Green
