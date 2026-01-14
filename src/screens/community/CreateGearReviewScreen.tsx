import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { RootStackNavigationProp } from "../../navigation/types";
import * as Haptics from "expo-haptics";

import { auth } from "../../config/firebase";
import { createGearReview } from "../../services/gearReviewsService";
import { useCurrentUser } from "../../state/userStore";
import { requireEmailVerification } from "../../utils/authHelper";
import { getUserHandleForUid } from "../../services/userHandleService";
import {
  BORDER_SOFT,
  CARD_BACKGROUND_LIGHT,
  DEEP_FOREST,
  PARCHMENT,
  TEXT_MUTED,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
} from "../../constants/colors";
import type { GearCategory } from "../../types/community";

const CATEGORIES: readonly {
  key: GearCategory;
  label: string;
  description: string;
}[] = [
  { key: "tent", label: "Tent", description: "Shelters & accessories" },
  { key: "sleep", label: "Sleep System", description: "Bags, pads, quilts" },
  { key: "kitchen", label: "Cooking", description: "Stoves, cookware, food" },
  { key: "pack", label: "Backpack", description: "Packs & storage" },
  { key: "lighting", label: "Lighting", description: "Headlamps, lanterns" },
  { key: "clothing", label: "Clothing", description: "Layers, footwear" },
  { key: "misc", label: "Other", description: "Anything else" },
];

const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)));

export default function CreateGearReviewScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();

  const [category, setCategory] = useState<GearCategory>("tent");
  const [gearName, setGearName] = useState("");
  const [brand, setBrand] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isFormValid = useMemo(
    () => Boolean(gearName.trim() && rating > 0 && summary.trim() && body.trim()),
    [gearName, rating, summary, body]
  );

  const canSubmit = useMemo(() => {
    return !submitting && isFormValid;
  }, [submitting, isFormValid]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.goBack();
  }, [navigation]);

  const setStarRating = useCallback((value: number) => {
    const next = clampInt(value, 0, 5);
    setRating(next);
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const normalizeTag = (raw: string) =>
    raw
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^[#]+/, "")
      .slice(0, 24);

  const handleAddTag = useCallback(() => {
    const next = normalizeTag(tagsInput);
    if (!next) return;

    setTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === next.toLowerCase());
      if (exists) return prev;
      if (prev.length >= 8) return prev;
      return [...prev, next];
    });

    setTagsInput("");
    Haptics.selectionAsync().catch(() => {});
  }, [tagsInput]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;

    const user = auth.currentUser;
    if (!user?.uid) {
      Alert.alert("Sign in required", "Please sign in to post a gear review.");
      return;
    }

    // Require email verification for posting content
    const isVerified = await requireEmailVerification("post gear reviews");
    if (!isVerified) return;

    const trimmedGearName = gearName.trim();
    const trimmedSummary = summary.trim();
    const trimmedBody = body.trim();
    const trimmedBrand = brand.trim();

    if (!trimmedGearName || !trimmedSummary || !trimmedBody || rating <= 0) {
      Alert.alert("Missing info", "Please fill out all required fields and select a rating.");
      return;
    }

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const authorHandle = await getUserHandleForUid(user.uid);
      await createGearReview({
        authorId: user.uid,
        authorHandle,
        category,
        gearName: trimmedGearName,
        brand: trimmedBrand || undefined,
        rating: clampInt(rating, 1, 5),
        summary: trimmedSummary,
        body: trimmedBody,
        tags,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Posted!", "Your gear review has been posted.");
      navigation.goBack();
    } catch (e) {
      console.error("[CreateGearReview] submit failed:", e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Couldn’t post", "Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    gearName,
    brand,
    rating,
    summary,
    body,
    tags,
    category,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: PARCHMENT }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 18,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: BORDER_SOFT,
          backgroundColor: PARCHMENT,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable onPress={handleClose} hitSlop={10} style={{ padding: 6 }}>
          <Ionicons name="close" size={26} color={DEEP_FOREST} />
        </Pressable>

        <Text style={{ fontFamily: "Raleway_700Bold", fontSize: 16, color: TEXT_PRIMARY_STRONG }}>
          New Gear Review
        </Text>

        {/* Spacer to balance the close button */}
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Category */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginBottom: 10 }}>
          Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
          {CATEGORIES.map((c) => {
            const active = c.key === category;
            return (
              <Pressable
                key={c.key}
                onPress={() => {
                  setCategory(c.key);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: active ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                  borderWidth: 1,
                  borderColor: active ? DEEP_FOREST : BORDER_SOFT,
                  minWidth: 150,
                }}
              >
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: active ? PARCHMENT : TEXT_PRIMARY_STRONG }}>
                  {c.label}
                </Text>
                <Text style={{ marginTop: 2, fontFamily: "SourceSans3_400Regular", color: active ? PARCHMENT : TEXT_SECONDARY, fontSize: 12 }}>
                  {c.description}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Gear name */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginTop: 8, marginBottom: 8 }}>
          Gear name <Text style={{ color: "#dc2626" }}>*</Text>
        </Text>
        <TextInput
          value={gearName}
          onChangeText={setGearName}
          placeholder="e.g., Big Agnes Copper Spur HV UL2"
          placeholderTextColor={TEXT_MUTED}
          style={{
            backgroundColor: CARD_BACKGROUND_LIGHT,
            borderWidth: 1,
            borderColor: BORDER_SOFT,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "SourceSans3_400Regular",
            color: TEXT_PRIMARY_STRONG,
          }}
          maxLength={80}
          returnKeyType="next"
        />

        {/* Brand */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginTop: 14, marginBottom: 8 }}>
          Brand (optional)
        </Text>
        <TextInput
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g., Big Agnes"
          placeholderTextColor={TEXT_MUTED}
          style={{
            backgroundColor: CARD_BACKGROUND_LIGHT,
            borderWidth: 1,
            borderColor: BORDER_SOFT,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "SourceSans3_400Regular",
            color: TEXT_PRIMARY_STRONG,
          }}
          maxLength={40}
          returnKeyType="next"
        />

        {/* Rating */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginTop: 14, marginBottom: 8 }}>
          Rating <Text style={{ color: "#dc2626" }}>*</Text>
        </Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 6 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setStarRating(i)} hitSlop={8}>
              <Ionicons name={rating >= i ? "star" : "star-outline"} size={30} color={rating >= i ? "#d4a017" : TEXT_MUTED} />
            </Pressable>
          ))}
          <Text style={{ marginLeft: 6, fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}>
            {rating > 0 ? `${rating}/5` : "Select"}
          </Text>
        </View>

        {/* Summary */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginTop: 10, marginBottom: 8 }}>
          Summary <Text style={{ color: "#dc2626" }}>*</Text>
        </Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="One sentence takeaway"
          placeholderTextColor={TEXT_MUTED}
          style={{
            backgroundColor: CARD_BACKGROUND_LIGHT,
            borderWidth: 1,
            borderColor: BORDER_SOFT,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "SourceSans3_400Regular",
            color: TEXT_PRIMARY_STRONG,
          }}
          maxLength={140}
        />

        {/* Body */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginTop: 14, marginBottom: 8 }}>
          Full review <Text style={{ color: "#dc2626" }}>*</Text>
        </Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What did you like/dislike? Conditions used? Who is it for?"
          placeholderTextColor={TEXT_MUTED}
          multiline
          textAlignVertical="top"
          style={{
            backgroundColor: CARD_BACKGROUND_LIGHT,
            borderWidth: 1,
            borderColor: BORDER_SOFT,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "SourceSans3_400Regular",
            color: TEXT_PRIMARY_STRONG,
            minHeight: 140,
          }}
          maxLength={2000}
        />

        {/* Tags */}
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, marginTop: 14, marginBottom: 8 }}>
          Tags (optional)
        </Text>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput
            value={tagsInput}
            onChangeText={setTagsInput}
            placeholder="Add a tag (e.g., ultralight)"
            placeholderTextColor={TEXT_MUTED}
            style={{
              flex: 1,
              backgroundColor: CARD_BACKGROUND_LIGHT,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: "SourceSans3_400Regular",
              color: TEXT_PRIMARY_STRONG,
            }}
            maxLength={24}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddTag}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: DEEP_FOREST,
            }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>Add</Text>
          </Pressable>
        </View>

        {tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {tags.map((t) => (
              <Pressable
                key={t}
                onPress={() => handleRemoveTag(t)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: CARD_BACKGROUND_LIGHT,
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                }}
              >
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>#{t}</Text>
                <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={{ marginTop: 10, fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED, fontSize: 12 }}>
          Tip: tap a tag to remove it.
        </Text>
      </ScrollView>

      {/* Bottom Post Button */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: BORDER_SOFT,
          backgroundColor: PARCHMENT,
        }}
      >
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: canSubmit ? DEEP_FOREST : BORDER_SOFT,
            opacity: submitting ? 0.85 : 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {submitting ? <ActivityIndicator color={PARCHMENT} /> : null}
          <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 16, color: PARCHMENT }}>
            {submitting ? "Posting…" : "Post Review"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
