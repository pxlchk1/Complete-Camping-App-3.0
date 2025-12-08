/**
 * Meal Planning Screen - Plan meals for a specific trip
 * Day-by-day meal planning with breakfast, lunch, dinner, and snacks
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTripsStore } from "../state/tripsStore";
import { useMealLibrary } from "../state/mealStore";
import AccountButton from "../components/AccountButton";
import { RootStackParamList } from "../navigation/types";
import { Meal, MealCategory, MealLibraryItem, PrepType } from "../types/meal";
import * as MealService from "../services/mealsService";
import * as LocalMealService from "../services/localMealService";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  PARCHMENT_BORDER,
} from "../constants/colors";

type MealPlanningScreenRouteProp = RouteProp<RootStackParamList, "MealPlanning">;
type MealPlanningScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MealPlanning"
>;

const MEAL_CATEGORIES: { key: MealCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "breakfast", label: "Breakfast", icon: "sunny" },
  { key: "lunch", label: "Lunch", icon: "restaurant" },
  { key: "dinner", label: "Dinner", icon: "moon" },
  { key: "snack", label: "Snacks", icon: "ice-cream" },
];

export default function MealPlanningScreen() {
  const navigation = useNavigation<MealPlanningScreenNavigationProp>();
  const route = useRoute<MealPlanningScreenRouteProp>();
  const { tripId } = route.params;

  const trip = useTripsStore((s) => s.getTripById(tripId));
  const mealLibrary = useMealLibrary();
  const userId = "demo_user_1"; // TODO: Get from auth

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomMealForm, setShowCustomMealForm] = useState(false);

  // Custom meal form state
  const [customMealName, setCustomMealName] = useState("");
  const [customMealIngredients, setCustomMealIngredients] = useState("");
  const [customMealInstructions, setCustomMealInstructions] = useState("");

  // Calculate number of days
  const tripDays = trip
    ? Math.ceil(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 1;

  // Load meals for trip
  const loadMeals = useCallback(async () => {
    if (!trip) return;

    setLoading(true);
    try {
      if (!useLocalStorage) {
        try {
          const tripMeals = await MealService.getTripMeals(userId, tripId);
          setMeals(tripMeals);
          return;
        } catch (fbError: any) {
          if (fbError?.code === 'permission-denied' || fbError?.message?.includes('permission')) {
            console.log("Using local storage for meals");
          }
          setUseLocalStorage(true);
        }
      }

      const tripMeals = await LocalMealService.getTripMeals(tripId);
      setMeals(tripMeals);
    } catch (error) {
      console.error("Failed to load meals:", error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [tripId, trip, userId, useLocalStorage]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const handleAddMealFromLibrary = async (libraryMeal: MealLibraryItem) => {
    try {
      const mealData = {
        name: libraryMeal.name,
        category: selectedCategory,
        dayIndex: selectedDay,
        sourceType: "library" as const,
        libraryId: libraryMeal.id,
        prepType: libraryMeal.prepType,
        ingredients: libraryMeal.ingredients,
        notes: libraryMeal.instructions || undefined,
      };

      let mealId: string;
      if (useLocalStorage) {
        mealId = await LocalMealService.addMeal(tripId, mealData);
      } else {
        try {
          mealId = await MealService.addMeal(userId, tripId, mealData);
        } catch (fbError: any) {
          if (fbError?.code === 'permission-denied' || fbError?.message?.includes('permission')) {
            setUseLocalStorage(true);
            mealId = await LocalMealService.addMeal(tripId, mealData);
          } else {
            throw fbError;
          }
        }
      }

      await loadMeals();
      setShowAddMeal(false);
      setSearchQuery("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to add meal:", error);
    }
  };

  const handleAddCustomMeal = async () => {
    if (!customMealName.trim()) return;

    try {
      const ingredients = customMealIngredients
        .split("\n")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const mealData = {
        name: customMealName.trim(),
        category: selectedCategory,
        dayIndex: selectedDay,
        sourceType: "custom" as const,
        prepType: "noCook" as PrepType,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
        notes: customMealInstructions.trim() || undefined,
      };

      let mealId: string;
      if (useLocalStorage) {
        mealId = await LocalMealService.addMeal(tripId, mealData);
      } else {
        try {
          mealId = await MealService.addMeal(userId, tripId, mealData);
        } catch (fbError: any) {
          if (fbError?.code === 'permission-denied' || fbError?.message?.includes('permission')) {
            setUseLocalStorage(true);
            mealId = await LocalMealService.addMeal(tripId, mealData);
          } else {
            throw fbError;
          }
        }
      }

      await loadMeals();

      // Reset form and close
      setCustomMealName("");
      setCustomMealIngredients("");
      setCustomMealInstructions("");
      setShowCustomMealForm(false);
      setShowAddMeal(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to add custom meal:", error);
    }
  };

  const handleDeleteMeal = async (meal: Meal) => {
    try {
      if (useLocalStorage) {
        await LocalMealService.deleteMeal(tripId, meal.id);
      } else {
        try {
          await MealService.deleteMeal(userId, tripId, meal.id);
        } catch (fbError: any) {
          if (fbError?.code === 'permission-denied' || fbError?.message?.includes('permission')) {
            setUseLocalStorage(true);
            await LocalMealService.deleteMeal(tripId, meal.id);
          } else {
            throw fbError;
          }
        }
      }

      await loadMeals();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to delete meal:", error);
    }
  };

  if (!trip) {
    return null;
  }

  // Filter meals for current day
  const dayMeals = meals.filter((m) => m.dayIndex === selectedDay);

  // Filter library meals for modal
  const filteredLibrary = mealLibrary.filter((meal) => {
    if (meal.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        meal.name.toLowerCase().includes(query) ||
        meal.ingredients.some((ing) => ing.toLowerCase().includes(query)) ||
        meal.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-parchmentDark">
        <View className="flex-row items-center mb-2 justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-2 active:opacity-70"
            >
              <Ionicons name="arrow-back" size={24} color={DEEP_FOREST} />
            </Pressable>
            <Text
              className="text-xl font-bold flex-1"
              style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
            >
              Meal Planning
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => navigation.navigate("ShoppingList", { tripId })}
              className="bg-forest rounded-full px-4 py-2 flex-row items-center active:opacity-90"
            >
              <Ionicons name="cart" size={18} color={PARCHMENT} />
              <Text
                className="text-white ml-1.5 text-sm"
                style={{ fontFamily: "SourceSans3_600SemiBold" }}
              >
                Shopping
              </Text>
            </Pressable>
            <AccountButton />
          </View>
        </View>
        <Text
          className="text-sm"
          style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
        >
          For: {trip.name}
        </Text>

        {/* Trip Duration */}
        <View className="mt-3 flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color={EARTH_GREEN} />
          <Text
            className="ml-2 text-sm"
            style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
          >
            {tripDays} {tripDays === 1 ? "day" : "days"}
          </Text>
        </View>
      </View>

      {/* Day Selector */}
      <View className="px-5 py-3 border-b border-parchmentDark">
        <Text
          className="text-xs mb-2"
          style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN }}
        >
          SELECT DAY
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {Array.from({ length: tripDays }, (_, i) => i + 1).map((day) => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl border ${
                selectedDay === day
                  ? "bg-forest border-forest"
                  : "bg-white border-stone-300"
              }`}
            >
              <Text
                className={selectedDay === day ? "text-white" : "text-forest"}
                style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14 }}
              >
                Day {day}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Meals List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      ) : (
        <ScrollView className="flex-1">
          {MEAL_CATEGORIES.map((category) => {
            const categoryMeals = dayMeals.filter((m) => m.category === category.key);

            return (
              <View key={category.key} className="px-5 mt-4">
                {/* Category Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name={category.icon} size={20} color={DEEP_FOREST} />
                    <Text
                      className="ml-2 text-base"
                      style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
                    >
                      {category.label}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedCategory(category.key);
                      setShowAddMeal(true);
                    }}
                    className="bg-forest rounded-full p-2 active:opacity-90"
                  >
                    <Ionicons name="add" size={16} color={PARCHMENT} />
                  </Pressable>
                </View>

                {/* Meals */}
                {categoryMeals.length === 0 ? (
                  <View className="bg-white rounded-xl p-4 mb-3 border border-stone-200">
                    <Text
                      className="text-center"
                      style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                    >
                      No {category.label.toLowerCase()} planned
                    </Text>
                  </View>
                ) : (
                  categoryMeals.map((meal) => (
                    <View
                      key={meal.id}
                      className="bg-white rounded-xl p-4 mb-3 border border-stone-200 flex-row items-center justify-between"
                    >
                      <View className="flex-1">
                        <Text
                          className="text-base mb-1"
                          style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                        >
                          {meal.name}
                        </Text>
                        {meal.notes && (
                          <Text
                            className="text-sm"
                            style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                            numberOfLines={2}
                          >
                            {meal.notes}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleDeleteMeal(meal)}
                        className="ml-2 p-2 active:opacity-70"
                      >
                        <Ionicons name="trash-outline" size={20} color="#dc2626" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMeal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddMeal(false)}
      >
        <View className="flex-1 bg-black/50">
          <SafeAreaView className="flex-1" edges={["bottom"]}>
            <View className="flex-1 mt-20">
              <View className="flex-1 bg-parchment rounded-t-2xl">
                {/* Modal Header */}
                <View className="p-5 pb-3 border-b border-parchmentDark flex-row items-center justify-between">
                  <Text
                    className="text-xl font-bold"
                    style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
                  >
                    Add {MEAL_CATEGORIES.find((c) => c.key === selectedCategory)?.label}
                  </Text>
                  <Pressable onPress={() => setShowAddMeal(false)} className="p-2">
                    <Ionicons name="close" size={28} color={DEEP_FOREST} />
                  </Pressable>
                </View>

                {/* Search */}
                <View className="px-5 pt-3 pb-2">
                  <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-stone-200">
                    <Ionicons name="search" size={20} color={EARTH_GREEN} />
                    <TextInput
                      className="flex-1 ml-2 text-forest"
                      style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16 }}
                      placeholder="Search meals..."
                      placeholderTextColor="#999"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color={EARTH_GREEN} />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Create Custom Meal Button */}
                <View className="px-5 pb-3">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCustomMealForm(true);
                    }}
                    className="bg-granite rounded-xl py-3 flex-row items-center justify-center active:opacity-90"
                    style={{ backgroundColor: GRANITE_GOLD }}
                  >
                    <Ionicons name="create-outline" size={20} color={PARCHMENT} />
                    <Text
                      className="ml-2"
                      style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                    >
                      Create Custom Meal
                    </Text>
                  </Pressable>
                </View>

                {/* Meal Library List */}
                <ScrollView className="flex-1 px-5">
                  {!showCustomMealForm && filteredLibrary.map((meal) => (
                    <Pressable
                      key={meal.id}
                      onPress={() => handleAddMealFromLibrary(meal)}
                      className="bg-white rounded-xl p-4 mb-3 border border-stone-200 active:bg-stone-50"
                    >
                      <Text
                        className="text-base mb-1"
                        style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                      >
                        {meal.name}
                      </Text>
                      {meal.tags && meal.tags.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {meal.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} className="px-2 py-0.5 rounded bg-stone-100">
                              <Text
                                className="text-xs"
                                style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                              >
                                {tag}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  ))}

                  {!showCustomMealForm && filteredLibrary.length === 0 && (
                    <View className="items-center justify-center py-12">
                      <Ionicons name="search-outline" size={48} color={EARTH_GREEN} />
                      <Text
                        className="text-center mt-4"
                        style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                      >
                        No meals found
                      </Text>
                    </View>
                  )}

                  {/* Custom Meal Form */}
                  {showCustomMealForm && (
                    <View className="pb-6">
                      <View className="mb-4">
                        <Text
                          className="text-sm mb-2"
                          style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                        >
                          Meal Name *
                        </Text>
                        <TextInput
                          value={customMealName}
                          onChangeText={setCustomMealName}
                          placeholder="Enter meal name"
                          className="bg-white border border-stone-200 rounded-xl px-4 py-3"
                          style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}
                          placeholderTextColor="#999"
                        />
                      </View>

                      <View className="mb-4">
                        <Text
                          className="text-sm mb-2"
                          style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                        >
                          Ingredients (optional)
                        </Text>
                        <Text
                          className="text-xs mb-2"
                          style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                        >
                          One ingredient per line
                        </Text>
                        <TextInput
                          value={customMealIngredients}
                          onChangeText={setCustomMealIngredients}
                          placeholder={"Example:\nBread\nPeanut butter\nJelly"}
                          multiline
                          numberOfLines={4}
                          className="bg-white border border-stone-200 rounded-xl px-4 py-3"
                          style={{
                            fontFamily: "SourceSans3_400Regular",
                            color: DEEP_FOREST,
                            textAlignVertical: "top"
                          }}
                          placeholderTextColor="#999"
                        />
                      </View>

                      <View className="mb-6">
                        <Text
                          className="text-sm mb-2"
                          style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                        >
                          Instructions (optional)
                        </Text>
                        <TextInput
                          value={customMealInstructions}
                          onChangeText={setCustomMealInstructions}
                          placeholder="Enter preparation instructions"
                          multiline
                          numberOfLines={3}
                          className="bg-white border border-stone-200 rounded-xl px-4 py-3"
                          style={{
                            fontFamily: "SourceSans3_400Regular",
                            color: DEEP_FOREST,
                            textAlignVertical: "top"
                          }}
                          placeholderTextColor="#999"
                        />
                      </View>

                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => {
                            setShowCustomMealForm(false);
                            setCustomMealName("");
                            setCustomMealIngredients("");
                            setCustomMealInstructions("");
                          }}
                          className="flex-1 border border-stone-300 rounded-xl py-3 active:opacity-70"
                        >
                          <Text
                            className="text-center"
                            style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                          >
                            Cancel
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleAddCustomMeal}
                          disabled={!customMealName.trim()}
                          className={`flex-1 rounded-xl py-3 ${
                            customMealName.trim() ? "active:opacity-90" : "opacity-50"
                          }`}
                          style={{ backgroundColor: DEEP_FOREST }}
                        >
                          <Text
                            className="text-center"
                            style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                          >
                            Add Meal
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
