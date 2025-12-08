/**
 * Shopping List Screen - Aggregated ingredients from all trip meals
 * Automatically generates a shopping list from planned meals
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTripsStore } from "../state/tripsStore";
import AccountButton from "../components/AccountButton";
import { RootStackParamList } from "../navigation/types";
import { Meal } from "../types/meal";
import * as MealService from "../services/mealsService";
import * as LocalMealService from "../services/localMealService";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
} from "../constants/colors";

type ShoppingListScreenRouteProp = RouteProp<RootStackParamList, "ShoppingList">;
type ShoppingListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ShoppingList"
>;

interface IngredientItem {
  name: string;
  checked: boolean;
  mealNames: string[]; // Which meals use this ingredient
}

export default function ShoppingListScreen() {
  const navigation = useNavigation<ShoppingListScreenNavigationProp>();
  const route = useRoute<ShoppingListScreenRouteProp>();
  const { tripId } = route.params;

  const trip = useTripsStore((s) => s.getTripById(tripId));
  const userId = "demo_user_1"; // TODO: Get from auth

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);

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
          if (fbError?.code === "permission-denied" || fbError?.message?.includes("permission")) {
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

  // Aggregate ingredients from all meals
  useEffect(() => {
    if (meals.length === 0) {
      setIngredients([]);
      return;
    }

    const ingredientMap = new Map<string, { mealNames: Set<string> }>();

    meals.forEach((meal) => {
      if (meal.ingredients && meal.ingredients.length > 0) {
        meal.ingredients.forEach((ingredient) => {
          const normalizedIngredient = ingredient.toLowerCase().trim();

          if (!ingredientMap.has(normalizedIngredient)) {
            ingredientMap.set(normalizedIngredient, {
              mealNames: new Set(),
            });
          }

          ingredientMap.get(normalizedIngredient)!.mealNames.add(meal.name);
        });
      }
    });

    // Convert to array and sort alphabetically
    const ingredientsList: IngredientItem[] = Array.from(ingredientMap.entries())
      .map(([name, data]) => ({
        name,
        checked: false,
        mealNames: Array.from(data.mealNames),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setIngredients(ingredientsList);
  }, [meals]);

  const toggleIngredient = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const checkedCount = ingredients.filter((i) => i.checked).length;
  const totalCount = ingredients.length;

  if (!trip) {
    return null;
  }

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
              Shopping List
            </Text>
          </View>
          <AccountButton />
        </View>
        <Text
          className="text-sm mb-3"
          style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
        >
          For: {trip.name}
        </Text>

        {/* Progress */}
        {totalCount > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-sm"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                Shopping Progress
              </Text>
              <Text
                className="text-sm"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                {checkedCount} / {totalCount}
              </Text>
            </View>
            <View className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-forest rounded-full"
                style={{
                  width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Shopping List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      ) : ingredients.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cart-outline" size={64} color={EARTH_GREEN} />
          <Text
            className="text-center mt-4 mb-2 text-lg"
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
          >
            No ingredients yet
          </Text>
          <Text
            className="text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
          >
            Add meals to your trip to generate a shopping list automatically
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-4">
          <Text
            className="text-xs mb-3"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN }}
          >
            {totalCount} {totalCount === 1 ? "INGREDIENT" : "INGREDIENTS"} NEEDED
          </Text>

          {ingredients.map((ingredient, index) => (
            <Pressable
              key={index}
              onPress={() => toggleIngredient(index)}
              className={`flex-row items-start p-4 mb-2 rounded-xl border active:opacity-70 ${
                ingredient.checked
                  ? "bg-stone-50 border-stone-300"
                  : "bg-white border-stone-200"
              }`}
            >
              {/* Checkbox */}
              <View className="mr-3 mt-0.5">
                <View
                  className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
                    ingredient.checked
                      ? "bg-forest border-forest"
                      : "bg-white border-stone-400"
                  }`}
                >
                  {ingredient.checked && (
                    <Ionicons name="checkmark" size={16} color={PARCHMENT} />
                  )}
                </View>
              </View>

              {/* Ingredient Info */}
              <View className="flex-1">
                <Text
                  className={`text-base mb-1 ${
                    ingredient.checked ? "line-through" : ""
                  }`}
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    color: ingredient.checked ? EARTH_GREEN : DEEP_FOREST,
                  }}
                >
                  {ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}
                </Text>

                {/* Show which meals use this ingredient */}
                {ingredient.mealNames.length > 0 && (
                  <Text
                    className="text-xs"
                    style={{
                      fontFamily: "SourceSans3_400Regular",
                      color: EARTH_GREEN,
                    }}
                  >
                    For: {ingredient.mealNames.join(", ")}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
