/**
 * Paywall Screen
 * Redesigned with CTAs at top, hero image, and features below
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Purchases, { PurchasesPackage, PACKAGE_TYPE } from "react-native-purchases";

// Services
import { fetchOfferingsSafe, subscribeToPlan, restorePurchases, syncSubscriptionToFirestore } from "../services/subscriptionService";
import { useSubscriptionStore } from "../state/subscriptionStore";

// Constants
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../constants/colors";

const PRO_FEATURES = [
  "Share trip plans with your camping buddies in My Campground",
  "Build a day-by-day itinerary with trail and map links",
  "Plan trips end-to-end: meals, packing lists, and weather in one place",
  "Get packing help based on season and camping style",
  "Connect with campers for tips, photos, and gear reviews",
  "Offline first aid reference",
  "Track your gear closet and add items to trips fast",
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const subscriptionLoading = useSubscriptionStore((s) => s.subscriptionLoading);

  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[Paywall] Fetching offerings...");
      const offerings = await fetchOfferingsSafe();

      if (!offerings) {
        console.warn("[Paywall] No offerings returned - RevenueCat may not be configured");
        setError("Subscription options are not available right now. Please check back later or contact support.");
        setLoading(false);
        return;
      }

      const offering = offerings.current;
      
      if (!offering || !offering.availablePackages.length) {
        console.warn("[Paywall] No packages available in current offering");
        setError("Subscription options are not available right now. Please check back later or contact support.");
        setLoading(false);
        return;
      }

      const pkgs = offering.availablePackages;

      // Find monthly and annual packages
      // Products: cca_monthly_sub, cca_annual_sub
      const monthly = pkgs.find((p) => 
        p.product.identifier === "cca_monthly_sub" ||
        p.identifier.toLowerCase().includes("monthly") ||
        p.packageType === PACKAGE_TYPE.MONTHLY
      );
      
      const annual = pkgs.find((p) => 
        p.product.identifier === "cca_annual_sub" ||
        p.identifier.toLowerCase().includes("annual") || 
        p.identifier.toLowerCase().includes("yearly") ||
        p.packageType === PACKAGE_TYPE.ANNUAL
      );

      setMonthlyPackage(monthly || null);
      setAnnualPackage(annual || null);
      
      console.log("[Paywall] Loaded packages:", {
        monthly: monthly ? {
          identifier: monthly.identifier,
          productId: monthly.product.identifier,
          price: monthly.product.priceString,
        } : null,
        annual: annual ? {
          identifier: annual.identifier,
          productId: annual.product.identifier,
          price: annual.product.priceString,
        } : null,
      });
      
      if (!monthly && !annual) {
        setError("Subscription options are not available right now. Please check back later or contact support.");
      }
    } catch (error) {
      console.error("[Paywall] Failed to load offerings:", error);
      setError("An error occurred while loading subscription options. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const success = await subscribeToPlan(pkg.identifier);

      if (success) {
        // Sync subscription status to Firestore
        await syncSubscriptionToFirestore();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Welcome to Pro!",
          "You now have access to all premium features.",
          [{ text: "Get Started", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error("[Paywall] Purchase error:", error);
      if (!error.userCancelled) {
        Alert.alert("Purchase Failed", "Please try again or contact support.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const restored = await restorePurchases();

      if (restored) {
        // Sync subscription status to Firestore
        await syncSubscriptionToFirestore();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Purchases Restored",
          "Your subscription has been restored.",
          [{ text: "Continue", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("No Purchases Found", "No active subscriptions were found for your account.");
      }
    } catch (error) {
      console.error("[Paywall] Restore error:", error);
      Alert.alert("Restore Failed", "Please try again or contact support.");
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-parchment">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
          <Text
            className="mt-4"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            Loading plans...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-parchment">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER_SOFT }}>
        <Text
          className="text-2xl"
          style={{ fontFamily: "Raleway_700Bold", color: TEXT_PRIMARY_STRONG }}
        >
          Go Pro
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 active:opacity-70"
          accessibilityLabel="Not now"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color={DEEP_FOREST} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Value Props */}
        <View className="px-6 pt-6 pb-4">
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <View
                className="w-6 h-6 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: EARTH_GREEN }}
              >
                <Ionicons name="checkmark" size={16} color={PARCHMENT} />
              </View>
              <Text
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 16,
                  color: TEXT_PRIMARY_STRONG,
                  flex: 1,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Error/Empty State */}
        {error ? (
          <View className="px-6 py-4">
            <View className="p-6 rounded-xl" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderWidth: 1, borderColor: BORDER_SOFT }}>
              <Ionicons name="alert-circle-outline" size={48} color={TEXT_SECONDARY} style={{ alignSelf: "center", marginBottom: 12 }} />
              <Text
                className="text-center mb-4"
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  fontSize: 16,
                  color: TEXT_PRIMARY_STRONG,
                }}
              >
                Subscriptions Temporarily Unavailable
              </Text>
              <Text
                className="text-center mb-4"
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  lineHeight: 20,
                }}
              >
                {error}
              </Text>
              <Pressable
                onPress={loadOfferings}
                className="mt-2 p-3 rounded-xl active:opacity-70"
                style={{ backgroundColor: DEEP_FOREST }}
              >
                <Text
                  className="text-center"
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    fontSize: 15,
                    color: PARCHMENT,
                  }}
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (!monthlyPackage && !annualPackage) ? (
          <View className="px-6 py-4">
            <View className="p-6 rounded-xl" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderWidth: 1, borderColor: BORDER_SOFT }}>
              <Ionicons name="information-circle-outline" size={48} color={TEXT_SECONDARY} style={{ alignSelf: "center", marginBottom: 12 }} />
              <Text
                className="text-center"
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  lineHeight: 20,
                }}
              >
                No subscription options are currently available. Please check back later.
              </Text>
            </View>
          </View>
        ) : (
          <View className="px-6 pb-6">
            {/* Annual Plan Card */}
            {annualPackage && (
              <Pressable
                onPress={() => setSelectedPlan("annual")}
                disabled={purchasing}
                className="mb-3 p-5 rounded-xl border-2 active:opacity-90 relative"
                style={{
                  backgroundColor: selectedPlan === "annual" ? DEEP_FOREST + "15" : CARD_BACKGROUND_LIGHT,
                  borderColor: selectedPlan === "annual" ? DEEP_FOREST : BORDER_SOFT,
                }}
              >
                {/* Best Value Badge */}
                <View
                  className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg rounded-tr-lg"
                  style={{ backgroundColor: GRANITE_GOLD }}
                >
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 11,
                      color: "#fff",
                    }}
                  >
                    BEST VALUE
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  <View className="flex-1">
                    <Text
                      style={{
                        fontFamily: "Raleway_700Bold",
                        fontSize: 18,
                        color: TEXT_PRIMARY_STRONG,
                        marginBottom: 2,
                      }}
                    >
                      Annual
                    </Text>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_700Bold",
                        fontSize: 24,
                        color: TEXT_PRIMARY_STRONG,
                        marginBottom: 2,
                      }}
                    >
                      {annualPackage.product.priceString}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_400Regular",
                        fontSize: 14,
                        color: TEXT_SECONDARY,
                      }}
                    >
                      per year
                    </Text>
                  </View>

                  {/* Radio Button */}
                  <View
                    className="w-6 h-6 rounded-full border-2 items-center justify-center"
                    style={{
                      borderColor: selectedPlan === "annual" ? DEEP_FOREST : BORDER_SOFT,
                      backgroundColor: selectedPlan === "annual" ? DEEP_FOREST : "transparent",
                    }}
                  >
                    {selectedPlan === "annual" && (
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: PARCHMENT }} />
                    )}
                  </View>
                </View>
              </Pressable>
            )}

            {/* Monthly Plan Card */}
            {monthlyPackage && (
              <Pressable
                onPress={() => setSelectedPlan("monthly")}
                disabled={purchasing}
                className="mb-3 p-5 rounded-xl border-2 active:opacity-90"
                style={{
                  backgroundColor: selectedPlan === "monthly" ? DEEP_FOREST + "15" : CARD_BACKGROUND_LIGHT,
                  borderColor: selectedPlan === "monthly" ? DEEP_FOREST : BORDER_SOFT,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      style={{
                        fontFamily: "Raleway_700Bold",
                        fontSize: 18,
                        color: TEXT_PRIMARY_STRONG,
                        marginBottom: 2,
                      }}
                    >
                      Monthly
                    </Text>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_700Bold",
                        fontSize: 24,
                        color: TEXT_PRIMARY_STRONG,
                        marginBottom: 2,
                      }}
                    >
                      {monthlyPackage.product.priceString}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_400Regular",
                        fontSize: 14,
                        color: TEXT_SECONDARY,
                      }}
                    >
                      per month
                    </Text>
                  </View>

                  {/* Radio Button */}
                  <View
                    className="w-6 h-6 rounded-full border-2 items-center justify-center"
                    style={{
                      borderColor: selectedPlan === "monthly" ? DEEP_FOREST : BORDER_SOFT,
                      backgroundColor: selectedPlan === "monthly" ? DEEP_FOREST : "transparent",
                    }}
                  >
                    {selectedPlan === "monthly" && (
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: PARCHMENT }} />
                    )}
                  </View>
                </View>
              </Pressable>
            )}

            {/* Primary CTA */}
            <Pressable
              onPress={() => {
                const pkg = selectedPlan === "annual" ? annualPackage : monthlyPackage;
                if (pkg) handlePurchase(pkg);
              }}
              disabled={purchasing || (!annualPackage && !monthlyPackage)}
              className="mt-2 p-4 rounded-xl active:opacity-90"
              style={{
                backgroundColor: DEEP_FOREST,
                opacity: purchasing ? 0.6 : 1,
              }}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color={PARCHMENT} />
              ) : (
                <Text
                  className="text-center"
                  style={{
                    fontFamily: "SourceSans3_700Bold",
                    fontSize: 17,
                    color: PARCHMENT,
                  }}
                >
                  {selectedPlan === "annual" ? "Start Annual" : "Start Monthly"}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Restore Purchases */}
        <View className="px-6 pb-2">
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            className="py-3 active:opacity-70"
          >
            <Text
              className="text-center"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                fontSize: 15,
                color: restoring ? TEXT_MUTED : DEEP_FOREST,
              }}
            >
              {restoring ? "Restoring..." : "Restore purchases"}
            </Text>
          </Pressable>
        </View>

        {/* Footer Microcopy */}
        <View className="px-6 pb-6">
          <Text
            className="text-center"
            style={{
              fontFamily: "SourceSans3_400Regular",
              fontSize: 13,
              color: TEXT_MUTED,
              lineHeight: 18,
            }}
          >
            Cancel anytime. Manage in Apple subscriptions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
