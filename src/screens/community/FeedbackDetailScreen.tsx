/**
 * Feedback Detail Screen
 * Shows feedback post with comments
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import * as Haptics from "expo-haptics";
import {
  getFeedbackPostById,
  getFeedbackComments,
  addFeedbackComment,
  upvoteFeedbackPost,
} from "../../services/feedbackService";
import { getUser } from "../../services/userService";
import { FeedbackPost, FeedbackComment } from "../../types/community";
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

type RouteParams = RootStackScreenProps<"FeedbackDetail">;

export default function FeedbackDetailScreen() {
  const route = useRoute<RouteParams["route"]>();
  const navigation = useNavigation<RouteParams["navigation"]>();
  const { postId } = route.params;
  const currentUser = useCurrentUser();

  const [post, setPost] = useState<FeedbackPost | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [postData, commentsData] = await Promise.all([
        getFeedbackPostById(postId),
        getFeedbackComments(postId),
      ]);

      if (!postData) {
        setError("Post not found");
        return;
      }

      setPost(postData);
      setComments(commentsData);

      // Load author info
      const author = await getUser(postData.authorId);
      if (author) {
        setAuthorName(author.displayName || author.handle);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!currentUser || !post) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await upvoteFeedbackPost(postId);
      setPost({ ...post, voteCount: post.voteCount + 1 });
    } catch (err) {
      // Silently fail
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser || !commentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await addFeedbackComment({
        feedbackId: postId,
        body: commentText.trim(),
        authorId: currentUser.id,
      });

      // Reload comments
      const updatedComments = await getFeedbackComments(postId);
      setComments(updatedComments);
      setCommentText("");

      // Update post comment count
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (err: any) {
      setError("Failed to submit comment");
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

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "#6b7280";
      case "planned": return "#3b82f6";
      case "in_progress": return "#f59e0b";
      case "done": return "#10b981";
      case "declined": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Open";
      case "planned": return "Planned";
      case "in_progress": return "In Progress";
      case "done": return "Done";
      case "declined": return "Declined";
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "feature": return "Feature Request";
      case "bug": return "Bug Report";
      case "improvement": return "Improvement";
      case "question": return "Question";
      case "other": return "Other";
      default: return category;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment">
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text className="mt-4" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
          Loading feedback...
        </Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Feedback" showTitle />
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
          <Text className="mt-4 text-center text-lg" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
            {error || "Post not found"}
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

  const statusColor = getStatusColor(post.status);
  const statusLabel = getStatusLabel(post.status);

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader title="Feedback" showTitle />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Post Card */}
          <View className="mx-5 mt-5 rounded-xl p-5 border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              <View className="px-3 py-1 rounded-full bg-amber-100">
                <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: "#92400e" }}>
                  {getCategoryLabel(post.category)}
                </Text>
              </View>
              <View className="px-3 py-1 rounded-md" style={{ backgroundColor: statusColor + "20" }}>
                <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: statusColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            <Text className="text-2xl mb-3" style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}>
              {post.title}
            </Text>

            <Text className="mb-4 leading-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
              {post.body}
            </Text>

            <View className="flex-row items-center justify-between pt-4 border-t" style={{ borderColor: BORDER_SOFT }}>
              <View>
                <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                  Posted by {authorName || "Anonymous"}
                </Text>
                <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                  {formatTimeAgo(post.createdAt)}
                </Text>
              </View>

              <Pressable
                onPress={handleUpvote}
                className="flex-row items-center px-3 py-2 rounded-lg bg-white border active:opacity-70"
                style={{ borderColor: BORDER_SOFT }}
              >
                <Ionicons name="arrow-up-circle" size={20} color={EARTH_GREEN} />
                <Text className="ml-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                  {post.voteCount}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Comments Section */}
          <View className="mx-5 mt-6">
            <Text className="text-xl mb-4" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
              {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
            </Text>

            {comments.length === 0 ? (
              <View className="rounded-xl p-6 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
                <Ionicons name="chatbubbles-outline" size={48} color={TEXT_MUTED} />
                <Text className="mt-3 text-center" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                  No comments yet. Share your thoughts!
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {comments.map((comment) => (
                  <View
                    key={comment.id}
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
                  >
                    <Text className="mb-3 leading-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                      {comment.body}
                    </Text>

                    <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                      {formatTimeAgo(comment.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Comment Input */}
          {currentUser && (
            <View className="mx-5 mt-6 mb-5">
              <Text className="text-lg mb-3" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
                Add Comment
              </Text>
              <View className="rounded-xl border" style={{ backgroundColor: "white", borderColor: BORDER_SOFT }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="p-4"
                  style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG, minHeight: 100 }}
                />
                <View className="flex-row justify-end p-3 border-t" style={{ borderColor: BORDER_SOFT }}>
                  <Pressable
                    onPress={handleSubmitComment}
                    disabled={!commentText.trim() || submitting}
                    className="px-6 py-3 rounded-xl active:opacity-90"
                    style={{
                      backgroundColor: commentText.trim() && !submitting ? DEEP_FOREST : "#d1d5db",
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
                        Post Comment
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
