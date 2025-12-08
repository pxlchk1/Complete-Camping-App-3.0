/**
 * Paywall Screen
 * Subscription upgrade screen matching the current design system
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
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
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
} from "../constants/colors";

const PRO_FEATURES = [
  {
    icon: "map" as const,
    title: "Advanced Park Filters",
    description: "Find the perfect campsite with premium search filters",
  },
  {
    icon: "calendar" as const,
    title: "Unlimited Trip Planning",
    description: "Plan and manage multiple camping trips with full details",
  },
  {
    icon: "checkmark-circle" as const,
    title: "Complete Packing Lists",
    description: "Access premium gear lists and custom templates",
  },
  {
    icon: "people" as const,
    title: "Full Community Access",
    description: "Post unlimited tips, reviews, and connect with campers",
  },
  {
    icon: "book" as const,
    title: "Premium Learning Content",
    description: "Unlock advanced camping guides and expert tips",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Offline Mode",
    description: "Access your trips and guides without internet",
  },
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const subscriptionLoading = useSubscriptionStore((s) => s.subscriptionLoading);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offering = await getOfferings();

      if (offering && offering.availablePackages.length > 0) {
        const pkgs = offering.availablePackages;
        setPackages(pkgs);

        // Auto-select annual package by packageType, fallback to first package
        const annualPkg = pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
        setSelectedPackage(annualPkg || pkgs[0]);
      }
    } catch (error) {
      console.error("[Paywall] Failed to load offerings:", error);
      Alert.alert("Error", "Failed to load subscription plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const success = await subscribeToPlan(selectedPackage.identifier);

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

  const formatPrice = (pkg: PurchasesPackage): string => {
    const price = pkg.product.priceString;
    const period = pkg.identifier.includes("annual") ? "year" : "month";
    return `${price}/${period}`;
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
        <View className="flex-1">
          <Text
            className="text-2xl"
            style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
          >
            Go Pro
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 active:opacity-70"
        >
          <Ionicons name="close" size={28} color={DEEP_FOREST} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="px-5 pt-6 pb-4">
          <Text
            className="text-center mb-3"
            style={{
              fontFamily: "JosefinSlab_700Bold",
              fontSize: 28,
              color: TEXT_PRIMARY_STRONG,
            }}
          >
            Complete Camping App Pro
          </Text>
          <Text
            className="text-center"
            style={{
              fontFamily: "SourceSans3_400Regular",
              fontSize: 16,
              color: TEXT_SECONDARY,
              lineHeight: 24,
            }}
          >
            Unlock the full potential of your camping adventures with premium features
          </Text>
        </View>

        {/* Features List */}
        <View className="px-5 py-4">
          {PRO_FEATURES.map((feature, index) => (
            <View
              key={index}
              className="flex-row items-start mb-4 p-4 rounded-xl"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: DEEP_FOREST }}
              >
                <Ionicons name={feature.icon} size={20} color={PARCHMENT} />
              </View>
              <View className="flex-1">
                <Text
                  className="mb-1"
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    fontSize: 16,
                    color: TEXT_PRIMARY_STRONG,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "SourceSans3_400Regular",
                    fontSize: 14,
                    color: TEXT_SECONDARY,
                    lineHeight: 20,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        {packages.length > 0 && (
          <View className="px-5 py-4">
            <Text
              className="mb-4"
              style={{
                fontFamily: "JosefinSlab_700Bold",
                fontSize: 20,
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Choose Your Plan
            </Text>

            {packages.map((pkg) => {
              const isAnnual = pkg.identifier.includes("annual");
              const isSelected = selectedPackage?.identifier === pkg.identifier;

              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => {
                    setSelectedPackage(pkg);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="mb-3 p-4 rounded-xl border-2 active:opacity-90"
                  style={{
                    backgroundColor: isSelected ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                    borderColor: isSelected ? DEEP_FOREST : BORDER_SOFT,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text
                          style={{
                            fontFamily: "SourceSans3_600SemiBold",
                            fontSize: 18,
                            color: isSelected ? PARCHMENT : TEXT_PRIMARY_STRONG,
                          }}
                        >
                          {isAnnual ? "Annual" : "Monthly"}
                        </Text>
                        {isAnnual && (
                          <View
                            className="ml-2 px-2 py-1 rounded-full"
                            style={{ backgroundColor: GRANITE_GOLD }}
                          >
                            <Text
                              style={{
                                fontFamily: "SourceSans3_600SemiBold",
                                fontSize: 11,
                                color: PARCHMENT,
                              }}
                            >
                              BEST VALUE
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontFamily: "SourceSans3_400Regular",
                          fontSize: 14,
                          color: isSelected ? PARCHMENT : TEXT_SECONDARY,
                        }}
                      >
                        {formatPrice(pkg)}
                      </Text>
                    </View>
                    <View
                      className="w-6 h-6 rounded-full border-2 items-center justify-center"
                      style={{
                        borderColor: isSelected ? PARCHMENT : BORDER_SOFT,
                        backgroundColor: isSelected ? PARCHMENT : "transparent",
                      }}
                    >
                      {isSelected && (
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: DEEP_FOREST }}
                        />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t"
        style={{ backgroundColor: PARCHMENT, borderColor: BORDER_SOFT }}
      >
        <Pressable
          onPress={handleSubscribe}
          disabled={!selectedPackage || purchasing || subscriptionLoading}
          className="rounded-xl py-4 mb-3 active:opacity-90"
          style={{ backgroundColor: DEEP_FOREST }}
        >
          {purchasing || subscriptionLoading ? (
            <ActivityIndicator color={PARCHMENT} />
          ) : (
            <Text
              className="text-center"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                fontSize: 18,
                color: PARCHMENT,
              }}
            >
              Start Subscription
            </Text>
          )}
        </Pressable>

        <View className="flex-row items-center justify-center gap-4">
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            className="py-2 active:opacity-70"
          >
            <Text
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                fontSize: 14,
                color: TEXT_SECONDARY,
              }}
            >
              {restoring ? "Restoring..." : "Restore Purchases"}
            </Text>
          </Pressable>

          <Text style={{ color: TEXT_SECONDARY }}>•</Text>

          <Pressable
            onPress={() => navigation.goBack()}
            className="py-2 active:opacity-70"
          >
            <Text
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                fontSize: 14,
                color: TEXT_SECONDARY,
              }}
            >
              Not Now
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
