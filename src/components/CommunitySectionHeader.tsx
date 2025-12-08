/**
 * Community Section Header
 * Shared header component for all Community tabs with deep forest green stripe
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, TEXT_ON_DARK } from "../constants/colors";

interface CommunitySectionHeaderProps {
  title: string;
  onAddPress: () => void;
}

export default function CommunitySectionHeader({
  title,
  onAddPress
}: CommunitySectionHeaderProps) {
  return (
    <View style={{ backgroundColor: DEEP_FOREST }}>
      <View className="px-5 py-3">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-xl"
            style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_ON_DARK }}
          >
            {title}
          </Text>
          <Pressable
            onPress={onAddPress}
            className="active:opacity-70"
          >
            <Ionicons name="add-circle" size={32} color={TEXT_ON_DARK} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
