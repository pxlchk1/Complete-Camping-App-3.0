/**
 * Feedback List Screen
 * Shows app feedback posts from the community
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { feedbackService, FeedbackPost } from "../../services/firestore/feedbackService";
import { auth } from "../../config/firebase";
import AccountRequiredModal from "../../components/AccountRequiredModal";
import { requireAuth } from "../../utils/gating";
import { RootStackNavigationProp } from "../../navigation/types";
import CommunitySectionHeader from "../../components/CommunitySectionHeader";
import { seedFeedbackIfEmpty } from "../../features/feedback/seedFeedback";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";

type CategoryFilter = 'Feature Request' | 'Bug Report' | 'Improvement' | 'Question' | 'Other' | 'all';

export default function FeedbackListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = auth.currentUser;
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  // Seed on mount
  useEffect(() => {
    console.log("[FeedbackList] Mounting feedback screen, running seed check.");
    seedFeedbackIfEmpty().catch(err => {
      console.error("[FeedbackList] Seed failed:", err);
    });
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[FeedbackList] Loading posts from Firestore...");
      const allPosts = await feedbackService.getFeedback();
      console.log(`[FeedbackList] Loaded ${allPosts.length} posts from Firestore.`);

      if (allPosts.length === 0) {
        console.log("[FeedbackList] No posts found after seed attempt.");
      }

      // Filter by category if not "all"
      const filtered = selectedCategory === "all"
        ? allPosts
        : allPosts.filter(post => post.category === selectedCategory);
      
      console.log(`[FeedbackList] After filtering by "${selectedCategory}": ${filtered.length} posts`);
      setPosts(filtered);
    } catch (err: any) {
      console.error("[FeedbackList] Error loading posts:", err);
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [selectedCategory])
  );

  const handlePostPress = (postId: string) => {
    navigation.navigate("FeedbackDetail", { postId });
  };
  const handleCreatePost = () => {
    if (!currentUser) {
      // Navigate to paywall for non-signed-in users
      requireAuth(() => setShowLoginModal(true));
    }
    
    // Firestore rules will check subscription status
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateFeedback");
  };

  const handleUpvote = async (postId: string) => {
    if (!currentUser) {
      navigation.navigate("Paywall");
      return;
      requireAuth(() => setShowLoginModal(true));
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await feedbackService.upvoteFeedback(postId);
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, karmaScore: p.karmaScore + 1 } : p))
      );
    } catch (err) {
      // Silently fail
    }
  };

  const handleDownvote = async (postId: string) => {
    if (!currentUser) {
      navigation.navigate("Paywall");
      return;
      requireAuth(() => setShowLoginModal(true));
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await feedbackService.adjustKarma(postId, -1);
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, karmaScore: p.karmaScore - 1 } : p))
      );
    } catch (err) {
      // Silently fail
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "#6b7280";
      case "planned":
        return "#3b82f6";
      case "in-progress":
        return "#f59e0b";
      case "completed":
        return "#10b981";
      case "declined":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      case "declined":
        return "Declined";
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Feature Request":
        return "Feature Request";
      case "Bug Report":
        return "Bug Report";
      case "Improvement":
        return "Improvement";
      case "Question":
        return "Question";
      case "Other":
        return "Other";
      default:
        return category;
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

  const renderPost = ({ item }: { item: FeedbackPost }) => {
    const statusColor = getStatusColor(item.status);
    const statusLabel = getStatusLabel(item.status);

    return (
      <Pressable
        onPress={() => handlePostPress(item.id)}
        className="rounded-xl p-4 mb-3 border active:opacity-90"
        style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center gap-2 flex-1">
            <View className="px-3 py-1 rounded-full bg-amber-100">
              <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: "#92400e" }}>
                {getCategoryLabel(item.category)}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-md" style={{ backgroundColor: statusColor + "20" }}>
              <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <Text
          className="text-lg mb-2"
          style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
        >
          {item.title}
        </Text>

        <Text
          className="mb-3"
          numberOfLines={2}
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          {item.description}
        </Text>

        <View className="flex-row items-center justify-between pt-3 border-t" style={{ borderColor: BORDER_SOFT }}>
          <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
            {formatTimeAgo(item.createdAt)}
          </Text>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleDownvote(item.id);
              }}
              className="flex-row items-center px-2 py-1 rounded-lg bg-white border active:opacity-70"
              style={{ borderColor: BORDER_SOFT }}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color="#6b7280" />
            </Pressable>
            
            <View className="px-3 py-1 rounded-lg bg-white border" style={{ borderColor: BORDER_SOFT }}>
              <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                {item.karmaScore}
              </Text>
            </View>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleUpvote(item.id);
              }}
              className="flex-row items-center px-2 py-1 rounded-lg bg-white border active:opacity-70"
              style={{ borderColor: BORDER_SOFT }}
            >
              <Ionicons name="arrow-up-circle-outline" size={18} color={EARTH_GREEN} />
            </Pressable>
          </View>
        </View>
      </Pressable>
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
          Loading feedback...
        </Text>
      </View>
    );
  }
    <AccountRequiredModal
      visible={showLoginModal}
      onCreateAccount={() => {
        setShowLoginModal(false);
        navigation.navigate("Auth");
      }}
      onMaybeLater={() => setShowLoginModal(false)}
    />

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment px-5">
        <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
        <Text
          className="mt-4 text-center text-lg"
          style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
        >
          Failed to load feedback
        </Text>
        <Text
          className="mt-2 text-center"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          {error}
        </Text>
        <Pressable
          onPress={() => loadPosts()}
          className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
          style={{ backgroundColor: DEEP_FOREST }}
        >
          <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      {/* Header */}
      <CommunitySectionHeader
        title="Feedback"
        onAddPress={handleCreatePost}
      />

      {/* Category Filter */}
      <View className="px-5 py-3 border-b" style={{ borderColor: BORDER_SOFT }}>
        <View className="flex-row flex-wrap gap-2">
          {[
            { id: "all" as CategoryFilter, label: "All" },
            { id: "feature" as CategoryFilter, label: "Features" },
            { id: "bug" as CategoryFilter, label: "Bugs" },
            { id: "improvement" as CategoryFilter, label: "Improvements" },
            { id: "question" as CategoryFilter, label: "Questions" },
            { id: "other" as CategoryFilter, label: "Other" },
          ].map(option => (
            <Pressable
              key={option.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(option.id);
              }}
              className={`px-3 py-1 rounded-full border ${
                selectedCategory === option.id ? "bg-amber-100 border-amber-600" : "bg-white"
              }`}
              style={selectedCategory !== option.id ? { borderColor: BORDER_SOFT } : undefined}
            >
              <Text
                className="text-xs"
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: selectedCategory === option.id ? "#92400e" : TEXT_SECONDARY
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: DEEP_FOREST + "15" }}
            >
              <Ionicons name="chatbubbles-outline" size={48} color={DEEP_FOREST} />
            </View>
            <Text
              className="text-2xl text-center mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Share Your Feedback
            </Text>
            <Text
              className="text-center text-base mb-6"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY, lineHeight: 24 }}
            >
              Help us improve! Share feature requests, report bugs, or suggest improvements.
            </Text>
          </View>

          {/* Feedback Categories Preview */}
          <View className="w-full mb-6">
            <View className="flex-row flex-wrap gap-3 justify-center">
              <View className="items-center" style={{ width: 100 }}>
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: "#f59e0b15" }}
                >
                  <Ionicons name="bulb-outline" size={28} color="#f59e0b" />
                </View>
                <Text className="text-xs text-center" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}>
                  Features
                </Text>
              </View>
              <View className="items-center" style={{ width: 100 }}>
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: "#ef444415" }}
                >
                  <Ionicons name="bug-outline" size={28} color="#ef4444" />
                </View>
                <Text className="text-xs text-center" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}>
                  Bugs
                </Text>
              </View>
              <View className="items-center" style={{ width: 100 }}>
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: "#3b82f615" }}
                >
                  <Ionicons name="trending-up-outline" size={28} color="#3b82f6" />
                </View>
                <Text className="text-xs text-center" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}>
                  Improvements
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleCreatePost}
            className="px-8 py-4 rounded-xl active:opacity-90 flex-row items-center"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Ionicons name="add-circle-outline" size={24} color={PARCHMENT} />
            <Text className="ml-2 text-base" style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
              Submit Feedback
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

