import { StyleSheet } from "react-native";

/**
 * Complete Camping App - Master Theme
 *
 * This is the single source of truth for all design tokens.
 * DO NOT define colors, fonts, or spacing elsewhere.
 * All screens and components must import from this file.
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary palette
  deepForest: "#485952",   // Primary text, headings, icons, buttons
  earthGreen: "#828872",   // Secondary text, muted labels
  graniteGold: "#AC9A6D",  // Accents, highlights (use sparingly)
  riverRock: "#607A77",    // Status badges, card accents
  sierraSky: "#92AFB1",    // Soft backgrounds, dividers
  parchment: "#F4EBD0",    // Universal background
  darkBrown: "#3D2817",    // Primary body text (AA contrast)

  // Derived neutrals
  borderSoft: "#D5C8A2",   // Card borders, dividers
  cardFill: "#F7EFD8",     // Slightly warmer than parchment for cards
  hairline: "#B26A4A",     // Hairline separators, subtle accents with warmth
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const fonts = {
  // Display fonts (Josefin Slab) - for headers and titles
  displayRegular: "JosefinSlab_600SemiBold",  // Note: Regular is actually SemiBold
  displaySemibold: "JosefinSlab_600SemiBold",
  displayBold: "JosefinSlab_700Bold",

  // Body fonts (Source Sans 3) - for body text, labels, buttons
  bodyRegular: "SourceSans3_400Regular",
  bodySemibold: "SourceSans3_600SemiBold",
  bodyBold: "SourceSans3_700Bold",

  // Accent font (Satisfy) - decorative only, very sparingly
  accent: "Satisfy_400Regular",
};

export const fontSizes = {
  xl: 38,  // Hero titles
  lg: 30,  // Section headers
  md: 20,  // Card titles
  sm: 16,  // Body text
  xs: 13,  // Labels, metadata
};

// ============================================================================
// SPACING SCALE
// ============================================================================

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

// ============================================================================
// SHADOWS (soft, print-inspired)
// ============================================================================

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
};

// ============================================================================
// TEXT STYLES
// ============================================================================

export const textStyles = StyleSheet.create({
  // Hero title - welcome and section landings
  headingHero: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.xl,
    lineHeight: 44,
    textAlign: "center" as const,
    color: colors.deepForest,
  },

  // Section titles on content screens
  headingSection: {
    fontFamily: fonts.displaySemibold,
    fontSize: fontSizes.lg,
    lineHeight: 36,
    color: colors.deepForest,
  },

  // Card titles, list item titles
  headingCard: {
    fontFamily: fonts.displayRegular,
    fontSize: fontSizes.md,
    lineHeight: 25,
    color: colors.deepForest,
  },

  // Normal body copy
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.darkBrown,
  },

  // Secondary body (subtle text, helper copy)
  bodySecondary: {
    fontFamily: fonts.bodyRegular,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.earthGreen,
  },

  // Labels and metadata (time, XP, difficulty)
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.13,
    color: colors.darkBrown,
  },

  // Small muted labels
  labelSoft: {
    fontFamily: fonts.bodyRegular,
    fontSize: fontSizes.xs,
    color: colors.earthGreen,
  },

  // Accent script - tiny decorative only
  accentScript: {
    fontFamily: fonts.accent,
    fontSize: fontSizes.sm,
    color: colors.graniteGold,
  },

  // Button text - primary
  buttonPrimary: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.sm,
    color: colors.parchment,
  },

  // Button text - secondary
  buttonSecondary: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.sm,
    color: colors.darkBrown,
  },

  // Button text - text link
  buttonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.sm,
    color: colors.darkBrown,
  },
});

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const componentStyles = StyleSheet.create({
  // Screen wrapper
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },

  // Safe padding for screen content
  screenInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Card container
  card: {
    backgroundColor: colors.cardFill,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  // Card header row
  cardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: spacing.sm,
  },

  // Card divider
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: spacing.sm,
  },

  // Primary button
  buttonPrimary: {
    backgroundColor: colors.deepForest,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  // Secondary button (outline)
  buttonSecondary: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.deepForest,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  // Text button
  buttonText: {
    paddingVertical: spacing.xs,
  },

  // Status pill/chip
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.riverRock,
  },

  pillText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.xs,
    color: colors.parchment,
  },

  // Tab bar
  tabBar: {
    backgroundColor: colors.parchment,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    height: 70,
    paddingHorizontal: spacing.md,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },

  // Tab item
  tabItem: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  // Hero illustration wrapper
  heroImage: {
    width: "100%" as const,
    height: undefined,
    aspectRatio: 16 / 9,
  },

  // Content below hero
  heroContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const layout = {
  // Screen horizontal padding
  screenPadding: spacing.lg,

  // Section spacing
  sectionMarginTop: spacing.lg,
  sectionHeaderMarginBottom: spacing.sm,

  // Card spacing
  cardSpacing: spacing.md,

  // Bottom padding in scroll views
  scrollBottomPadding: spacing.xl,

  // Minimum tap target
  minTapTarget: 44,
};

// ============================================================================
// ICON COLORS
// ============================================================================

export const iconColors = {
  default: colors.deepForest,
  muted: colors.earthGreen,
  accent: colors.graniteGold,
  active: colors.deepForest,
  inactive: colors.earthGreen,
};

// ============================================================================
// ACCESSIBILITY RULES (enforced by theme)
// ============================================================================

/**
 * ACCESSIBILITY RULES:
 *
 * 1. Body text must use deepForest on parchment for maximum contrast
 * 2. Do not use graniteGold for body copy - only for accents/headings
 * 3. Never place light text on mid-tone backgrounds
 * 4. Minimum body size: 16px (fontSizes.sm)
 * 5. Minimum tap target height: 44px (layout.minTapTarget)
 */
