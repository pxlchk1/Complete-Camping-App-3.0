import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MealCategory, PrepType, Difficulty } from "../types/meal";
import { DEEP_FOREST, EARTH_GREEN, PARCHMENT, RIVER_ROCK } from "../constants/colors";
import * as Haptics from "expo-haptics";

interface AddCustomMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: {
    name: string;
    category: MealCategory;
    prepType: PrepType;
    difficulty: Difficulty;
    ingredients: string[];
    instructions?: string;
    tags?: string[];
  }) => void;
}

export default function AddCustomMealModal({ visible, onClose, onSave }: AddCustomMealModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MealCategory>("breakfast");
  const [prepType, setPrepType] = useState<PrepType>("noCook");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tagsText, setTagsText] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    const ingredients = ingredientsText
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    onSave({
      name: name.trim(),
      category,
      prepType,
      difficulty,
      ingredients,
      instructions: instructions.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    // Reset form
    setName("");
    setCategory("breakfast");
    setPrepType("noCook");
    setDifficulty("easy");
    setIngredientsText("");
    setInstructions("");
    setTagsText("");

    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="bg-parchment rounded-t-3xl" style={{ maxHeight: "90%" }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-parchmentDark">
              <Text className="text-xl font-bold" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
                Add Custom Meal
              </Text>
              <Pressable onPress={handleClose} className="p-2 active:opacity-70">
                <Ionicons name="close" size={24} color={DEEP_FOREST} />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {/* Meal Name */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Meal Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., My Special Pancakes"
                  className="bg-white border border-parchmentDark rounded-xl px-4 py-3 text-base"
                  style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}
                  placeholderTextColor={RIVER_ROCK}
                />
              </View>

              {/* Category */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Category *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(["breakfast", "lunch", "dinner", "snack"] as MealCategory[]).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-full ${
                        category === cat ? "bg-forest" : "bg-white border border-parchmentDark"
                      } active:opacity-70`}
                    >
                      <Text
                        className="text-sm capitalize"
                        style={{
                          fontFamily: "SourceSans3_600SemiBold",
                          color: category === cat ? PARCHMENT : DEEP_FOREST,
                        }}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Prep Type */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Preparation Type *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(["noCook", "cold", "campStove", "campfire"] as PrepType[]).map((prep) => (
                    <Pressable
                      key={prep}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPrepType(prep);
                      }}
                      className={`px-4 py-2 rounded-full ${
                        prepType === prep ? "bg-forest" : "bg-white border border-parchmentDark"
                      } active:opacity-70`}
                    >
                      <Text
                        className="text-sm"
                        style={{
                          fontFamily: "SourceSans3_600SemiBold",
                          color: prepType === prep ? PARCHMENT : DEEP_FOREST,
                        }}
                      >
                        {prep === "noCook" ? "No Cook" : prep === "campStove" ? "Camp Stove" : prep === "campfire" ? "Campfire" : "Cold"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Difficulty */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Difficulty *
                </Text>
                <View className="flex-row gap-2">
                  {(["easy", "moderate"] as Difficulty[]).map((diff) => (
                    <Pressable
                      key={diff}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDifficulty(diff);
                      }}
                      className={`px-4 py-2 rounded-full ${
                        difficulty === diff ? "bg-forest" : "bg-white border border-parchmentDark"
                      } active:opacity-70`}
                    >
                      <Text
                        className="text-sm capitalize"
                        style={{
                          fontFamily: "SourceSans3_600SemiBold",
                          color: difficulty === diff ? PARCHMENT : DEEP_FOREST,
                        }}
                      >
                        {diff}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Ingredients */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Ingredients (one per line)
                </Text>
                <TextInput
                  value={ingredientsText}
                  onChangeText={setIngredientsText}
                  placeholder={"eggs\nmilk\nflour\nsalt"}
                  multiline
                  numberOfLines={4}
                  className="bg-white border border-parchmentDark rounded-xl px-4 py-3 text-base"
                  style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST, minHeight: 100, textAlignVertical: "top" }}
                  placeholderTextColor={RIVER_ROCK}
                />
              </View>

              {/* Instructions */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Instructions (optional)
                </Text>
                <TextInput
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="How to prepare this meal..."
                  multiline
                  numberOfLines={4}
                  className="bg-white border border-parchmentDark rounded-xl px-4 py-3 text-base"
                  style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST, minHeight: 100, textAlignVertical: "top" }}
                  placeholderTextColor={RIVER_ROCK}
                />
              </View>

              {/* Tags */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                  Tags (comma separated, optional)
                </Text>
                <TextInput
                  value={tagsText}
                  onChangeText={setTagsText}
                  placeholder="quick, healthy, kid-friendly"
                  className="bg-white border border-parchmentDark rounded-xl px-4 py-3 text-base"
                  style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}
                  placeholderTextColor={RIVER_ROCK}
                />
                <Text className="text-xs mt-1" style={{ fontFamily: "SourceSans3_400Regular", color: RIVER_ROCK }}>
                  Tags help you find and filter your meals
                </Text>
              </View>
            </ScrollView>

            {/* Save Button */}
            <View className="px-6 py-4 border-t border-parchmentDark">
              <Pressable
                onPress={handleSave}
                disabled={!name.trim()}
                className={`py-4 rounded-xl flex-row items-center justify-center ${
                  name.trim() ? "bg-forest active:opacity-90" : "bg-stone-300"
                }`}
              >
                <Ionicons name="checkmark-circle" size={20} color={PARCHMENT} />
                <Text className="text-base font-semibold ml-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
                  Save Custom Meal
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
