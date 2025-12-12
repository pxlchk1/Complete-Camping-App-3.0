/**
 * Paywall Gating Hook
 * Provides helper for gating Pro features and showing paywall
 */

import { useNavigation } from "@react-navigation/native";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { SUBSCRIPTIONS_ENABLED, PAYWALL_ENABLED } from "../config/subscriptions";
import type { RootStackNavigationProp } from "../navigation/types";

interface PaywallGateResult {
  isPro: boolean;
  requirePro: () => boolean;
  showPaywall: () => void;
}

/**
 * Hook to check Pro status and gate features
 * 
 * Usage:
 * ```typescript
 * const { isPro, requirePro, showPaywall } = usePaywallGate();
 * 
 * // Check if user has Pro access
 * if (!isPro) {
 *   // Show upgrade prompt
 * }
 * 
 * // Gate a feature tap
 * const handleProFeature = () => {
 *   if (!requirePro()) return; // Shows paywall if not Pro
 *   // ... continue with Pro feature
 * };
 * ```
 */
export function usePaywallGate(): PaywallGateResult {
  const navigation = useNavigation<RootStackNavigationProp>();
  const isPro = useSubscriptionStore((s) => s.isPro);

  /**
   * Show the paywall modal
   */
  const showPaywall = () => {
    if (PAYWALL_ENABLED) {
      navigation.navigate("Paywall");
    }
  };

  /**
   * Require Pro access for a feature
   * Returns true if user has Pro, false if paywall was shown
   * 
   * Use this at the start of Pro-gated functions:
   * ```
   * if (!requirePro()) return;
   * ```
   */
  const requirePro = (): boolean => {
    // If subscriptions disabled, allow all features
    if (!SUBSCRIPTIONS_ENABLED) {
      return true;
    }

    // If paywall disabled, allow all features
    if (!PAYWALL_ENABLED) {
      return true;
    }

    // Check if user has Pro
    if (isPro) {
      return true;
    }

    // Show paywall and return false
    showPaywall();
    return false;
  };

  return {
    isPro,
    requirePro,
    showPaywall,
  };
}
