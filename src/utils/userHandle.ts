/**
 * User Handle Utilities
 *
 * ⚠️  SINGLE SOURCE OF TRUTH FOR CONNECT ATTRIBUTION  ⚠️
 * 
 * Do NOT bypass this helper anywhere in Connect.
 * All user attribution must go through getDisplayHandle().
 *
 * RULES:
 * - If handle exists and is valid: normalize and return "@<handle>"
 * - Else return deterministic "@CamperXXXX" from uid
 * - NEVER return "@user###", "Anonymous", or first names
 * 
 * BANNED in Connect attribution:
 * - displayName, firstName, contactName
 * - "Anonymous", "Unknown", "Guest"
 * - "@user###" patterns
 * - Direct string concatenation with "@"
 */

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char;
  }
  return hash;
}

// Common first names and bad patterns to reject (case-insensitive)
const COMMON_FIRST_NAMES = new Set([
  "alana","john","jane","mike","michael","sarah","david","emma","james",
  "mary","robert","jennifer","william","linda","richard","elizabeth",
  "joseph","barbara","thomas","susan","charles","jessica","chris","christopher",
  "daniel","ashley","matthew","emily","anthony","megan","mark","hannah",
  "donald","samantha","steven","katherine","paul","alexis","andrew","rachel",
  "joshua","stephanie","kenneth","lauren","kevin","amanda","brian","nicole",
  "george","natalie","timothy","victoria","ronald","rebecca","edward","anna",
  "jason","caitlin","jeffrey","madison","ryan","grace","jacob","sophia",
  "gary","olivia","nicholas","ava","eric","isabella","jonathan","mia",
  "stephen","abigail","larry","chloe","justin","zoe","scott","lily",
  "brandon","ella","benjamin","camper","anonymous","user","guest","unknown"
]);

function stripAt(value: string): string {
  return value.trim().replace(/^@/, "");
}

/**
 * Check if a value is a valid handle (not a first name, not "Anonymous", etc.)
 * Exported so services can validate stored handles before using them.
 */
export function isValidHandle(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return false;

  const raw = stripAt(value);
  const lower = raw.toLowerCase();

  if (COMMON_FIRST_NAMES.has(lower)) return false;
  if (lower.includes(" ")) return false;
  if (/^user\d+$/i.test(lower)) return false;

  // If it looks intentionally chosen, allow it
  if (/\d/.test(lower) || lower.includes("_") || lower.length >= 8) return true;

  // Reject very short alpha-only strings, they tend to be names
  if (lower.length < 4) return false;

  return true;
}

/**
 * Generate a deterministic "@CamperXXXX" handle from a seed (typically userId/uid).
 */
export function generateCamperHandle(seed: string): string {
  if (!seed || seed.trim() === "") return "@Camper0000";
  const hash = hashString(seed);
  const num = Math.abs(hash) % 1000000;
  const digits = num.toString().padStart(4, "0");
  return `@Camper${digits}`;
}

/**
 * Normalize a raw handle string to ensure it starts with "@" and has no spaces.
 */
export function normalizeHandle(raw: string): string {
  if (!raw || raw.trim() === "") return "";
  const trimmed = raw.trim().replace(/\s+/g, "");
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * Get display handle for a user, with deterministic fallback.
 * 
 * This is the primary function to use for all Connect attribution.
 * Pass an object with handle and at least one ID field.
 */
export function getDisplayHandle(args: {
  handle?: string | null;
  uid?: string | null;
  authorId?: string | null;
  userId?: string | null;
  id?: string | null;
}): string {
  const handle = args.handle;
  const seed =
    args.uid ||
    args.authorId ||
    args.userId ||
    args.id ||
    "";

  if (handle && handle.trim() !== "" && isValidHandle(handle)) {
    return normalizeHandle(handle);
  }

  if (seed) return generateCamperHandle(seed);

  return "@Camper0000";
}
