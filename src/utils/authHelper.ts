/**
 * Authentication & Authorization Helper
 * Manages the two-gate system: Login Gate → Subscription Gate
 */

import { useAuthStore } from "../state/authStore";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { auth } from "../config/firebase";

/**
 * Get current authenticated user ID
 * Throws error if user is not signed in
 */
export function requireUserId(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('User must be signed in to upload files');
  }
  return uid;
}

/**
 * Check if user is logged in
 */
export const useIsLoggedIn = (): boolean => {
  return useAuthStore((state) => state.user !== null);
};

/**
 * Check if user is Pro (must be logged in first)
 */
export const useIsPro = (): boolean => {
  const isLoggedIn = useIsLoggedIn();
  const isPro = useSubscriptionStore((state) => state.isPro);
  return isLoggedIn && isPro;
};

/**
 * Get current user status
 */
export const useUserStatus = () => {
  const isLoggedIn = useIsLoggedIn();
  const isPro = useIsPro();
  
  return {
    isLoggedIn,
    isPro,
    isFree: isLoggedIn && !isPro,
    isGuest: !isLoggedIn,
  };
};

/**
 * GATE 1: Require user to be logged in
 * Returns true if user can proceed, false if redirected to login
 */
export const requireLogin = (
  navigation: NavigationProp<RootStackParamList>,
  action?: string
): boolean => {
  const user = useAuthStore.getState().user;

  if (!user) {
    // User not logged in - redirect to auth screen
    console.log(`[AuthGate] Login required for: ${action || 'action'}`);
    navigation.navigate("Auth" as any);
    return false;
  }

  return true;
};

/**
 * GATE 2: Require user to have Pro subscription (after login check)
 * Returns true if user can proceed, false if redirected to paywall
 */
export const requirePro = (
  navigation: NavigationProp<RootStackParamList>,
  feature?: string
): boolean => {
  // First check login
  if (!requireLogin(navigation, feature)) {
    return false;
  }

  // Then check Pro status
  const isPro = useSubscriptionStore.getState().isPro;

  if (!isPro) {
    console.log(`[ProGate] Pro required for: ${feature || 'feature'}`);
    navigation.navigate("Paywall" as any);
    return false;
  }

  return true;
};

/**
 * Hook version: Require login for an action
 */
export const useRequireLogin = () => {
  const { isLoggedIn, isGuest } = useUserStatus();

  const checkLogin = (
    navigation: NavigationProp<RootStackParamList>,
    action?: string
  ): boolean => {
    if (isGuest) {
      console.log(`[AuthGate] Login required for: ${action || 'action'}`);
      navigation.navigate("Auth" as any);
      return false;
    }
    return true;
  };

  return { isLoggedIn, isGuest, checkLogin };
};

/**
 * Hook version: Require Pro subscription
 */
export const useRequirePro = () => {
  const { isLoggedIn, isPro, isFree, isGuest } = useUserStatus();

  const checkPro = (
    navigation: NavigationProp<RootStackParamList>,
    feature?: string
  ): boolean => {
    // Gate 1: Login
    if (isGuest) {
      console.log(`[AuthGate] Login required for: ${feature || 'feature'}`);
      navigation.navigate("Auth" as any);
      return false;
    }

    // Gate 2: Pro
    if (isFree) {
      console.log(`[ProGate] Pro required for: ${feature || 'feature'}`);
      navigation.navigate("Paywall" as any);
      return false;
    }

    return true;
  };

  return { isLoggedIn, isPro, isFree, isGuest, checkPro };
};
