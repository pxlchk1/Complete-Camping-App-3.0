/**
 * Modal Header Component
 * Dark forest green header that extends beyond safe zone
 * Used for all modal and detail screens
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEEP_FOREST, PARCHMENT } from "../constants/colors";

interface ModalHeaderProps {
  title?: string;
  showTitle?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  onBack?: () => void;
}

export default function ModalHeader({
  title,
  showTitle = false,
  rightAction,
  onBack,
}: ModalHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View
      style={{
        backgroundColor: DEEP_FOREST,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        {/* Back Button */}
        <Pressable
          onPress={handleBack}
          style={{ padding: 4 }}
          className="active:opacity-70"
        >
          <Ionicons name="arrow-back" size={24} color={PARCHMENT} />
        </Pressable>

        {/* Title (optional) */}
        {showTitle && title && (
          <Text
            style={{
              fontFamily: "JosefinSlab_700Bold",
              fontSize: 18,
              color: PARCHMENT,
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            {title}
          </Text>
        )}

        {/* Right Action (optional) */}
        {rightAction ? (
          <Pressable
            onPress={rightAction.onPress}
            style={{ padding: 4 }}
            className="active:opacity-70"
          >
            <Ionicons name={rightAction.icon} size={24} color={PARCHMENT} />
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>
    </View>
  );
}
