import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, TextInput, Modal, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { RootStackNavigationProp, MainTabRouteProp } from "../navigation/types";
import * as Haptics from "expo-haptics";

// Components
import TipSubmissionModal from "../components/TipSubmissionModal";
import AccountButtonHeader from "../components/AccountButtonHeader";
import GearReviewCard from "../components/GearReviewCard";
import ConnectAskScreen from "./community/ConnectAskScreen";
import PhotosTabContent from "./community/PhotosTabContent";
import VoteButtons from "../components/VoteButtons";

// State and services
import { useTips, TIP_CATEGORIES, useTipStore } from "../state/tipStore";
import { useGearReviewStore, useGearReviews, useGearReviewsLoading } from "../state/gearReviewStore";
import { useAuthStore } from "../state/authStore";
import { usePaywallStore } from "../state/paywallStore";
import { useToast } from "../components/ToastManager";
import { useUserType } from "../utils/userType";
import { useUserStatus } from "../utils/authHelper";
import { getFeedbackPosts, type FeedbackPost } from "../api/feedback-service";

// Constants
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  RIVER_ROCK,
  SIERRA_SKY,
  PARCHMENT,
  PARCHMENT_BACKGROUND,
  CARD_BACKGROUND_LIGHT,
  PARCHMENT_BORDER,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_ON_DARK,
  TEXT_MUTED,
  LODGE_FOREST,
  LODGE_AMBER,
  LODGE_STONE_600,
  TL_BROWN,
} from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

export default function CommunityScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<MainTabRouteProp<"Community">>();
  const initialTab = route?.params?.initialTab;
  const [activeTab, setActiveTab] = useState<"tips" | "connect" | "images" | "feedback" | "gear">(
    initialTab || "tips"
  );
  const insets = useSafeAreaInsets();
  const { isGuest, isFree, isPro } = useUserStatus();

  const [tipSubmissionVisible, setTipSubmissionVisible] = useState(false);

  // Feedback tab state
  const [feedbackPosts, setFeedbackPosts] = useState<FeedbackPost[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Gear tab state
  const gearReviews = useGearReviews();
  const gearReviewsLoading = useGearReviewsLoading();
  const syncGearReviews = useGearReviewStore((state) => state.syncFromFirebase);

  const tips = useTips();
  const tipsLoading = useTipStore((state) => state.isLoading);
  const syncTipsFromFirebase = useTipStore((state) => state.syncFromFirebase);
  const { showError } = useToast();
  const { user } = useAuthStore();
  const { open: openPaywall } = usePaywallStore();
  const userType = useUserType();

  // Sync tips from Firebase when the tips tab is focused
  useEffect(() => {
    if (activeTab === "tips" && user && tips.length === 0 && !tipsLoading) {
      syncTipsFromFirebase();
    }
  }, [activeTab, user]);

  // Sync gear reviews when gear tab is active
  useEffect(() => {
    if (activeTab === "gear" && user) {
      syncGearReviews();
    }
  }, [activeTab, user]);

  // Calculate bottom padding
  const bottomSpacer = 50 + Math.max(insets.bottom, 18) + 12;

  // Gate tip submission with two-gate system
  const handleSubmitTip = () => {
    // Gate 1: Login required
    if (isGuest) {
      navigation.navigate("Auth" as any);
      return;
    }

    // Gate 2: Pro required (free users can browse but not post)
    if (isFree) {
      openPaywall("community_full", { name: "Community" });
      return;
    }

    setTipSubmissionVisible(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return date.toLocaleDateString();
  };

  useFocusEffect(
    React.useCallback(() => {
      if (initialTab && initialTab !== ("stories" as any)) {
        setActiveTab(initialTab as "tips" | "connect" | "images" | "feedback" | "gear");
      }
    }, [initialTab])
  );

  // Load feedback posts when feedback tab is active
  useEffect(() => {
    if (activeTab === "feedback" && user) {
      loadFeedbackPosts();
    }
  }, [activeTab, user]);

  const loadFeedbackPosts = async () => {
    if (!user) {
      return;
    }
    try {
      setFeedbackLoading(true);
      const fetchedPosts = await getFeedbackPosts();
      setFeedbackPosts(fetchedPosts);
    } catch (error: any) {
      console.error("Firestore error loading feedbackPosts:", error);
      showError("Failed to load feedback posts");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleFeedbackVote = async (postId: string, voteType: "up" | "down") => {
    if (!user) {
      showError("Please sign in");
      return;
    }
    // Voting not implemented in this schema
    showError("Voting coming soon");
  };

  const handleTipVote = async (tipId: string, voteType: "up" | "down") => {
    if (!user) {
      showError("Please sign in to vote");
      return;
    }
    // TODO: Implement tip voting in Firebase
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleGearVote = async (reviewId: string, voteType: "up" | "down") => {
    if (!user) {
      showError("Please sign in to vote");
      return;
    }
    // TODO: Implement gear review voting in Firebase
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTipPress = (tipId: string) => {
    navigation.navigate("TipDetail", { tipId });
  };

  const handleTipSubmitted = (tipId: string) => {
    handleTipPress(tipId);
  };

  const getCategoryNameLocal = (categoryId: string) => {
    return TIP_CATEGORIES.find((cat) => cat.id === categoryId)?.name || categoryId;
  };

  const renderTipsTab = () => (
    <View>
      {/* Top Navigation Bar */}
      <View className="bg-forest" style={{ paddingVertical: 12 }}>
        <View className="flex-row items-center" style={{ paddingHorizontal: 16, minHeight: 44 }}>
          <Text className="text-xl font-bold text-parchment" style={{ fontFamily: "JosefinSlab_700Bold" }}>
            Camping Tips
          </Text>
          {user && (
            <Pressable
              onPress={handleSubmitTip}
              className="ml-3 active:opacity-70"
            >
              <Ionicons name="add-circle" size={28} color={PARCHMENT} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content with padding */}
      <View className="px-4 mt-4">
      {!user ? (
        <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
          <Ionicons name="lock-closed" size={48} color={LODGE_FOREST} />
          <Text className="text-lg mt-4 mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
            Sign in to view tips
          </Text>
          <Text className="text-center mb-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
            Join the community to share and discover camping tips
          </Text>
          <Pressable
            onPress={() => navigation.navigate("Auth")}
            className="bg-forest-800 rounded-xl px-6 py-3 active:opacity-70"
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_ON_DARK }}>Sign In</Text>
          </Pressable>
        </View>
      ) : tipsLoading ? (
        <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
          <Ionicons name="sync" size={48} color={LODGE_FOREST} />
          <Text className="text-lg mt-4" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>Loading Tips...</Text>
        </View>
      ) : tips.length === 0 ? (
        <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
          <Ionicons name="bulb-outline" size={48} color={TL_BROWN} />
          <Text className="text-lg mt-4 mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>No Tips Yet</Text>
          <Text className="text-center mb-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
            Be the first to share a helpful camping tip!
          </Text>
          <Pressable
            onPress={handleSubmitTip}
            className="bg-forest-800 rounded-xl px-6 py-3"
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_ON_DARK }}>Submit Your First Tip</Text>
          </Pressable>
        </View>
      ) : (
        <View className="space-y-4">
          {tips
            .filter((tip) => (tip.score || 0) > -5) // Hide items with score less than -5
            .map((tip) => (
            <Pressable
              key={tip.id}
              onPress={() => handleTipPress(tip.id)}
              className="rounded-xl p-4 border"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
            >
              <View className="flex-row items-start mb-3">
                <View className="mr-3">
                  <VoteButtons
                    score={tip.score || (tip.upvoteCount || 0)}
                    userVote={tip.userVote}
                    onVote={(voteType) => handleTipVote(tip.id, voteType)}
                    size="small"
                    layout="vertical"
                  />
                </View>
                <View className="flex-1">
                  <Text className="leading-5 mb-2" numberOfLines={5} style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                    {tip.body || tip.text}
                  </Text>
                  <Text className="text-sm" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                    {tip.userId}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      </View>
    </View>
  );

  const renderFeedbackTab = () => {
    return (
      <View>
        {/* Top Navigation Bar */}
        <View className="bg-forest" style={{ paddingVertical: 12 }}>
          <View className="flex-row items-center" style={{ paddingHorizontal: 16, minHeight: 44 }}>
            <Text className="text-xl font-bold text-parchment" style={{ fontFamily: "JosefinSlab_700Bold" }}>
              Feedback
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 mt-4">
          {!user ? (
            <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
              <Ionicons name="lock-closed" size={48} color={LODGE_FOREST} />
              <Text className="text-lg mt-4 mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                Sign in to view feedback
              </Text>
              <Text className="text-center mb-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                Join the community to share your thoughts
              </Text>
              <Pressable
                onPress={() => navigation.navigate("Auth")}
                className="bg-forest-800 rounded-xl px-6 py-3 active:opacity-70"
              >
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_ON_DARK }}>Sign In</Text>
              </Pressable>
            </View>
          ) : feedbackLoading ? (
            <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
              <Ionicons name="sync" size={48} color={LODGE_FOREST} />
              <Text className="text-lg mt-4" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>Loading Feedback...</Text>
            </View>
          ) : feedbackPosts.length === 0 ? (
            <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
              <Ionicons name="chatbubbles" size={48} color={LODGE_FOREST} />
              <Text className="text-lg mt-4" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>No feedback yet</Text>
              <Text className="text-center mt-2" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                Share your thoughts and suggestions
              </Text>
            </View>
          ) : (
            <View className="space-y-3 pb-4">
              {feedbackPosts
                .filter((post) => (post.score || 0) > -5) // Hide items with score less than -5
                .map((post) => (
                <Pressable
                  key={post.id}
                  onPress={() => navigation.navigate("FeedbackDetail", { postId: post.id })}
                  className="rounded-xl p-4 border active:opacity-70"
                  style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
                >
                  <View className="flex-row items-start">
                    <View className="mr-3">
                      <VoteButtons
                        score={post.score || (post.voteCount || 0)}
                        userVote={post.userVote}
                        onVote={(voteType) => handleFeedbackVote(post.id, voteType)}
                        size="small"
                        layout="vertical"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="mb-2">
                        <Text className="text-lg mb-1" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                          {post.topic}
                        </Text>
                        <Text className="leading-5" numberOfLines={3} style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                          {post.message}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                          {post.userId}
                        </Text>
                        <Text className="text-sm" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGearTab = () => {
    return (
      <View>
        {/* Top Navigation Bar */}
        <View className="bg-forest" style={{ paddingVertical: 12 }}>
          <View className="flex-row items-center" style={{ paddingHorizontal: 16, minHeight: 44 }}>
            <Text className="text-xl font-bold text-parchment" style={{ fontFamily: "JosefinSlab_700Bold" }}>
              Gear Reviews
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 mt-4">
          {!user ? (
            <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
              <Ionicons name="lock-closed" size={48} color={LODGE_FOREST} />
              <Text className="text-lg mt-4 mb-2" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                Sign in to view gear reviews
              </Text>
              <Text className="text-center mb-6" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                Join the community to discover and share gear reviews
              </Text>
              <Pressable
                onPress={() => navigation.navigate("Auth")}
                className="bg-forest-800 rounded-xl px-6 py-3 active:opacity-70"
              >
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_ON_DARK }}>Sign In</Text>
              </Pressable>
            </View>
          ) : gearReviewsLoading ? (
            <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
              <Ionicons name="sync" size={48} color={LODGE_FOREST} />
              <Text className="text-lg mt-4" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                Loading Reviews...
              </Text>
            </View>
          ) : gearReviews.length === 0 ? (
            <View className="rounded-xl p-8 items-center border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
              <Ionicons name="construct" size={48} color={LODGE_FOREST} />
              <Text className="text-lg mt-4" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                No reviews yet
              </Text>
              <Text className="text-center mt-2" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                Be the first to review your gear
              </Text>
            </View>
          ) : (
            <View className="space-y-3 pb-4">
              {gearReviews
                .filter((review) => (review.score || 0) > -5) // Hide items with score less than -5
                .map((review) => (
                <Pressable
                  key={review.id}
                  onPress={() => navigation.navigate("GearReviewDetail", { reviewId: review.id })}
                  className="rounded-xl p-4 border active:opacity-70"
                  style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
                >
                  <View className="flex-row items-start mb-2">
                    <View className="mr-3">
                      <VoteButtons
                        score={review.score || (review.upvoteCount || 0)}
                        userVote={review.userVote}
                        onVote={(voteType) => handleGearVote(review.id, voteType)}
                        size="small"
                        layout="vertical"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-lg mb-1" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                            {review.title}
                          </Text>
                          <Text className="text-sm mb-1" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                            {review.brand} • {review.category}
                          </Text>
                        </View>
                        <View className="flex-row items-center ml-2">
                          <Ionicons name="star" size={16} color="#f59e0b" />
                          <Text className="ml-1" style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                            {review.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <Text className="leading-5" numberOfLines={3} style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                        {review.text}
                      </Text>
                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-sm" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                          {review.userId}
                        </Text>
                        <Text className="text-sm" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-forest-800">
      <View className="flex-1 bg-cream-50">
        {/* Hero Image - full bleed */}
        <View style={{ height: 200 + insets.top }}>
          <ImageBackground
            source={HERO_IMAGES.COMMUNITY}
            style={{ flex: 1 }}
            resizeMode="cover"
            accessibilityLabel="Community camping scene"
          >
            <View className="flex-1" style={{ paddingTop: insets.top }}>
              {/* Account Button - Top Right */}
              <AccountButtonHeader color={TEXT_ON_DARK} />
            </View>
          </ImageBackground>
        </View>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Connect</Text>
          <Text style={styles.subtitle}>
            Ask questions, share tips, and learn from other campers.
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="bg-parchment border-b border-cream-200">
          <View className="flex-row px-4">
            {[
              { id: "tips" as const, name: "Tips", icon: "bulb" },
              { id: "gear" as const, name: "Gear", icon: "bag" },
              { id: "connect" as const, name: "Ask", icon: "people" },
              { id: "images" as const, name: "Photos", icon: "images" },
              { id: "feedback" as const, name: "Feedback", icon: "chatbubbles" },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                  setActiveTab(tab.id);
                }}
                className={`flex-1 py-4 items-center border-b-2 ${
                  activeTab === tab.id ? "border-amber-600" : "border-transparent"
                }`}
              >
                <View className="items-center justify-center">
                  <Ionicons
                    name={tab.icon as any}
                    size={20}
                    color={activeTab === tab.id ? LODGE_FOREST : "#696969"}
                  />
                  <Text
                    className={`text-sm mt-1 text-center ${
                      activeTab === tab.id ? "text-forest-800" : "text-stone-600"
                    }`}
                    style={{ fontFamily: "SourceSans3_600SemiBold" }}
                  >
                    {tab.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === "images" ? (
          <PhotosTabContent />
        ) : (
          <FlatList
            data={[]}
            renderItem={() => null as any}
            ListHeaderComponent={
              <View>
                {activeTab === "tips" && renderTipsTab()}
                {activeTab === "gear" && renderGearTab()}
                {activeTab === "connect" && <ConnectAskScreen />}
                {activeTab === "feedback" && renderFeedbackTab()}
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={{ paddingBottom: bottomSpacer }}
          />
        )}
      </View>

      {/* Modals */}
      <TipSubmissionModal
        visible={tipSubmissionVisible}
        onClose={() => setTipSubmissionVisible(false)}
        onTipSubmitted={handleTipSubmitted}
      />
    </View>
  );
}

const styles = {
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 16,
  },
  title: {
    fontFamily: "JosefinSlab_700Bold",
    fontSize: 28,
    letterSpacing: 1,
    color: "#485952",
  },
  subtitle: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 14,
    color: "#485952",
    lineHeight: 20,
  },
};
