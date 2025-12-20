/**
 * Photo Detail Screen
 * Shows full-size photo with caption and basic comments UI
 *
 * FIXES INCLUDED:
 * - Wraps everything in a proper component (no top-level hooks or returns).
 * - Removes broken/duplicated KeyboardAvoidingView markup.
 * - Removes undefined variables from old Story-based code (story, setStory, storyId, likeStory, addStoryComment, getStoryComments).
 * - Uses connectPhotos/{photoId} from Firestore and renders photo.imageUrl.
 * - Keeps a comment box UI (local-only for now) so the screen compiles and works.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import * as Haptics from "expo-haptics";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useCurrentUser } from "../../state/userStore";
import {
  DEEP_FOREST,
  PARCHMENT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
  EARTH_GREEN,
} from "../../constants/colors";

const { width } = Dimensions.get("window");

type RouteParams = { photoId: string };

export default function PhotoDetailScreen() {
  console.log("[PLAN_TRACE] Enter PhotoDetailScreen");

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { photoId } = (route.params || {}) as RouteParams;

  const currentUser = useCurrentUser();

  const [photo, setPhoto] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments UI (local only for now, kept to avoid undefined story/comment services)
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!photoId) {
      setError("Missing photo id");
      setLoading(false);
      return;
    }
    loadPhotoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  const loadPhotoData = async () => {
    try {
      setLoading(true);
      setError(null);

      const db = getFirestore();
      const photoRef = doc(db, "connectPhotos", photoId);
      const snap = await getDoc(photoRef);

      if (!snap.exists()) {
        setError("Photo not found");
        setPhoto(null);
        return;
      }

      setPhoto({ id: snap.id, ...snap.data() });
    } catch (err: any) {
      setError(err?.message || "Failed to load photo");
      setPhoto(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (submitting) return;
    if (!currentUser) {
      Alert.alert("Sign in required", "Please sign in to comment.");
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Placeholder: comment write not wired yet in provided codebase snippet.
      // Keeps UI responsive and avoids crashing build.
      setCommentText("");
      Alert.alert("Posted", "Comment posting is not wired yet in this build.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment">
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text
          className="mt-4"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          Loading photo...
        </Text>
      </View>
    );
  }

  if (error || !photo) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Photo" showTitle />
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
          <Text
            className="mt-4 text-center text-lg"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
          >
            {error || "Photo not found"}
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader title="Photo" showTitle />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Photo */}
          <View style={{ backgroundColor: "#000" }}>
            {photo.imageUrl ? (
              <Image
                source={{ uri: photo.imageUrl }}
                style={{ width, height: width, backgroundColor: "#111827" }}
                resizeMode="contain"
                onError={() => console.log("Image unavailable:", photo.imageUrl)}
              />
            ) : (
              <View className="items-center justify-center bg-gray-100" style={{ width, height: width }}>
                <Ionicons name="image" size={48} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, fontFamily: "SourceSans3_400Regular" }}>
                  Image unavailable
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="px-5 py-4">
            {!!photo.locationName && (
              <View className="flex-row items-center mb-3">
                <Ionicons name="location" size={16} color={EARTH_GREEN} />
                <Text
                  className="ml-1"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  {photo.locationName}
                </Text>
              </View>
            )}

            {!!photo.caption && (
              <Text
                className="mb-4 leading-6"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                {photo.caption}
              </Text>
            )}

            {Array.isArray(photo.tags) && photo.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {photo.tags.map((tag: string, idx: number) => (
                  <View key={`${tag}-${idx}`} className="px-3 py-1 rounded-full bg-green-100">
                    <Text
                      className="text-xs"
                      style={{ fontFamily: "SourceSans3_600SemiBold", color: "#166534" }}
                    >
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text
              className="text-xs mb-2"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}
            >
              Posted by {photo.displayName || "Anonymous"}
            </Text>
          </View>

          {/* Comment box (local placeholder) */}
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#fff",
            }}
          >
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                padding: 16,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                minHeight: 96,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 12, borderTopWidth: 1, borderColor: BORDER_SOFT }}>
              <Pressable
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: commentText.trim() && !submitting ? DEEP_FOREST : "#d1d5db",
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>Post</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
