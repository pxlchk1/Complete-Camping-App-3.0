/**
 * Connect Attribution Utility
 * 
 * SINGLE SOURCE OF TRUTH for all Connect post attribution.
 * 
 * This module ensures that:
 * 1. Attribution always comes from post.authorHandle or users.handle
 * 2. NEVER from displayName, firstName, contactName, or "Anonymous"
 * 3. Fallback is always deterministic "@CamperXXXX" (never "@user###")
 * 
 * Usage:
 *   import { getPostAttribution } from '../../utils/connectAttribution';
 *   const attribution = getPostAttribution(post);
 */

import { getDisplayHandle, generateCamperHandle, normalizeHandle } from './userHandle';

// ==================== BANNED PATTERNS ====================
// These strings should NEVER appear in attribution output
const BANNED_PATTERNS = ['Anonymous', '@user', 'Unknown', 'Guest'];

/**
 * Validate that a string is a legitimate handle, not a name.
 * Handles are alphanumeric with underscores, names often have spaces or are common first names.
 */
function isLikelyHandle(value: string | null | undefined): boolean {
  if (!value || value.trim() === '') return false;
  
  const trimmed = value.trim().replace(/^@/, '');
  
  // If it contains spaces, it's likely a name, not a handle
  if (trimmed.includes(' ')) return false;
  
  // If it starts with "user" followed by numbers, it's the old bad pattern
  if (/^user\d+$/i.test(trimmed)) return false;
  
  // Check against banned patterns
  for (const banned of BANNED_PATTERNS) {
    if (trimmed.toLowerCase() === banned.toLowerCase()) return false;
  }
  
  return true;
}

/**
 * Assert that a value is not derived from displayName/firstName fields.
 * In development, this will warn if a bad pattern is detected.
 */
function assertNotNameField(value: string | null | undefined, context: string): void {
  if (!value) return;
  
  // In dev mode, warn if this looks like a name was passed
  if (__DEV__) {
    if (value.includes(' ')) {
      console.warn(`[ConnectAttribution] "${context}" contains spaces - likely a name, not a handle: "${value}"`);
    }
    for (const banned of BANNED_PATTERNS) {
      if (value.toLowerCase().includes(banned.toLowerCase())) {
        console.warn(`[ConnectAttribution] "${context}" contains banned pattern "${banned}": "${value}"`);
      }
    }
  }
}

// ==================== POST ATTRIBUTION ====================

/**
 * Get the attribution string for a Connect post.
 * 
 * This is THE ONLY function to use for rendering author attribution in Connect.
 * 
 * Priority:
 * 1. post.authorHandle (if valid)
 * 2. fetchedHandle (if provided and valid, from users/{authorId}.handle)
 * 3. generateCamperHandle(post.authorId) - deterministic fallback
 * 
 * @param post - The post object (must have authorId, may have authorHandle)
 * @param fetchedHandle - Optional handle fetched from users collection
 * @returns Attribution string starting with "@"
 */
export function getPostAttribution(
  post: {
    authorId?: string | null;
    userId?: string | null;
    authorHandle?: string | null;
    userHandle?: string | null;
  } | null | undefined,
  fetchedHandle?: string | null
): string {
  if (!post) {
    return '@Camper0000';
  }
  
  const authorId = post.authorId || post.userId || '';
  const storedHandle = post.authorHandle || post.userHandle;
  
  // Priority 1: Use stored authorHandle if it's a valid handle
  if (storedHandle && isLikelyHandle(storedHandle)) {
    assertNotNameField(storedHandle, 'post.authorHandle');
    return getDisplayHandle({ handle: storedHandle, id: authorId });
  }
  
  // Priority 2: Use fetched handle from users collection
  if (fetchedHandle && isLikelyHandle(fetchedHandle)) {
    assertNotNameField(fetchedHandle, 'fetchedHandle');
    return getDisplayHandle({ handle: fetchedHandle, id: authorId });
  }
  
  // Priority 3: Generate deterministic fallback
  if (authorId) {
    return generateCamperHandle(authorId);
  }
  
  // Last resort
  return '@Camper0000';
}

/**
 * Get the author handle to store when creating a new Connect post.
 * 
 * Call this during post creation to ensure authorHandle is always populated.
 * 
 * @param profile - The current user's profile
 * @param uid - The current user's uid
 * @returns Handle string to store in post.authorHandle
 */
export function getAuthorHandleForNewPost(
  profile: { handle?: string | null } | null | undefined,
  uid: string
): string {
  // If profile has a valid handle, normalize and return it
  if (profile?.handle && isLikelyHandle(profile.handle)) {
    return normalizeHandle(profile.handle);
  }
  
  // Generate deterministic fallback
  return generateCamperHandle(uid);
}

/**
 * Check if an attribution value should be overwritten by a fetched value.
 * 
 * USE THIS before overwriting post.authorHandle with fetched data.
 * 
 * Rules:
 * - If current attribution is valid, DO NOT overwrite
 * - Only overwrite with users.handle, NEVER with displayName/firstName
 * 
 * @param currentAttribution - The current attribution on the post
 * @param fetchedValue - The value fetched from users collection
 * @param fieldName - The name of the field (for validation)
 * @returns true if the current attribution should be replaced
 */
export function shouldReplaceAttribution(
  currentAttribution: string | null | undefined,
  fetchedValue: string | null | undefined,
  fieldName: string
): boolean {
  // NEVER replace with displayName, firstName, name, etc.
  const FORBIDDEN_FIELDS = ['displayName', 'firstName', 'lastName', 'name', 'contactName'];
  if (FORBIDDEN_FIELDS.some(f => fieldName.toLowerCase().includes(f.toLowerCase()))) {
    if (__DEV__) {
      console.warn(`[ConnectAttribution] Blocked attempt to use ${fieldName} for attribution`);
    }
    return false;
  }
  
  // If current attribution is already valid, don't replace
  if (currentAttribution && isLikelyHandle(currentAttribution)) {
    return false;
  }
  
  // Only replace if fetched value is a valid handle
  return fetchedValue != null && isLikelyHandle(fetchedValue);
}

// ==================== EXPORTS FOR TESTING ====================

export { isLikelyHandle, BANNED_PATTERNS };
