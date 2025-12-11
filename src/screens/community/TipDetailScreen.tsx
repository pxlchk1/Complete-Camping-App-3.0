/**
 * Tip Detail Screen
 * Shows full tip with comments
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getTipById, upvoteTip, getTipComments, addTipComment } from "../../services/tipsService";
import { reportContent } from "../../services/contentReportsService";
import { Tip, TipComment } from "../../types/community";
import { useCurrentUser } from "../../state/userStore";
import { RootStackParamList, RootStackNavigationProp } from "../../navigation/types";
import ModalHeader from "../../components/ModalHeader";
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

export default function TipDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "TipDetail">>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { tipId } = route.params;
  const currentUser = useCurrentUser();

  const [tip, setTip] = useState<Tip | null>(null);
  const [comments, setComments] = useState<TipComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTip = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tipData, commentsData] = await Promise.all([
        getTipById(tipId),
        getTipComments(tipId),
      ]);

      if (!tipData) {
        setError("Tip not found");
        return;
      }

      setTip(tipData);
      setComments(commentsData);
    } catch (err: any) {
      setError(err.message || "Failed to load tip");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTip();
  }, [tipId]);

  const handleUpvote = async () => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to upvote tips");
      return;
    }

    try {
      await upvoteTip(tipId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Optimistic update
      if (tip) {
        setTip({ ...tip, upvoteCount: tip.upvoteCount + 1 });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upvote tip");
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to comment");
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      await addTipComment({
        tipId,
        body: commentText.trim(),
        authorId: currentUser.id,
        username: currentUser.handle || currentUser.displayName || 'Anonymous',
      });
      setCommentText("");
      await loadTip(); // Reload to get new comment
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = () => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to report content");
      return;
    }

    Alert.alert(
      "Report Tip",
      "Why are you reporting this tip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              await reportContent({
                targetType: "tip",
                targetId: tipId,
                reason: "User reported inappropriate content",
                reporterId: currentUser.id,
              });
              Alert.alert("Success", "Thank you for your report");
            } catch (error) {
              Alert.alert("Error", "Failed to submit report");
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Tip" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
          <Text className="mt-4" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
            Loading tip...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !tip) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Tip" showTitle />
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
          <Text
            className="mt-4 text-center text-lg"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
          >
            {error || "Tip not found"}
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
      <ModalHeader
        rightAction={{
          icon: "flag-outline",
          onPress: handleReport,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >

        <ScrollView className="flex-1">
          {/* Tip Content */}
          <View className="p-5">
            <Text
              className="text-2xl mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              {tip.title}
            </Text>

            <Text
              className="text-base mb-4 leading-6"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
            >
              {tip.body}
            </Text>

            {tip.tags && tip.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {tip.tags.map((tag, idx) => (
                  <View key={idx} className="px-3 py-1 rounded-full bg-amber-100">
                    <Text
                      className="text-sm"
                      style={{ fontFamily: "SourceSans3_600SemiBold", color: "#92400e" }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-center justify-between py-3 border-t" style={{ borderColor: BORDER_SOFT }}>
              <Text className="text-sm" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                by @author • {formatTimeAgo(tip.createdAt)}
              </Text>
              <Pressable
                onPress={handleUpvote}
                className="flex-row items-center px-3 py-2 rounded-full bg-white border active:opacity-70"
                style={{ borderColor: BORDER_SOFT }}
              >
                <Ionicons name="arrow-up" size={18} color={DEEP_FOREST} />
                <Text
                  className="ml-1"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  {tip.upvoteCount}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Comments */}
          <View className="px-5 pb-5">
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Comments ({tip.commentCount})
            </Text>

            {comments.length === 0 ? (
              <View className="py-8 items-center">
                <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              comments.map(comment => (
                <View
                  key={comment.id}
                  className="p-4 mb-3 rounded-xl border"
                  style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
                >
                  <Text
                    className="mb-2"
                    style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
                  >
                    {comment.body}
                  </Text>
                  <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                    by @author • {formatTimeAgo(comment.createdAt)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Add Comment */}
        <View className="p-4 border-t" style={{ borderColor: BORDER_SOFT, backgroundColor: PARCHMENT }}>
          <View className="flex-row items-center">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              className="flex-1 px-4 py-3 rounded-xl border mr-2"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
            <Pressable
              onPress={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="p-3 rounded-full active:opacity-70"
              style={{
                backgroundColor: commentText.trim() ? DEEP_FOREST : BORDER_SOFT,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={PARCHMENT} />
              ) : (
                <Ionicons name="send" size={20} color={PARCHMENT} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
