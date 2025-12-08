import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, spacing, radius, fonts, fontSizes } from "../theme/theme";
import { DEEP_FOREST, EARTH_GREEN, CARD_BACKGROUND_LIGHT, BORDER_SOFT, TEXT_PRIMARY_STRONG } from "../constants/colors";

export type FilterMode = "near" | "search";
export type ParkType = "all" | "state_park" | "national_park" | "national_forest";
export type DriveTime = 2 | 4 | 6 | 8 | 12;

interface ParkFilterBarProps {
  mode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  driveTime: DriveTime;
  onDriveTimeChange: (time: DriveTime) => void;
  parkType: ParkType;
  onParkTypeChange: (type: ParkType) => void;
  onLocationRequest: (location: { latitude: number; longitude: number }) => void;
  onLocationError: (error: string) => void;
}

const DRIVE_TIME_OPTIONS: { value: DriveTime; label: string }[] = [
  { value: 2, label: "2 hours" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours" },
  { value: 12, label: "12 hours" },
];

const PARK_TYPE_OPTIONS: { value: ParkType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "all", label: "All Parks", icon: "leaf" },
  { value: "state_park", label: "State Parks", icon: "flag" },
  { value: "national_park", label: "National Parks", icon: "shield" },
  { value: "national_forest", label: "National Forests", icon: "leaf-outline" },
];

export default function ParkFilterBar({
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  driveTime,
  onDriveTimeChange,
  parkType,
  onParkTypeChange,
  onLocationRequest,
  onLocationError,
}: ParkFilterBarProps) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [showDriveTimeModal, setShowDriveTimeModal] = useState(false);
  const [showParkTypeModal, setShowParkTypeModal] = useState(false);

  const handleLocationPress = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        onLocationError("Location permission not granted");
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      onLocationRequest({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      onLocationError("Failed to get location");
    } finally {
      setLocationLoading(false);
    }
  };

  const getDriveTimeLabel = () => {
    const option = DRIVE_TIME_OPTIONS.find((opt) => opt.value === driveTime);
    return option?.label || "4 hours";
  };

  const getParkTypeLabel = () => {
    const option = PARK_TYPE_OPTIONS.find((opt) => opt.value === parkType);
    return option?.label || "All Parks";
  };

  return (
    <View
      style={{
        backgroundColor: CARD_BACKGROUND_LIGHT,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: BORDER_SOFT,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      {/* Mode Pills */}
      <View style={{ flexDirection: "row", marginBottom: spacing.md, gap: spacing.xs }}>
        <Pressable
          onPress={async () => {
            // Always request location when Near me is tapped
            await handleLocationPress();
            onModeChange("near");
          }}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radius.pill,
            backgroundColor: mode === "near" ? DEEP_FOREST : "transparent",
            borderWidth: 1,
            borderColor: mode === "near" ? DEEP_FOREST : BORDER_SOFT,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: fontSizes.xs,
              color: mode === "near" ? colors.parchment : EARTH_GREEN,
            }}
          >
            {locationLoading ? "Getting location..." : "Near me"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onModeChange("search")}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radius.pill,
            backgroundColor: mode === "search" ? DEEP_FOREST : "transparent",
            borderWidth: 1,
            borderColor: mode === "search" ? DEEP_FOREST : BORDER_SOFT,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: fontSizes.xs,
              color: mode === "search" ? colors.parchment : EARTH_GREEN,
            }}
          >
            Search by name
          </Text>
        </Pressable>
      </View>

      {/* Near Me Mode - Dropdowns */}
      {mode === "near" && (
        <View>
          {/* Drive Time & Park Type Side by Side */}
          <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
            {/* Drive Time Dropdown */}
            <Pressable
              onPress={() => setShowDriveTimeModal(true)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.parchment,
                borderWidth: 1,
                borderColor: BORDER_SOFT,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bodyRegular,
                  fontSize: fontSizes.sm,
                  color: TEXT_PRIMARY_STRONG,
                }}
              >
                Drive time: {driveTime}h
              </Text>
              <Ionicons name="chevron-down" size={18} color={EARTH_GREEN} />
            </Pressable>

            {/* Park Type Dropdown */}
            <Pressable
              onPress={() => setShowParkTypeModal(true)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.parchment,
                borderWidth: 1,
                borderColor: BORDER_SOFT,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.bodyRegular,
                  fontSize: fontSizes.sm,
                  color: TEXT_PRIMARY_STRONG,
                  flex: 1,
                }}
              >
                Park type: {getParkTypeLabel()}
              </Text>
              <Ionicons name="chevron-down" size={18} color={EARTH_GREEN} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Search Mode - Search Input & Park Type Side by Side */}
      {mode === "search" && (
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {/* Search Input */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.parchment,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
              gap: spacing.xs,
            }}
          >
            <Ionicons name="search" size={18} color={EARTH_GREEN} />
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search parks"
              placeholderTextColor={EARTH_GREEN}
              style={{
                flex: 1,
                fontFamily: fonts.bodyRegular,
                fontSize: fontSizes.sm,
                color: DEEP_FOREST,
                paddingVertical: spacing.xs,
              }}
            />
          </View>

          {/* Park Type Dropdown */}
          <Pressable
            onPress={() => setShowParkTypeModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.parchment,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
              minWidth: 120,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyRegular,
                fontSize: fontSizes.sm,
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Type
            </Text>
            <Ionicons name="chevron-down" size={18} color={EARTH_GREEN} />
          </Pressable>
        </View>
      )}

      {/* Drive Time Modal */}
      <Modal
        visible={showDriveTimeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDriveTimeModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowDriveTimeModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.parchment,
              borderRadius: radius.lg,
              width: "80%",
              maxWidth: 400,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: BORDER_SOFT,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.displaySemibold,
                  fontSize: fontSizes.md,
                  color: DEEP_FOREST,
                }}
              >
                Willing to drive
              </Text>
              <Pressable onPress={() => setShowDriveTimeModal(false)}>
                <Ionicons name="close" size={28} color={DEEP_FOREST} />
              </Pressable>
            </View>

            {/* Options */}
            <View style={{ padding: spacing.lg }}>
              {DRIVE_TIME_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onDriveTimeChange(option.value);
                    setShowDriveTimeModal(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: BORDER_SOFT,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodyRegular,
                      fontSize: fontSizes.sm,
                      color: DEEP_FOREST,
                    }}
                  >
                    {option.label}
                  </Text>
                  {driveTime === option.value && (
                    <Ionicons name="checkmark" size={20} color={DEEP_FOREST} />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Park Type Modal */}
      <Modal
        visible={showParkTypeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowParkTypeModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowParkTypeModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.parchment,
              borderRadius: radius.lg,
              width: "80%",
              maxWidth: 400,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: BORDER_SOFT,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.displaySemibold,
                  fontSize: fontSizes.md,
                  color: DEEP_FOREST,
                }}
              >
                Park type
              </Text>
              <Pressable onPress={() => setShowParkTypeModal(false)}>
                <Ionicons name="close" size={28} color={DEEP_FOREST} />
              </Pressable>
            </View>

            {/* Options */}
            <View style={{ padding: spacing.lg }}>
              {PARK_TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onParkTypeChange(option.value);
                    setShowParkTypeModal(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: BORDER_SOFT,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Ionicons name={option.icon} size={18} color={DEEP_FOREST} />
                    <Text
                      style={{
                        fontFamily: fonts.bodyRegular,
                        fontSize: fontSizes.sm,
                        color: DEEP_FOREST,
                      }}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {parkType === option.value && (
                    <Ionicons name="checkmark" size={20} color={DEEP_FOREST} />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
