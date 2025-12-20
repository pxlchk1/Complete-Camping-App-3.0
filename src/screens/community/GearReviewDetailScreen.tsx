/**
 * Gear Review Detail Screen
 * Shows full gear review with rating, pros, cons, and upvote
 *
 * Fixes:
 * - Wraps all hooks and returns inside a real component function
 * - Removes corrupted JSX that was pasted into a style object
 * - Implements basic Firestore fetch, upvote, and reporting so the screen can ship
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  // Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { gearReviewVotesService } from "../../services/firestore/gearReviewVotesService";
import VoteButtons from "../../components/VoteButtons";

import ModalHeader from "../../components/ModalHeader";
import AccountRequiredModal from "../../components/AccountRequiredModal";
import { auth, db } from "../../config/firebase";

/** Fallback theme values (safe if your constants are not available here). */
const DEEP_FOREST = "#1F3B2C";
// const PARCHMENT = "#F7F1E4";
const TEXT_PRIMARY_STRONG = "#3D2817";
const TEXT_SECONDARY = "#6B5A4A";

type GearReview = {
  id: string;
  gearName: string;
  brand?: string;
  category?: string;
  summary?: string;
  reviewText?: string;
  rating: number;
  pros?: string[];
  cons?: string[];
  upvoteCount: number;
  createdAt?: any;
  authorId?: string;
};

type RouteParams = {
  reviewId?: string;
};

export default function GearReviewDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const reviewId = (route?.params as RouteParams | undefined)?.reviewId;

  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<GearReview | null>(null);
  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // const isSignedIn = useMemo(() => !!auth?.currentUser?.uid, []);

  const loadReview = useCallback(async () => {
    if (!reviewId) {
      setLoading(false);
      setReview(null);
      return;
    }
    try {
      setLoading(true);
      const ref = doc(db, "gearReviews", String(reviewId));
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setReview(null);
        return;
      }
      const data = snap.data() as any;
      const normalized: GearReview = {
        id: snap.id,
        gearName: data.gearName ?? "",
        brand: data.brand ?? "",
        category: data.category ?? "",
        summary: data.summary ?? "",
        reviewText: data.reviewText ?? data.fullReview ?? "",
        rating: typeof data.rating === "number" ? data.rating : 0,
        pros: Array.isArray(data.pros) ? data.pros : [],
        cons: Array.isArray(data.cons) ? data.cons : [],
        upvoteCount: typeof data.upvoteCount === "number" ? data.upvoteCount : 0,
        createdAt: data.createdAt,
        authorId: data.authorId,
      };
      setReview(normalized);
      // Voting state
      try {
        const summary = await gearReviewVotesService.getVoteSummary(snap.id);
        setVoteScore(summary.score);
        const userVoteObj = await gearReviewVotesService.getUserVote(snap.id);
        setUserVote(userVoteObj?.voteType || null);
      } catch {}
    } catch {
      Alert.alert("Error", "Failed to load review");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, reviewId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const requireAuthOrShowModal = () => {
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const handleVote = async (voteType: "up" | "down") => {
    if (!requireAuthOrShowModal()) return;
    if (!reviewId) return;
    setVoteLoading(true);
    const prevVote = userVote;
    const prevScore = voteScore;
    // Optimistic UI
    let newVote: "up" | "down" | null = voteType;
    let newScore = voteScore;
    if (userVote === voteType) {
      newVote = null;
      newScore += voteType === "up" ? -1 : 1;
    } else if (userVote === "up" && voteType === "down") {
      newScore -= 2;
    } else if (userVote === "down" && voteType === "up") {
      newScore += 2;
    } else {
      newScore += voteType === "up" ? 1 : -1;
    }
    setUserVote(newVote);
    setVoteScore(newScore);
    try {
      await gearReviewVotesService.vote(reviewId, newVote ?? voteType);
    } catch {
      setUserVote(prevVote);
      setVoteScore(prevScore);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleReport = () => {
    if (!requireAuthOrShowModal()) return;
    if (!reviewId) return;

    Alert.alert("Report Review", "Why are you reporting this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: async () => {
          try {
            const uid = auth?.currentUser?.uid;
            if (!uid) return;

            const reportRef = doc(db, "reports", `${String(reviewId)}_${Date.now()}`);
            await setDoc(reportRef, {
              targetType: "gearReview",
              targetId: String(reviewId),
              reason: "User reported inappropriate content",
              reporterId: uid,
              createdAt: serverTimestamp(),
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert("Success", "Thank you for your report");
          } catch {
            Alert.alert("Error", "Failed to submit report");
          }
        },
      },
    ]);
  };

  const renderStars = (rating: number) => {
    const stars: React.ReactElement[] = [];
    const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= safeRating ? "star" : "star-outline"}
          size={20}
          color="#F59E0B"
        />
      );
    }
    return <View className="flex-row">{stars}</View>;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Review" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      </View>
    );
  }

  if (!review) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Review" showTitle />
        <View className="flex-1 items-center justify-center px-6">
          <Text
            style={{
              fontFamily: "SourceSans3_600SemiBold",
              color: TEXT_PRIMARY_STRONG,
              textAlign: "center",
            }}
          >
            Review not found.
          </Text>
        </View>

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
  }

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader
        title="Review"
        showTitle
        rightAction={{ icon: "flag-outline", onPress: handleReport }}
      />

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

        {!!review.brand && (
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
            {(review.rating ?? 0).toFixed(1)} / 5.0
          </Text>
        </View>

        {/* Category Badge */}
        {!!review.category && (
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
        )}

        {/* Summary */}
        {!!review.summary && (
          <View
            className="mb-4 p-4 rounded-xl"
            style={{ backgroundColor: "#FEF3C7" }}
          >
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
        )}

        {/* Pros / Cons */}
        {(review.pros?.length || review.cons?.length) ? (
          <View className="mb-4">
            {!!review.pros?.length && (
              <View className="mb-3">
                <Text
                  className="text-lg mb-2"
                  style={{
                    fontFamily: "JosefinSlab_700Bold",
                    color: TEXT_PRIMARY_STRONG,
                  }}
                >
                  Pros
                </Text>
                {review.pros!.map((p, idx) => (
                  <View key={`pro_${idx}`} className="flex-row mb-1">
                    <Text style={{ color: TEXT_PRIMARY_STRONG }}>• </Text>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_400Regular",
                        color: TEXT_PRIMARY_STRONG,
                        lineHeight: 22,
                        flex: 1,
                      }}
                    >
                      {String(p)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!!review.cons?.length && (
              <View>
                <Text
                  className="text-lg mb-2"
                  style={{
                    fontFamily: "JosefinSlab_700Bold",
                    color: TEXT_PRIMARY_STRONG,
                  }}
                >
                  Cons
                </Text>
                {review.cons!.map((c, idx) => (
                  <View key={`con_${idx}`} className="flex-row mb-1">
                    <Text style={{ color: TEXT_PRIMARY_STRONG }}>• </Text>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_400Regular",
                        color: TEXT_PRIMARY_STRONG,
                        lineHeight: 22,
                        flex: 1,
                      }}
                    >
                      {String(c)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Full Review Body (only if present) */}
        {!!review.reviewText?.trim() && (
          <View className="mb-4">
            <Text
              style={{
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                lineHeight: 22,
              }}
            >
              {review.reviewText}
            </Text>
          </View>
        )}

        {/* Reddit-style Voting Control */}
        <View className="items-center mb-6">
          <VoteButtons
            score={voteScore}
            userVote={userVote}
            onVote={handleVote}
            layout="vertical"
            size="large"
            disabled={voteLoading}
          />
        </View>
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
}
