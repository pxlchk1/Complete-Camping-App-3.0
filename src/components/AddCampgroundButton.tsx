import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, textStyles, spacing, radius, fonts, fontSizes, shadows } from "../theme/theme";
import { DEEP_FOREST, EARTH_GREEN, CARD_BACKGROUND_LIGHT, BORDER_SOFT } from "../constants/colors";

interface AddCampgroundButtonProps {
  onPress: () => void;
}

export default function AddCampgroundButton({ onPress }: AddCampgroundButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: CARD_BACKGROUND_LIGHT,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: BORDER_SOFT,
        padding: spacing.lg,
        marginBottom: spacing.md,
        opacity: pressed ? 0.7 : 1,
        ...shadows.card,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: DEEP_FOREST,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.sm,
          }}
        >
          <Ionicons name="add" size={24} color={colors.parchment} />
        </View>
        <Text
          style={{
            fontFamily: fonts.displayRegular,
            fontSize: fontSizes.md,
            color: DEEP_FOREST,
          }}
        >
          Add your own campground
        </Text>
      </View>

      <Text
        style={{
          fontFamily: fonts.bodyRegular,
          fontSize: fontSizes.sm,
          color: EARTH_GREEN,
          lineHeight: 22,
        }}
      >
        Want to include a private or lesser known campground in your trip? Add it here so you can plan with it.
      </Text>
    </Pressable>
  );
}
