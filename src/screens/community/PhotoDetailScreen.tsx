/**
 * Photo Detail Screen
 * Shows full-size photo with caption, likes, and comments
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import * as Haptics from "expo-haptics";
import {
  getStoryById,
  getStoryComments,
  addStoryComment,
  likeStory,
  checkIfLiked,
} from "../../services/storiesService";
import { getUser } from "../../services/userService";
import { Story, StoryComment } from "../../types/community";
import { useCurrentUser } from "../../state/userStore";
import { RootStackScreenProps } from "../../navigation/types";
import {
  DEEP_FOREST,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
  EARTH_GREEN,
} from "../../constants/colors";

const { width } = Dimensions.get("window");

type RouteParams = RootStackScreenProps<"PhotoDetail">;

export default function PhotoDetailScreen() {
  const route = useRoute<RouteParams["route"]>();
  const navigation = useNavigation<RouteParams["navigation"]>();
  const { storyId } = route.params;
  const currentUser = useCurrentUser();

  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);

  useEffect(() => {
    loadPhotoData();
  }, [storyId]);

  const loadPhotoData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [storyData, commentsData] = await Promise.all([
        getStoryById(storyId),
        getStoryComments(storyId),
      ]);

      if (!storyData) {
        setError("Photo not found");
        return;
      }

      setStory(storyData);
      setComments(commentsData);

      // Load author info
      const author = await getUser(storyData.authorId);
      if (author) {
        setAuthorName(author.displayName || author.handle);
      }

      // Check if current user liked
      if (currentUser) {
        const liked = await checkIfLiked(storyId, currentUser.id);
        setIsLiked(liked);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load photo");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !story) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setStory({
      ...story,
      likeCount: newIsLiked ? story.likeCount + 1 : story.likeCount - 1,
    });

    try {
      await likeStory(storyId, currentUser.id);
    } catch (err) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setStory({
        ...story,
        likeCount: !newIsLiked ? story.likeCount + 1 : story.likeCount - 1,
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser || !commentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await addStoryComment({
        storyId,
        body: commentText.trim(),
        authorId: currentUser.id,
      });

      // Reload comments
      const updatedComments = await getStoryComments(storyId);
      setComments(updatedComments);
      setCommentText("");

      // Update story comment count
      if (story) {
        setStory({ ...story, commentCount: story.commentCount + 1 });
      }
    } catch (err: any) {
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string | any) => {
    const now = new Date();
    const date = typeof dateString === "string" ? new Date(dateString) : dateString.toDate?.() || new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment">
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text className="mt-4" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
          Loading photo...
        </Text>
      </View>
    );
  }

  if (error || !story) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Photo" showTitle />
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
          <Text className="mt-4 text-center text-lg" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
            {error || "Photo not found"}
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
              Go Back
            </Text>
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
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Photo */}
          <View className="bg-black">
            <Image
              source={{ uri: story.imageUrl }}
              style={{ width, height: width, backgroundColor: "#1f2937" }}
              resizeMode="contain"
            />
          </View>

          {/* Info Section */}
          <View className="px-5 py-4">
            {/* Location */}
            {story.locationLabel && (
              <View className="flex-row items-center mb-3">
                <Ionicons name="location" size={16} color={EARTH_GREEN} />
                <Text className="ml-1" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                  {story.locationLabel}
                </Text>
              </View>
            )}

            {/* Caption */}
            <Text className="mb-4 leading-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
              {story.caption}
            </Text>

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {story.tags.map((tag, idx) => (
                  <View key={idx} className="px-3 py-1 rounded-full bg-green-100">
                    <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: "#166534" }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Like & Comment Bar */}
            <View className="flex-row items-center justify-between py-4 border-t border-b" style={{ borderColor: BORDER_SOFT }}>
              <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                Posted by {authorName || "Anonymous"}
              </Text>

              <View className="flex-row items-center gap-4">
                <Pressable
                  onPress={handleLike}
                  className="flex-row items-center active:opacity-70"
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={22}
                    color={isLiked ? "#dc2626" : TEXT_MUTED}
                  />
                  <Text className="ml-1" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                    {story.likeCount}
                  </Text>
                </Pressable>

                <View className="flex-row items-center">
                  <Ionicons name="chatbubble-outline" size={20} color={TEXT_MUTED} />
                  <Text className="ml-1" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                    {story.commentCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View className="px-5 mt-4">
            <Text className="text-lg mb-3" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
              Comments
            </Text>

            {comments.length === 0 ? (
              <View className="rounded-xl p-6 items-center border mb-4" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
                <Ionicons name="chatbubbles-outline" size={40} color={TEXT_MUTED} />
                <Text className="mt-2 text-center" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              <View className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <View
                    key={comment.id}
                    className="rounded-xl p-3 border"
                    style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
                  >
                    <Text className="mb-2" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                      {comment.body}
                    </Text>
                    <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                      {formatTimeAgo(comment.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Comment Input */}
            {currentUser && (
              <View className="rounded-xl border mb-5" style={{ backgroundColor: "white", borderColor: BORDER_SOFT }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="p-4"
                  style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }}
                />
                <View className="flex-row justify-end p-3 border-t" style={{ borderColor: BORDER_SOFT }}>
                  <Pressable
                    onPress={handleSubmitComment}
                    disabled={!commentText.trim() || submitting}
                    className="px-4 py-2 rounded-xl active:opacity-90"
                    style={{
                      backgroundColor: commentText.trim() && !submitting ? DEEP_FOREST : "#d1d5db",
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
                        Post
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
