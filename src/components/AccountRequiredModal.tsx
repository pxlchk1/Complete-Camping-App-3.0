/**
 * Account Required Modal
 * Prompts non-logged-in users to create an account when attempting to save/modify data
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  CARD_BACKGROUND_LIGHT,
} from "../constants/colors";

interface AccountRequiredModalProps {
  visible: boolean;
  onCreateAccount: () => void;
  onMaybeLater: () => void;
}

export default function AccountRequiredModal({
  visible,
  onCreateAccount,
  onMaybeLater,
}: AccountRequiredModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={true}
      onRequestClose={onMaybeLater}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onMaybeLater} />
        
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={48} color={EARTH_GREEN} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Let's get you set up</Text>

          {/* Message */}
          <Text style={styles.message}>
            Saving your plans and gear requires a free account. It only takes a
            moment to set one up.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.primaryButton} onPress={onCreateAccount}>
              <Text style={styles.primaryButtonText}>Create an Account</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onMaybeLater}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
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
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: PARCHMENT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: "SourceSans3_700Bold",
    fontSize: 26,
    color: TEXT_PRIMARY_STRONG,
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: EARTH_GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "SourceSans3_700Bold",
    fontSize: 18,
    color: PARCHMENT,
  },
  secondaryButton: {
    backgroundColor: CARD_BACKGROUND_LIGHT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: TEXT_SECONDARY,
  },
});
