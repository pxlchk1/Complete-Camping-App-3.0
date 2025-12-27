// src/utils/gating.ts
/**
 * Centralized Access Gating System
 * 
 * User States:
 * - NO_ACCOUNT: Not logged in
 * - FREE: Logged in, not subscribed
 * - PRO: Subscribed (includes active trial)
 * 
 * Usage:
 * 1. Use getAccessState() to determine current user state
 * 2. Use requireAccount() for actions that need a logged-in user
 * 3. Use requirePro() for actions that need Pro subscription
 * 
 * Connect Permissions (updated):
 * - FREE allowed: Vote, Profile, Questions, Tips, Photos (1/day)
 * - FREE blocked: Feedback, Gear Reviews (paywall)
 * - NO_ACCOUNT: All write actions blocked (account prompt)
 */

import { auth } from '../config/firebase';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { useAuthStore } from '../state/authStore';
import { useUserStore } from '../state/userStore';
import { SUBSCRIPTIONS_ENABLED, PAYWALL_ENABLED } from '../config/subscriptions';

// ============================================
// ACCESS STATE TYPES
// ============================================

export type AccessState = 'NO_ACCOUNT' | 'FREE' | 'PRO';

export interface AccessGateCallbacks {
  showAccountPrompt?: () => void;
  openAccountModal: () => void;
  openPaywallModal: () => void;
}

// ============================================
// CONSTANTS
// ============================================

export const ACCOUNT_PROMPT_MESSAGE = "You need to have an account or be logged in to do that.";
export const PHOTO_LIMIT_MESSAGE = "You've hit today's photo limit. Try again tomorrow, or upgrade for unlimited photo posts.";
export const AUTO_HIDE_DOWNVOTE_THRESHOLD = 3;

// ============================================
// CORE STATE FUNCTION
// ============================================

/**
 * Get current user access state
 * Returns: 'NO_ACCOUNT' | 'FREE' | 'PRO'
 * 
 * Note: PRO includes active trial and administrators - they are treated the same everywhere
 */
export function getAccessState(): AccessState {
  const isLoggedIn = !!auth.currentUser;
  
  if (!isLoggedIn) {
    return 'NO_ACCOUNT';
  }
  
  // If subscriptions disabled via feature flag, treat as PRO
  if (!SUBSCRIPTIONS_ENABLED || !PAYWALL_ENABLED) {
    return 'PRO';
  }
  
  // Check if user is an administrator (admins get full PRO access)
  const isAdmin = useUserStore.getState().isAdministrator();
  if (isAdmin) {
    return 'PRO';
  }
  
  const isPro = useSubscriptionStore.getState().isPro;
  return isPro ? 'PRO' : 'FREE';
}

/**
 * Hook version for reactive state
 */
export function useAccessState(): AccessState {
  const user = useAuthStore((s) => s.user);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const isAdmin = useUserStore((s) => s.isAdministrator());
  
  if (!user) {
    return 'NO_ACCOUNT';
  }
  
  if (!SUBSCRIPTIONS_ENABLED || !PAYWALL_ENABLED) {
    return 'PRO';
  }
  
  // Admins get full PRO access
  if (isAdmin) {
    return 'PRO';
  }
  
  return isPro ? 'PRO' : 'FREE';
}

// ============================================
// UNIFIED ACTION GATING
// ============================================

/**
 * requireProForAction: Unified gate that runs the action only if user is Pro
 * 
 * This is the single helper for all participation actions (submit, vote, comment).
 * - If signed out: opens AccountRequiredModal
 * - If logged in but not Pro: opens PaywallModal
 * - If logged in and Pro: runs the action
 * 
 * Usage:
 * requireProForAction(
 *   () => submitVote(),
 *   { openAccountModal, openPaywallModal }
 * );
 * 
 * @param action - The function to run if user is Pro
 * @param callbacks - Modal callbacks
 */
export function requireProForAction(
  action: () => void | Promise<void>,
  callbacks: Pick<AccessGateCallbacks, 'openAccountModal' | 'openPaywallModal'>
): void {
  // First check account
  if (!auth.currentUser) {
    callbacks.openAccountModal();
    return;
  }
  
  // If subscriptions disabled, allow
  if (!SUBSCRIPTIONS_ENABLED || !PAYWALL_ENABLED) {
    action();
    return;
  }
  
  // Check if user is an administrator (admins bypass paywall)
  const isAdmin = useUserStore.getState().isAdministrator();
  if (isAdmin) {
    action();
    return;
  }
  
  // Check Pro status
  const isPro = useSubscriptionStore.getState().isPro;
  if (!isPro) {
    callbacks.openPaywallModal();
    return;
  }
  
  // User is Pro - run the action
  action();
}

// ============================================
// GATING FUNCTIONS
// ============================================

/**
 * requireAccount: Gate for actions that require a logged-in user
 * 
 * Use for: Voting, My Campsite profile, any Connect submissions
 * 
 * @param callbacks - showAccountPrompt (optional toast), openAccountModal (required)
 * @returns true if user can proceed, false if blocked
 */
export function requireAccount(callbacks: Pick<AccessGateCallbacks, 'showAccountPrompt' | 'openAccountModal'>): boolean {
  if (!auth.currentUser) {
    // Show small prompt if provided
    callbacks.showAccountPrompt?.();
    // Open the account required modal
    callbacks.openAccountModal();
    return false;
  }
  return true;
}

/**
 * requirePro: Gate for actions that require Pro subscription
 * 
 * Use for: Feedback submission, trip creation, packing list edits, meal plan edits
 * 
 * @param callbacks - full callbacks including paywall
 * @returns true if user can proceed, false if blocked
 */
export function requirePro(callbacks: AccessGateCallbacks): boolean {
  // First check account
  if (!auth.currentUser) {
    callbacks.showAccountPrompt?.();
    callbacks.openAccountModal();
    return false;
  }
  
  // If subscriptions disabled, allow
  if (!SUBSCRIPTIONS_ENABLED || !PAYWALL_ENABLED) {
    return true;
  }
  
  // Check if user is an administrator (admins bypass paywall)
  const isAdmin = useUserStore.getState().isAdministrator();
  if (isAdmin) {
    return true;
  }
  
  // Check Pro status
  const isPro = useSubscriptionStore.getState().isPro;
  if (!isPro) {
    callbacks.openPaywallModal();
    return false;
  }
  
  return true;
}

// ============================================
// LEGACY COMPATIBILITY (will be deprecated)
// ============================================

/**
 * @deprecated Use requireAccount() instead
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
 * @deprecated Use requirePro() instead
 * requireEntitlement: Centralized gating for Pro/free logic.
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
