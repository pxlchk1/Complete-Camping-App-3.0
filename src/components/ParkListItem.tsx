import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Park } from "../types/camping";
import { colors, textStyles, spacing, radius, fonts, fontSizes, shadows } from "../theme/theme";
import { DEEP_FOREST, EARTH_GREEN, CARD_BACKGROUND_LIGHT, CARD_BACKGROUND_ALT, BORDER_SOFT, TEXT_SECONDARY, PARCHMENT } from "../constants/colors";

interface ParkListItemProps {
  park: Park;
  onPress?: (park: Park) => void;
  index?: number;
}

const getParkTypeLabel = (filter: string): string => {
  switch (filter) {
    case "national_park":
      return "National Park";
    case "state_park":
      return "State Park";
    case "national_forest":
      return "National Forest";
    default:
      return filter;
  }
};

// Alternating background colors for visual separation
// PARCHMENT is #F5F1E8, lighter variant is 5% lighter
const PARCHMENT_BASE = "#F5F1E8";
const PARCHMENT_LIGHT = "#FAF8F3"; // 5% lighter

export default function ParkListItem({ park, onPress, index = 0 }: ParkListItemProps) {
  // Alternate background color based on index
  const isEvenRow = index % 2 === 0;
  const backgroundColor = isEvenRow ? PARCHMENT_BASE : PARCHMENT_LIGHT;

  return (
    <Pressable
      onPress={() => onPress?.(park)}
      style={({ pressed }) => ({
        backgroundColor: backgroundColor,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginHorizontal: -16, // Full width - extend to edges
        opacity: pressed ? 0.7 : 1,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E0D5",
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Content */}
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          {/* Park Name */}
          <Text
            style={{
              fontFamily: fonts.displaySemibold,
              fontSize: fontSizes.md,
              color: DEEP_FOREST,
              marginBottom: 8,
              lineHeight: fontSizes.md * 1.2,
            }}
          >
            {park.name}
          </Text>

          {/* Type and State */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            {park.state && (
              <View
                style={{
                  backgroundColor: "#E8F4E8",
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodyRegular,
                    fontSize: fontSizes.xs,
                    color: "#5A7856",
                  }}
                >
                  {park.state}
                </Text>
              </View>
            )}
            <Text
              style={{
                fontFamily: fonts.bodyRegular,
                fontSize: fontSizes.xs,
                color: "#5A7856",
              }}
            >
              {getParkTypeLabel(park.filter)}
            </Text>
          </View>

          {/* Address */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
            <Ionicons name="location-outline" size={12} color="#8A9580" />
            <Text
              style={{
                fontFamily: fonts.bodyRegular,
                fontSize: 11,
                color: "#8A9580",
                marginLeft: 4,
              }}
              numberOfLines={1}
            >
              {park.address}
            </Text>
          </View>
        </View>

        {/* Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: "#EBE7DC",
            alignItems: "center",
            justifyContent: "center",
            padding: 7,
          }}
        >
          <Ionicons name="compass-outline" size={20} color={DEEP_FOREST} />
        </View>
      </View>
    </Pressable>
  );
}
