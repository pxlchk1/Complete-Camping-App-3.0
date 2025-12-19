/**
 * Paywall Modal
 * Full-screen subscription modal with pricing options
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
} from "../constants/colors";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallModal({
  visible,
  onClose,
}: PaywallModalProps) {
  // Placeholder functions, will be wired to RevenueCat later
  const purchasePackage = (packageType: "annual" | "monthly") => {
    console.log(`Purchase ${packageType} package`);
  };

  const restorePurchases = () => {
    console.log("Restore purchases");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons
              name="close"
              size={28}
              color={TEXT_PRIMARY_STRONG}
            />
          </Pressable>

          <Text style={styles.headerTitle}>Complete Camping Pro</Text>

          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Make every trip easier</Text>

          {/* Pricing Options */}
          <View style={styles.pricingSection}>
            {/* Annual Plan */}
            <Pressable
              style={[
                styles.pricingButton,
                styles.pricingButtonAnnual,
              ]}
              onPress={() => purchasePackage("annual")}
            >
              <View style={styles.pricingContent}>
                <Text style={styles.pricingLabel}>
                  $24.99 per year
                </Text>
                <Text style={styles.pricingSubtext}>
                  Best value. One simple payment for a full year.
                </Text>
              </View>
            </Pressable>

            {/* Monthly Plan */}
            <Pressable
              style={styles.pricingButton}
              onPress={() => purchasePackage("monthly")}
            >
              <View style={styles.pricingContent}>
                <Text style={styles.pricingLabel}>
                  $3.99 per month
                </Text>
                <Text style={styles.pricingSubtext}>
                  Start planning with flexible billing.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Hero Placeholder */}
          <View style={styles.heroContainer}>
            <View style={styles.heroPlaceholder}>
              <Ionicons
                name="moon"
                size={80}
                color={GRANITE_GOLD}
              />
              <Text style={styles.heroPlaceholderText}>
                🏕️ Tent & Lantern
              </Text>
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Unlock the full planning toolkit and keep your trips
            organized in one place.
          </Text>

          {/* Feature List */}
          <View style={styles.featureList}>
            {[
              "Unlimited trip planning",
              "Save as many parks as you want",
              "Create and reuse gear sets",
              "Custom packing list templates",
              "Advanced search and filters",
              "Cloud sync across devices",
              "Future Pro features included",
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={EARTH_GREEN}
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Legal */}
          <Text style={styles.legalText}>
            Payment is handled through the App Store. Your
            subscription renews automatically until canceled.
            Manage your plan in App Store settings.
          </Text>

          {/* Restore Purchases */}
          <Pressable
            style={styles.restoreButton}
            onPress={restorePurchases}
          >
            <Text style={styles.restoreButtonText}>
              Restore Purchases
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SOFT,
    backgroundColor: PARCHMENT,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: TEXT_PRIMARY_STRONG,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: "SourceSans3_700Bold",
    fontSize: 32,
    color: TEXT_PRIMARY_STRONG,
    textAlign: "center",
    marginBottom: 24,
  },
  pricingSection: {
    marginBottom: 32,
  },
  pricingButton: {
    backgroundColor: CARD_BACKGROUND_LIGHT,
    borderWidth: 2,
    borderColor: BORDER_SOFT,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  pricingButtonAnnual: {
    borderColor: EARTH_GREEN,
    borderWidth: 3,
    backgroundColor: "#f0f9f4",
  },
  pricingContent: {
    alignItems: "center",
  },
  pricingLabel: {
    fontFamily: "SourceSans3_700Bold",
    fontSize: 24,
    color: TEXT_PRIMARY_STRONG,
    marginBottom: 8,
  },
  pricingSubtext: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
  },
  heroContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: CARD_BACKGROUND_LIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlaceholderText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: TEXT_SECONDARY,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: TEXT_PRIMARY_STRONG,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 26,
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontFamily: "SourceSans3_400Regular",
    fontSize: 16,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  legalText: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 16,
    color: EARTH_GREEN,
  },
});
