/**
 * User Handle Service
 * 
 * Fetches and caches user handles from Firestore.
 * Use this at CREATE time and for display when handle is missing from post.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getDisplayHandle } from "../utils/userHandle";

type UsersDoc = {
  handle?: string | null;
};

const handleCache = new Map<string, string>();

/**
 * Fetch the user's handle from Firestore users/{uid}.handle
 * Returns normalized handle or deterministic fallback.
 * Results are cached for performance.
 */
export async function getUserHandleForUid(uid: string): Promise<string> {
  if (!uid) return "@Camper0000";
  
  const cached = handleCache.get(uid);
  if (cached) return cached;

  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    const data = (snap.exists() ? (snap.data() as UsersDoc) : null) || null;

    const resolved = getDisplayHandle({
      handle: data?.handle ?? null,
      uid,
    });

    handleCache.set(uid, resolved);
    return resolved;
  } catch {
    const fallback = getDisplayHandle({ handle: null, uid });
    handleCache.set(uid, fallback);
    return fallback;
  }
}

/**
 * Prime the cache with a known handle (e.g., from profile context).
 * Call this when you already have the handle to avoid redundant fetches.
 */
export function primeUserHandleCache(uid: string, handle: string): void {
  if (!uid) return;
  if (!handle) return;
  handleCache.set(uid, handle);
}

/**
 * Clear the cache for a specific user (e.g., after they update their handle).
 */
export function clearUserHandleCache(uid?: string): void {
  if (uid) {
    handleCache.delete(uid);
  } else {
    handleCache.clear();
  }
}
