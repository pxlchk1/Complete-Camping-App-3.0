/**
 * My Campsite Welcome Modal
 * 
 * Shown once to brand new users when they first visit My Campsite.
 * Encourages profile completion with a friendly, non-intrusive greeting.
 * 
 * Rules:
 * - Only shown to logged-in users (FREE or PRO)
 * - Shown once per account (tracked via hasSeenMyCampsiteWelcomeModal flag)
 * - Does NOT show paywall or increment proAttemptCount
 * - Fully dismissible
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LOGOS } from "../constants/images";
import {
  DEEP_FOREST,
  PARCHMENT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  BORDER_SOFT,
} from "../constants/colors";

interface MyCampsiteWelcomeModalProps {
  visible: boolean;
  onSetupProfile: () => void;
  onNotNow: () => void;
}

export default function MyCampsiteWelcomeModal({
  visible,
  onSetupProfile,
  onNotNow,
}: MyCampsiteWelcomeModalProps) {
  const insets = useSafeAreaInsets();

  const handleSetupProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSetupProfile();
  };

  const handleNotNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotNow();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onNotNow}
    >
      <View style={styles.backdrop}>
        {/* Tap outside to dismiss */}
        <Pressable style={styles.backdropTouchable} onPress={onNotNow} />

        <View style={[styles.modalContainer, { marginBottom: Math.max(insets.bottom, 20) }]}>
          {/* App Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={LOGOS.APP_ICON}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome to The Complete Camping App</Text>

          {/* Body */}
          <Text style={styles.body}>Let&apos;s get your campsite set up.</Text>

          <Text style={styles.bodySecondary}>
            Add your name and handle, upload an avatar and cover photo, and tell us how you like to camp.
          </Text>

          <Text style={styles.bodyBonus}>
            Bonus points if you share your favorite gear.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleSetupProfile}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Set up camp</Text>
            </Pressable>

            <Pressable
              onPress={handleNotNow}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdropTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    marginHorizontal: 24,
    backgroundColor: PARCHMENT,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appIcon: {
    width: 80,
    height: 80,
  },
  title: {
    fontFamily: "Raleway_700Bold",
    fontSize: 22,
    color: TEXT_PRIMARY_STRONG,
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 16,
    color: TEXT_PRIMARY_STRONG,
    textAlign: "center",
    marginBottom: 12,
  },
  bodySecondary: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  bodyBonus: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: DEEP_FOREST,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 16,
    color: PARCHMENT,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  secondaryButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
