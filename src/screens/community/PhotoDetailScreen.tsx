/**
 * Photo Detail Screen
 * Shows full-size photo with caption, tags, and Helpful reaction
 *
 * Supports both legacy stories and new photoPosts format
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import VotePill from "../../components/VotePill";
import AccountRequiredModal from "../../components/AccountRequiredModal";
import { ContentActionsAffordance } from "../../components/contentActions";
import { requireEmailVerification } from "../../utils/authHelper";
import { isAdmin, isModerator, canModerateContent } from "../../services/userService";
import { User } from "../../types/user";
import * as Haptics from "expo-haptics";
import { getStoryById } from "../../services/storiesService";
import { getPhotoPostById, toggleHelpful, checkIfHelpful } from "../../services/photoPostsService";
import { Story } from "../../types/community";
import {
  PhotoPost,
  POST_TYPE_LABELS,
  POST_TYPE_COLORS,
  TRIP_STYLE_LABELS,
  DETAIL_TAG_LABELS,
  mapLegacyPostType,
} from "../../types/photoPost";
import { useCurrentUser } from "../../state/userStore";
import {
  DEEP_FOREST,
  PARCHMENT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
  EARTH_GREEN,
  CARD_BACKGROUND_LIGHT,
} from "../../constants/colors";

const { width } = Dimensions.get("window");

type RouteParams = { storyId: string; photoId?: string };

export default function PhotoDetailScreen() {
  console.log("[PLAN_TRACE] Enter PhotoDetailScreen");

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { storyId, photoId } = (route.params || {}) as RouteParams;
  const postId = storyId || photoId;

  const currentUser = useCurrentUser();
  const [showAccountRequired, setShowAccountRequired] = useState(false);

  // Permission checks for content actions
  const canModerate = currentUser ? canModerateContent(currentUser as User) : false;
  const roleLabel = currentUser 
    ? isAdmin(currentUser as User) 
      ? "ADMIN" as const
      : isModerator(currentUser as User) 
        ? "MOD" as const 
        : null 
    : null;

  // Content action handlers
  const handleDeletePhoto = async () => {
    navigation.goBack();
  };

  const handleRemovePhoto = async () => {
    navigation.goBack();
  };

  // Support both legacy Story and new PhotoPost
  const [photo, setPhoto] = useState<Story | null>(null);
  const [photoPost, setPhotoPost] = useState<PhotoPost | null>(null);
  const [isNewFormat, setIsNewFormat] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helpful state
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [helpfulLoading, setHelpfulLoading] = useState(false);

  // Comments UI (local only for now)
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) {
      setError("Missing photo id");
      setLoading(false);
      return;
    }
    loadPhotoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadPhotoData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try new photoPosts collection first
      const newPost = await getPhotoPostById(postId);
      
      if (newPost) {
        setPhotoPost(newPost);
        setIsNewFormat(true);
        setHelpfulCount(newPost.helpfulCount || 0);
        
        // Check if user has marked as helpful
        if (currentUser?.id) {
          const helpful = await checkIfHelpful(postId, currentUser.id);
          setIsHelpful(helpful);
        }
      } else {
        // Fall back to legacy stories
        const story = await getStoryById(postId);

        if (!story) {
          setError("Photo not found");
          setPhoto(null);
          return;
        }

        setPhoto(story);
        setIsNewFormat(false);
      }
    } catch (err: any) {
      console.error("Error loading photo:", err);
      setError(err?.message || "Failed to load photo");
      setPhoto(null);
      setPhotoPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHelpful = async () => {
    if (!currentUser?.id) {
      setShowAccountRequired(true);
      return;
    }
    if (helpfulLoading || !postId) return;

    setHelpfulLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    const wasHelpful = isHelpful;
    setIsHelpful(!wasHelpful);
    setHelpfulCount((prev) => prev + (wasHelpful ? -1 : 1));

    try {
      await toggleHelpful(postId, currentUser.id);
    } catch (err) {
      // Revert on error
      setIsHelpful(wasHelpful);
      setHelpfulCount((prev) => prev + (wasHelpful ? 1 : -1));
    } finally {
      setHelpfulLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (submitting) return;
    if (!currentUser) {
      Alert.alert("Sign in required", "Please sign in to comment.");
      return;
    }

    // Require email verification for posting comments
    const isVerified = await requireEmailVerification("comment on photos");
    if (!isVerified) return;

    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Placeholder: comment write not wired yet
      setCommentText("");
      Alert.alert("Posted", "Comment posting is not wired yet in this build.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render tag chips for new format posts
  const renderPostTags = () => {
    if (!photoPost) return null;
    
    const chips: { label: string; color: string }[] = [];
    
    // Post type - map legacy tip-or-fix to setup-ideas
    if (photoPost.postType) {
      const mappedType = mapLegacyPostType(photoPost.postType);
      chips.push({
        label: POST_TYPE_LABELS[mappedType] || "Photo",
        color: POST_TYPE_COLORS[mappedType] || DEEP_FOREST,
      });
    }
    
    // Trip style
    if (photoPost.tripStyle) {
      chips.push({
        label: TRIP_STYLE_LABELS[photoPost.tripStyle],
        color: EARTH_GREEN,
      });
    }
    
    // Detail tags
    if (photoPost.detailTags) {
      photoPost.detailTags.forEach((tag) => {
        chips.push({
          label: DETAIL_TAG_LABELS[tag],
          color: TEXT_SECONDARY,
        });
      });
    }

    if (chips.length === 0) return null;

    return (
      <View className="flex-row flex-wrap gap-2 mb-4">
        {chips.map((chip, idx) => (
          <View
            key={idx}
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: chip.color + "20" }}
          >
            <Text
              className="text-sm"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: chip.color }}
            >
              {chip.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Render location line for new format
  const renderLocationLine = () => {
    if (!photoPost?.campgroundName) return null;
    
    let locationText = photoPost.campgroundName;
    if (photoPost.campsiteNumber && !photoPost.hideCampsiteNumber) {
      locationText += ` • Site ${photoPost.campsiteNumber}`;
    }

    return (
      <View 
        className="flex-row items-center mb-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "#2563eb10", borderWidth: 1, borderColor: "#2563eb40" }}
      >
        <Ionicons name="location" size={18} color="#2563eb" />
        <Text
          className="ml-2 flex-1"
          style={{ fontFamily: "SourceSans3_600SemiBold", color: "#2563eb" }}
        >
          {locationText}
        </Text>
      </View>
    );
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

  if (error || (!photo && !photoPost)) {
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
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Get display data from either format
  const imageUrl = isNewFormat 
    ? photoPost?.photoUrls?.[0] 
    : photo?.imageUrl;
  const caption = isNewFormat ? photoPost?.caption : photo?.caption;
  const displayName = isNewFormat 
    ? photoPost?.displayName 
    : photo?.displayName || "Anonymous";
  const legacyTags = !isNewFormat && photo?.tags ? photo.tags : [];

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader title="Photo" showTitle />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {/* Photo */}
          <View style={{ backgroundColor: "#000" }}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width, height: width, backgroundColor: "#111827" }}
                resizeMode="contain"
                onError={() => console.log("Image unavailable:", imageUrl)}
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
            {/* Location line for new format */}
            {isNewFormat && renderLocationLine()}

            {/* Legacy location */}
            {!isNewFormat && photo?.locationName && (
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

            {/* Tags for new format */}
            {isNewFormat && renderPostTags()}

            {/* Caption */}
            {!!caption && (
              <Text
                className="mb-4 leading-6"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY, fontSize: 15 }}
              >
                {caption}
              </Text>
            )}

            {/* Legacy tags */}
            {legacyTags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {legacyTags.map((tag: string, idx: number) => (
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

            {/* Author and action row */}
            <View className="flex-row items-center justify-between py-3 border-t" style={{ borderColor: BORDER_SOFT }}>
              <Text className="text-sm flex-1" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                by {displayName}
              </Text>
              
              {/* Content actions */}
              <ContentActionsAffordance
                itemId={postId || ""}
                itemType="photo"
                createdByUserId={isNewFormat ? (photoPost?.userId || "") : (photo?.userId || "")}
                currentUserId={currentUser?.id}
                canModerate={canModerate}
                roleLabel={roleLabel}
                onRequestDelete={handleDeletePhoto}
                onRequestRemove={handleRemovePhoto}
                layout="cardHeader"
              />
              
              {isNewFormat ? (
                // Helpful button for new format
                <Pressable
                  onPress={handleToggleHelpful}
                  disabled={helpfulLoading}
                  className="flex-row items-center px-4 py-2 rounded-full active:opacity-80"
                  style={{
                    backgroundColor: isHelpful ? "#16a34a20" : CARD_BACKGROUND_LIGHT,
                    borderWidth: 1,
                    borderColor: isHelpful ? "#16a34a" : BORDER_SOFT,
                  }}
                >
                  <Ionicons
                    name={isHelpful ? "thumbs-up" : "thumbs-up-outline"}
                    size={18}
                    color={isHelpful ? "#16a34a" : TEXT_SECONDARY}
                  />
                  <Text
                    className="ml-2"
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      color: isHelpful ? "#16a34a" : TEXT_PRIMARY_STRONG,
                    }}
                  >
                    {helpfulCount > 0 ? `${helpfulCount} Helpful` : "Helpful"}
                  </Text>
                </Pressable>
              ) : (
                // Vote pill for legacy format
                <VotePill
                  collectionPath="stories"
                  itemId={postId || ""}
                  initialScore={(photo?.upvotes || 0) - (photo?.downvotes || 0)}
                  onRequireAccount={() => setShowAccountRequired(true)}
                />
              )}
            </View>
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
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
              onFocus={() => {
                if (!currentUser) {
                  Keyboard.dismiss();
                  setShowAccountRequired(true);
                }
              }}
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <AccountRequiredModal
        visible={showAccountRequired}
        onCreateAccount={() => {
          setShowAccountRequired(false);
          navigation.navigate("Paywall");
        }}
        onMaybeLater={() => setShowAccountRequired(false)}
      />
    </View>
  );
}
