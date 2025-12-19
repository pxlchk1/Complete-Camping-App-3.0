/**
 * Gear Review Detail Screen
 * Shows full gear review with rating, pros, cons, and upvote
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import * as Haptics from "expo-haptics";
import { getGearReviewById, upvoteGearReview } from "../../services/gearReviewsService";
import { reportContent } from "../../services/contentReportsService";
import { GearReview } from "../../types/community";
import { RootStackParamList, RootStackNavigationProp } from "../../navigation/types";
import { useCurrentUser } from "../../state/userStore";
import AccountRequiredModal from "../../components/AccountRequiredModal";
import { requireAuth } from "../../utils/gating";
import {
  DEEP_FOREST,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";

type GearReviewDetailRouteProp = RouteProp<RootStackParamList, "GearReviewDetail">;

export default function GearReviewDetailScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<GearReviewDetailRouteProp>();
  const { reviewId } = route.params;
  const currentUser = useCurrentUser();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [review, setReview] = useState<GearReview | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const data = await getGearReviewById(reviewId);
      setReview(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load review");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!requireAuth(() => setShowLoginModal(true))) {
      return;
    }
    try {
      await upvoteGearReview(reviewId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (review) {
        setReview({ ...review, upvoteCount: review.upvoteCount + 1 });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upvote review");
    }
  };

  const handleReport = () => {
    if (!requireAuth(() => setShowLoginModal(true))) {
      return;
    }
    Alert.alert("Report Review", "Why are you reporting this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: async () => {
          try {
            await reportContent({
              targetType: "gearReview",
              targetId: reviewId,
              reason: "User reported inappropriate content",
              reporterId: currentUser.id,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Thank you for your report");
          } catch (error) {
            Alert.alert("Error", "Failed to submit report");
          }
        },
      },
    ]);
  };

  if (loading || !review) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Review" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={20}
          color="#F59E0B"
        />
      );
    }
    return <View className="flex-row">{stars}</View>;
  };

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader title="Review" showTitle rightAction={{ icon: "flag-outline", onPress: handleReport }} />

      <ScrollView className="flex-1 p-5">
        {/* Gear Name and Brand */}
        <Text
          className="text-2xl mb-2"
          style={{
            fontFamily: "JosefinSlab_700Bold",
            color: TEXT_PRIMARY_STRONG,
          }}
        >
          {review.gearName}
        </Text>

        {review.brand && (
          <Text
            className="text-lg mb-3"
            style={{
              fontFamily: "SourceSans3_600SemiBold",
              color: TEXT_SECONDARY,
            }}
          >
            {review.brand}
          </Text>
        )}

        {/* Rating */}
        <View className="flex-row items-center mb-4">
          {renderStars(review.rating)}
          <Text
            className="ml-2"
            style={{
              fontFamily: "SourceSans3_600SemiBold",
              color: TEXT_PRIMARY_STRONG,
            }}
          >
            {review.rating.toFixed(1)} / 5.0
          </Text>
        </View>

        {/* Category Badge */}
        <View className="mb-4">
          <View
            className="px-3 py-1 rounded-full self-start"
            style={{ backgroundColor: "#E0F2F1" }}
          >
            <Text
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: "#00695C",
                textTransform: "capitalize",
              }}
            >
              {review.category}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View className="mb-4 p-4 rounded-xl" style={{ backgroundColor: "#FEF3C7" }}>
          <Text
            className="text-base"
            style={{
              fontFamily: "SourceSans3_600SemiBold",
              color: "#92400E",
              lineHeight: 22,
            }}
          >
            {review.summary}
          </Text>
        </View>

        {/* Full Review */}
        <View className="mb-4">
          <Text
            className="text-lg mb-2"
            style={{
              fontFamily: "JosefinSlab_700Bold",
              color: TEXT_PRIMARY_STRONG,
            }}
          >
            Full Review
          </Text>
          <Text
            style={{
              fontFamily: "SourceSans3_400Regular",
              return (
                <View className="flex-1 bg-parchment">
                  <ModalHeader title="Review" showTitle rightAction={{ icon: "flag-outline", onPress: handleReport }} />
                  <ScrollView className="flex-1 p-5">
                    {/* ...existing code... */}
                    <Pressable
                      onPress={handleUpvote}
                      className="py-3 px-6 rounded-xl items-center mt-2 active:opacity-90"
                      style={{ backgroundColor: DEEP_FOREST }}
                    >
                      <Ionicons name="thumbs-up-outline" size={20} color={PARCHMENT} />
                      <Text
                        className="ml-2 text-base"
                        style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                      >
                        Upvote ({review.upvoteCount})
                      </Text>
                    </Pressable>
                  </ScrollView>
                  <AccountRequiredModal
                    visible={showLoginModal}
                    onCreateAccount={() => {
                      setShowLoginModal(false);
                      navigation.navigate("Auth");
                    }}
                    onMaybeLater={() => setShowLoginModal(false)}
                  />
                </View>
              );
                  lineHeight: 22,
