/**
 * Create Gear Review Screen
 * Form for creating a new gear review with star rating
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import * as Haptics from "expo-haptics";
import { createGearReview } from "../../services/gearReviewsService";
import { useCurrentUser } from "../../state/userStore";
import { RootStackNavigationProp } from "../../navigation/types";
import { GearCategory } from "../../types/community";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";

const CATEGORIES: { value: GearCategory; label: string }[] = [
  { value: "shelter", label: "Shelter" },
  { value: "sleep", label: "Sleep System" },
  { value: "kitchen", label: "Kitchen" },
  { value: "clothing", label: "Clothing" },
  { value: "lighting", label: "Lighting" },
  { value: "pack", label: "Backpacks" },
  { value: "water", label: "Water" },
  { value: "safety", label: "Safety" },
  { value: "misc", label: "Other" },
];

export default function CreateGearReviewScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useCurrentUser();

  const [gearName, setGearName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<GearCategory>("misc");
  const [rating, setRating] = useState(0);
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert("Error", "Please sign in to create reviews");
      return;
    }

    if (!gearName.trim()) {
      Alert.alert("Missing Information", "Please enter the gear name");
      return;
    }

    if (rating === 0) {
      Alert.alert("Missing Rating", "Please select a star rating");
      return;
    }

    if (!summary.trim()) {
      Alert.alert("Missing Summary", "Please enter a brief summary");
      return;
    }

    if (!body.trim()) {
      Alert.alert("Missing Review", "Please enter your full review");
      return;
    }

    try {
      setSubmitting(true);
      const reviewId = await createGearReview({
        gearName: gearName.trim(),
        brand: brand.trim() || undefined,
        category,
        rating,
        summary: summary.trim(),
        body: body.trim(),
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        tags,
        authorId: currentUser.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("GearReviewDetail", { reviewId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create review");
      setSubmitting(false);
    }
  };

  const renderStarSelector = () => {
    return (
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              setRating(star);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="mr-2 active:opacity-70"
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={36}
              color="#F59E0B"
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const isFormValid = gearName.trim() && rating > 0 && summary.trim() && body.trim();

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader
        title="Review Gear"
        showTitle
        rightAction={{
          icon: "checkmark",
          onPress: handleSubmit
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-5">
          {/* Gear Name */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Gear Name *
            </Text>
            <TextInput
              value={gearName}
              onChangeText={setGearName}
              placeholder="e.g., MSR Hubba Hubba NX 2"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 16,
              }}
              maxLength={100}
            />
          </View>

          {/* Brand */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Brand (Optional)
            </Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., MSR"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 16,
              }}
              maxLength={50}
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Category *
            </Text>
            <Pressable
              onPress={() => {
                setShowCategoryPicker(!showCategoryPicker);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="px-4 py-3 rounded-xl border flex-row items-center justify-between"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
              }}
            >
              <Text
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  color: TEXT_PRIMARY_STRONG,
                  fontSize: 16,
                  textTransform: "capitalize",
                }}
              >
                {CATEGORIES.find((c) => c.value === category)?.label || "Select Category"}
              </Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={TEXT_MUTED}
              />
            </Pressable>

            {showCategoryPicker && (
              <View className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: BORDER_SOFT }}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.value}
                    onPress={() => {
                      setCategory(cat.value);
                      setShowCategoryPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="px-4 py-3 border-b active:opacity-70"
                    style={{
                      backgroundColor: category === cat.value ? "#E0F2F1" : CARD_BACKGROUND_LIGHT,
                      borderColor: BORDER_SOFT,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        color: category === cat.value ? "#00695C" : TEXT_PRIMARY_STRONG,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Rating */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Rating *
            </Text>
            {renderStarSelector()}
            {rating > 0 && (
              <Text
                className="mt-2 text-sm"
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  color: TEXT_SECONDARY,
                }}
              >
                {rating} out of 5 stars
              </Text>
            )}
          </View>

          {/* Summary */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Quick Summary *
            </Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder="Brief one-liner about this gear"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 16,
              }}
              maxLength={150}
            />
            <Text
              className="text-xs mt-1"
              style={{
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_MUTED,
              }}
            >
              {summary.length}/150
            </Text>
          </View>

          {/* Full Review */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Full Review *
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share your detailed experience with this gear..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 16,
                minHeight: 150,
              }}
              maxLength={1000}
            />
            <Text
              className="text-xs mt-1"
              style={{
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_MUTED,
              }}
            >
              {body.length}/1000
            </Text>
          </View>

          {/* Pros */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Pros (Optional)
            </Text>
            <TextInput
              value={pros}
              onChangeText={setPros}
              placeholder="What did you like about this gear?"
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 16,
                minHeight: 80,
              }}
              maxLength={300}
            />
          </View>

          {/* Cons */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Cons (Optional)
            </Text>
            <TextInput
              value={cons}
              onChangeText={setCons}
              placeholder="Any downsides or issues?"
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 16,
                minHeight: 80,
              }}
              maxLength={300}
            />
          </View>

          {/* Tags */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
              }}
            >
              Tags (Optional)
            </Text>
            <View className="flex-row items-center mb-2">
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag"
                placeholderTextColor={TEXT_MUTED}
                className="flex-1 px-4 py-3 rounded-xl border mr-2"
                style={{
                  backgroundColor: CARD_BACKGROUND_LIGHT,
                  borderColor: BORDER_SOFT,
                  fontFamily: "SourceSans3_400Regular",
                  color: TEXT_PRIMARY_STRONG,
                }}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                maxLength={20}
              />
              <Pressable
                onPress={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                className="px-4 py-3 rounded-xl active:opacity-70"
                style={{
                  backgroundColor:
                    tagInput.trim() && tags.length < 5 ? DEEP_FOREST : BORDER_SOFT,
                }}
              >
                <Ionicons name="add" size={20} color={PARCHMENT} />
              </Pressable>
            </View>

            {tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {tags.map((tag) => (
                  <View
                    key={tag}
                    className="flex-row items-center px-3 py-2 rounded-full bg-amber-100"
                  >
                    <Text
                      className="mr-2"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        color: "#92400e",
                      }}
                    >
                      {tag}
                    </Text>
                    <Pressable onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close-circle" size={18} color="#92400e" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !isFormValid}
            className="py-4 rounded-xl items-center mt-6 active:opacity-90"
            style={{
              backgroundColor: isFormValid ? DEEP_FOREST : BORDER_SOFT,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={PARCHMENT} />
            ) : (
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: PARCHMENT,
                }}
              >
                Publish Review
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
