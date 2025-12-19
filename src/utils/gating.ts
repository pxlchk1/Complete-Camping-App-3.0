// src/utils/gating.ts
import { auth } from '../config/firebase';

/**
 * requireAuth: Centralized gating for auth-required actions.
 * If not logged in, triggers the provided showLoginModal callback and returns false.
 * Returns true if user is authenticated.
 */
export function requireAuth(showLoginModal: () => void): boolean {
  if (!auth.currentUser) {
    showLoginModal();
    return false;
  }
  return true;
}

/**
 * requireEntitlement: Centralized gating for Pro/free logic.
 * If user is free and not entitled, triggers the provided showPaywall callback and returns false.
 * Returns true if user is entitled (Pro or allowed).
 * @param tripCount - number of trips owned by user (for Plan gating)
 * @param membershipTier - user's membership tier (from profile doc)
 * @param showPaywall - callback to show paywall modal
 */
export function requireEntitlement({
  tripCount,
  membershipTier,
  showPaywall,
}: {
  tripCount: number;
  membershipTier: string;
  showPaywall: () => void;
}): boolean {
  if (membershipTier === 'pro' || membershipTier === 'subscribed' || membershipTier === 'isAdmin') {
    return true;
  }
  if (membershipTier === 'free' && tripCount >= 1) {
    showPaywall();
    return false;
  }
  return true;
}
