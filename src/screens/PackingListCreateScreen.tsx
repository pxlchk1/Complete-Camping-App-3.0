/**
 * Packing List Create Screen
 * Swipeable screen for creating new packing lists
 * Collects: name, trip type, season, and templates
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  BORDER_SOFT,
} from "../constants/colors";
import {
  PACKING_TEMPLATES,
} from "../constants/packingTemplatesV2";
import {
  usePackingStore,
  TripType,
  Season,
  PackingTemplateKey,
} from "../state/packingStore";
import { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "PackingListCreate">;

export default function PackingListCreateScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { createPackingList } = usePackingStore();
  
  // Get params from route (if navigating from a trip)
  const tripId = route.params?.tripId;
  const tripName = route.params?.tripName;
  const inheritedSeason = route.params?.inheritedSeason;
  const inheritedTripType = route.params?.inheritedTripType;

  // Form state - pre-fill with trip name if available
  const [listName, setListName] = useState(tripName ? `${tripName} Packing List` : "");
  // Use inherited values from trip, or fall back to defaults
  const tripType: TripType = inheritedTripType ?? "weekend";
  const season: Season = inheritedSeason ?? "summer";
  const [selectedTemplates, setSelectedTemplates] = useState<Set<PackingTemplateKey>>(
    new Set(["essential"])
  );

  const handleToggleTemplate = (key: PackingTemplateKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCreate = useCallback(() => {
    if (!listName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const templateKeys = Array.from(selectedTemplates);
    const listId = createPackingList(listName.trim(), tripType, season, templateKeys, tripId, false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to the editor
    navigation.replace("PackingListEditor" as any, { listId });
  }, [listName, tripType, season, selectedTemplates, tripId, createPackingList, navigation]);

  const canCreate = listName.trim().length > 0;

  return (
    <View className="flex-1 bg-parchment">
      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: DEEP_FOREST }}>
        <View
          style={{
            paddingTop: 8,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: DEEP_FOREST,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Ionicons name="arrow-back" size={20} color={PARCHMENT} />
            </Pressable>

            <Text
              style={{
                fontFamily: "Raleway_700Bold",
                fontSize: 18,
                color: PARCHMENT,
              }}
            >
              New Packing List
            </Text>

            <View style={{ width: 36 }} />
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* List Name */}
          <View className="px-4 pt-5">
            <Text
              className="text-xs mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN }}
            >
              LIST NAME
            </Text>
            <TextInput
              value={listName}
              onChangeText={setListName}
              placeholder="e.g., Yosemite Weekend Trip"
              placeholderTextColor="#999"
              className="bg-white rounded-xl px-4 py-3"
              style={{
                fontFamily: "SourceSans3_400Regular",
                fontSize: 16,
                color: DEEP_FOREST,
                borderWidth: 1,
                borderColor: BORDER_SOFT,
              }}
            />
          </View>

          {/* Templates */}
          <View className="px-4 pt-5">
            <Text
              className="text-xs mb-1"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN }}
            >
              QUICK TEMPLATES
            </Text>
            <Text
              className="text-xs mb-3"
              style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
            >
              Select templates to pre-populate your list
            </Text>

            <View style={{ gap: 10 }}>
              {PACKING_TEMPLATES.map((template) => {
                const isSelected = selectedTemplates.has(template.key);
                return (
                  <Pressable
                    key={template.key}
                    onPress={() => handleToggleTemplate(template.key)}
                    className="flex-row items-center bg-white rounded-xl p-4"
                    style={{
                      borderWidth: 2,
                      borderColor: isSelected ? DEEP_FOREST : BORDER_SOFT,
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor: isSelected ? DEEP_FOREST : "#F4F2EC",
                      }}
                    >
                      <Ionicons
                        name={template.icon as any}
                        size={20}
                        color={isSelected ? PARCHMENT : DEEP_FOREST}
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-base"
                        style={{ fontFamily: "Raleway_700Bold", color: DEEP_FOREST }}
                      >
                        {template.name}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                      >
                        {template.items.length} items • {template.description}
                      </Text>
                    </View>

                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? DEEP_FOREST : "#F4F2EC",
                        borderWidth: isSelected ? 0 : 2,
                        borderColor: BORDER_SOFT,
                      }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={PARCHMENT} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Button */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: PARCHMENT }}>
        <View className="px-4 py-3" style={{ borderTopWidth: 1, borderColor: BORDER_SOFT }}>
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate}
            className="py-4 rounded-xl items-center"
            style={{
              backgroundColor: canCreate ? DEEP_FOREST : "#E6E1D6",
            }}
          >
            <Text
              style={{
                fontFamily: "SourceSans3_700Bold",
                fontSize: 16,
                color: canCreate ? PARCHMENT : "#999",
              }}
            >
              Create Packing List
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
