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
          <Text style={styles.title}>Let's get you set up.</Text>

          {/* Message */}
          <Text style={styles.message}>
            Create a free account so we can save your activity and keep the community running smoothly. It only takes a moment.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.primaryButton} onPress={onCreateAccount}>
              <Text style={styles.primaryButtonText}>Create an account</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onMaybeLater}>
              <Text style={styles.secondaryButtonText}>Maybe later</Text>
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
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "SourceSans3_700Bold",
    fontSize: 15,
    color: PARCHMENT,
  },
  secondaryButton: {
    backgroundColor: CARD_BACKGROUND_LIGHT,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: TEXT_SECONDARY,
  },
});
