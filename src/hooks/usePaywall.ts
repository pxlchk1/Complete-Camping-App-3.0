/**
 * usePaywall Hook
 * Provides helper functions for paywall navigation and Pro feature gating
 */

import { useNavigation } from "@react-navigation/native";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { SUBSCRIPTIONS_ENABLED, PAYWALL_ENABLED } from "../config/subscriptions";
import type { RootStackNavigationProp } from "../navigation/types";

export const usePaywall = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const isPro = useSubscriptionStore((s) => s.isPro);

  /**
   * Check if user has Pro access
   * Returns true if:
   * - Subscriptions disabled (feature flag)
   * - Paywall disabled (feature flag)
   * - User has active Pro entitlement
   */
  const hasProAccess = (): boolean => {
    // If subscriptions disabled, grant access
    if (!SUBSCRIPTIONS_ENABLED || !PAYWALL_ENABLED) {
      return true;
    }
    return isPro;
  };

  /**
   * Navigate to paywall screen
   * Use this to present paywall when user tries to access Pro feature
   */
  const showPaywall = () => {
    if (!PAYWALL_ENABLED) {
      console.log("[Paywall] Paywall disabled via feature flag");
      return;
    }
    navigation.navigate("Paywall");
  };

  /**
   * Gate a Pro feature
   * Returns true if user can access, false if paywall should be shown
   * 
   * Usage:
   * ```
   * const { gateFeature } = usePaywall();
   * 
   * const handleProFeature = () => {
   *   if (!gateFeature()) return;
   *   // Pro feature logic here
   * };
   * ```
   */
  const gateFeature = (): boolean => {
    if (hasProAccess()) {
      return true;
    }
    showPaywall();
    return false;
  };

  /**
   * Conditional rendering helper for Pro features
   * 
   * Usage:
   * ```
   * const { renderProFeature } = usePaywall();
   * 
   * {renderProFeature(
   *   <ProFeatureComponent />,
   *   <UpgradePrompt />
   * )}
   * ```
   */
  const renderProFeature = (
    proContent: React.ReactNode,
    fallbackContent?: React.ReactNode
  ): React.ReactNode => {
    if (hasProAccess()) {
      return proContent;
    }
    return fallbackContent || null;
  };

  return {
    isPro,
    hasProAccess,
    showPaywall,
    gateFeature,
    renderProFeature,
  };
};
