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
import { getOfferings, subscribeToPlan, restorePurchases, syncSubscriptionToFirestore } from "../services/subscriptionService";
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
  "Unlimited trip planning",
  "Save as many parks as you want",
  "Create and reuse gear sets",
  "Custom packing list templates",
  "Advanced search and filters",
  "Cloud sync across devices",
  "Future Pro features included",
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const subscriptionLoading = useSubscriptionStore((s) => s.subscriptionLoading);

  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
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
      const offering = await getOfferings();

      if (offering && offering.availablePackages.length > 0) {
        const pkgs = offering.availablePackages;

        // Find monthly and annual packages
        const monthly = pkgs.find((p) => 
          p.identifier.toLowerCase().includes("monthly") ||
          p.packageType === PACKAGE_TYPE.MONTHLY
        );
        
        const annual = pkgs.find((p) => 
          p.identifier.toLowerCase().includes("annual") || 
          p.identifier.toLowerCase().includes("yearly") ||
          p.packageType === PACKAGE_TYPE.ANNUAL
        );

        setMonthlyPackage(monthly || null);
        setAnnualPackage(annual || null);
        
        console.log("[Paywall] Loaded packages - Monthly:", monthly?.identifier, "Annual:", annual?.identifier);
        
        if (!monthly && !annual) {
          setError("Unable to load subscription options. Check your connection and try again.");
        }
      } else {
        console.log("[Paywall] No packages available");
        setError("Unable to load subscription options. Check your connection and try again.");
      }
    } catch (error) {
      console.error("[Paywall] Failed to load offerings:", error);
      setError("Unable to load subscription options. Check your connection and try again.");
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
      <View className="flex-row items-center justify-between px-5 py-3 border-b" style={{ borderColor: BORDER_SOFT }}>
        <Text
          className="text-xl"
          style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
        >
          Complete Camping Pro
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 active:opacity-70"
          accessibilityLabel="Close"
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
        {/* Title */}
        <View className="px-6 pt-6 pb-4">
          <Text
            className="text-center"
            style={{
              fontFamily: "JosefinSlab_700Bold",
              fontSize: 32,
              color: TEXT_PRIMARY_STRONG,
              lineHeight: 38,
            }}
          >
            Make every trip easier
          </Text>
        </View>

        {/* Pricing CTAs */}
        {error ? (
          <View className="px-6 py-8">
            <View className="p-6 rounded-xl" style={{ backgroundColor: CARD_BACKGROUND_LIGHT }}>
              <Ionicons name="alert-circle-outline" size={48} color={TEXT_SECONDARY} style={{ alignSelf: "center", marginBottom: 12 }} />
              <Text
                className="text-center"
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 16,
                  color: TEXT_SECONDARY,
                  lineHeight: 24,
                }}
              >
                {error}
              </Text>
            </View>
          </View>
        ) : (
          <View className="px-6 pb-6">
            {/* Annual Plan */}
            {annualPackage && (
              <Pressable
                onPress={() => handlePurchase(annualPackage)}
                disabled={purchasing}
                className="mb-3 p-5 rounded-2xl border-2 active:opacity-90"
                style={{
                  backgroundColor: DEEP_FOREST,
                  borderColor: DEEP_FOREST,
                }}
              >
                <Text
                  className="mb-1"
                  style={{
                    fontFamily: "SourceSans3_700Bold",
                    fontSize: 20,
                    color: PARCHMENT,
                  }}
                >
                  {annualPackage.product.priceString} per year
                </Text>
                <Text
                  style={{
                    fontFamily: "SourceSans3_400Regular",
                    fontSize: 15,
                    color: PARCHMENT,
                    opacity: 0.9,
                    lineHeight: 22,
                  }}
                >
                  Best value. One simple payment for a full year.
                </Text>
              </Pressable>
            )}

            {/* Monthly Plan */}
            {monthlyPackage && (
              <Pressable
                onPress={() => handlePurchase(monthlyPackage)}
                disabled={purchasing}
                className="p-5 rounded-2xl border-2 active:opacity-90"
                style={{
                  backgroundColor: CARD_BACKGROUND_LIGHT,
                  borderColor: BORDER_SOFT,
                }}
              >
                <Text
                  className="mb-1"
                  style={{
                    fontFamily: "SourceSans3_700Bold",
                    fontSize: 20,
                    color: TEXT_PRIMARY_STRONG,
                  }}
                >
                  {monthlyPackage.product.priceString} per month
                </Text>
                <Text
                  style={{
                    fontFamily: "SourceSans3_400Regular",
                    fontSize: 15,
                    color: TEXT_SECONDARY,
                    lineHeight: 22,
                  }}
                >
                  Start planning with flexible billing.
                </Text>
              </Pressable>
            )}

            {purchasing && (
              <View className="mt-4 items-center">
                <ActivityIndicator size="small" color={DEEP_FOREST} />
              </View>
            )}
          </View>
        )}

        {/* Hero Illustration */}
        <View className="px-6 py-8">
          <View 
            className="rounded-2xl overflow-hidden items-center justify-center"
            style={{ 
              backgroundColor: DEEP_FOREST,
              height: 200,
            }}
          >
            {/* Placeholder for tent & lantern illustration */}
            <Ionicons name="bonfire" size={80} color={GRANITE_GOLD} />
            <Text
              className="mt-4"
              style={{
                fontFamily: "JosefinSlab_700Bold",
                fontSize: 18,
                color: PARCHMENT,
              }}
            >
              🏕️ ⛺ 🔦
            </Text>
          </View>
        </View>

        {/* Subtitle */}
        <View className="px-6 pb-4">
          <Text
            className="text-center"
            style={{
              fontFamily: "SourceSans3_400Regular",
              fontSize: 17,
              color: TEXT_SECONDARY,
              lineHeight: 26,
            }}
          >
            Unlock the full planning toolkit and keep your trips organized in one place.
          </Text>
        </View>

        {/* Feature List */}
        <View className="px-6 pb-6">
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} className="flex-row items-start mb-3">
              <Text
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 20,
                  color: EARTH_GREEN,
                  marginRight: 12,
                }}
              >
                •
              </Text>
              <Text
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 16,
                  color: TEXT_PRIMARY_STRONG,
                  lineHeight: 24,
                  flex: 1,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer Legal */}
        <View className="px-6 pb-4">
          <Text
            className="text-center"
            style={{
              fontFamily: "SourceSans3_400Regular",
              fontSize: 13,
              color: TEXT_MUTED,
              lineHeight: 20,
            }}
          >
            Payment is handled through the App Store. Your subscription renews automatically until canceled. You can manage your plan in your App Store settings.
          </Text>
        </View>

        {/* Restore Purchases */}
        <View className="px-6 pb-4">
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            className="py-3 active:opacity-70"
          >
            <Text
              className="text-center"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                fontSize: 16,
                color: TEXT_SECONDARY,
              }}
            >
              {restoring ? "Restoring..." : "Restore Purchases"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
