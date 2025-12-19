/**
 * My Campsite Screen - Social-style profile
 * Backed by Firestore profiles collection
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

import AccountRequiredModal from "../components/AccountRequiredModal";
import PaywallModal from "../components/PaywallModal";

import { auth, db } from "../config/firebase";
import { restorePurchases, syncSubscriptionToFirestore } from "../services/subscriptionService";
import { useUserStatus } from "../utils/authHelper";
import { useIsModerator, useIsAdministrator } from "../state/userStore";

import { HERO_IMAGES } from "../constants/images";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  BORDER_SOFT,
} from "../constants/colors";

type MembershipTier = "freeMember" | "subscribed" | "isAdmin" | "isModerator";
type CampsiteTab = "trips" | "gear" | "campgrounds";

type UserProfile = {
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  membershipTier: MembershipTier;
  bio: string | null;
  about?: string | null;
  location: string | null;
  campingStyle: string | null;
  stats?: {
    tripsCount: number;
    tipsCount: number;
    gearReviewsCount: number;
    questionsCount: number;
    photosCount: number;
  };
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_HEIGHT = 260;

export default function MyCampsiteScreen({ navigation }: any) {
  const { isGuest } = useUserStatus();
  const isModerator = useIsModerator();
  const isAdministrator = useIsAdministrator();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab] = useState<CampsiteTab>("trips");
  const [savedCampgrounds, setSavedCampgrounds] = useState<any[]>([]);
  const [loadingCampgrounds, setLoadingCampgrounds] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const favRef = collection(db, "users", user.uid, "favorites");
    setLoadingCampgrounds(true);

    const unsub = onSnapshot(favRef, (snap) => {
      setSavedCampgrounds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingCampgrounds(false);
    });

    return () => unsub();
  }, []);

  async function handleRestorePurchases() {
    setRestoring(true);
    try {
      await restorePurchases();
      await syncSubscriptionToFirestore();
      Alert.alert("Success", "Purchases restored");
    } catch {
      Alert.alert("Error", "Could not restore purchases");
    } finally {
      setRestoring(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
    } catch {
      Alert.alert("Error", "Could not sign out");
    }
  }

  if (loading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={DEEP_FOREST} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: PARCHMENT }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Cover */}
        <ImageBackground
          source={profile.backgroundUrl ? { uri: profile.backgroundUrl } : HERO_IMAGES[0]}
          style={{ width: SCREEN_WIDTH, height: COVER_HEIGHT }}
        >
          {/* Top Bar */}
          <View
            style={{
              paddingTop: insets.top + 8,
              paddingHorizontal: 20,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color={PARCHMENT} />
            </Pressable>
          </View>

          {/* Badge Row */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
            {[
              { label: "Weekend\nCamper", icon: "bonfire", color: "#92AFB1" },
              { label: "Trail\nLeader", icon: "compass", color: "#AC9A6D" },
              { label: "Backcountry\nGuide", icon: "navigate", color: "#485952" },
            ].map((b) => (
              <View key={b.label} style={{ width: 80, alignItems: "center" }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: b.color,
                    borderWidth: 3,
                    borderColor: PARCHMENT,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={b.icon as any} size={26} color={PARCHMENT} />
                </View>
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 6,
                    fontSize: 9,
                    lineHeight: 11,
                    fontFamily: "SourceSans3_600SemiBold",
                    color: TEXT_SECONDARY,
                  }}
                >
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
        </ImageBackground>

        {/* Restore Purchases */}
        <Pressable
          onPress={handleRestorePurchases}
          disabled={restoring}
          style={{
            margin: 20,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: EARTH_GREEN,
            backgroundColor: CARD_BACKGROUND_LIGHT,
            alignItems: "center",
          }}
        >
          {restoring ? (
            <ActivityIndicator color={EARTH_GREEN} />
          ) : (
            <>
              <Ionicons name="reload-circle-outline" size={24} color={EARTH_GREEN} />
              <Text style={{ marginTop: 6, fontFamily: "SourceSans3_600SemiBold" }}>
                Restore Purchases
              </Text>
            </>
          )}
        </Pressable>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          style={{
            marginHorizontal: 20,
            padding: 14,
            borderRadius: 10,
            backgroundColor: "#dc2626",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "SourceSans3_600SemiBold",
              color: PARCHMENT,
            }}
          >
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>

      <AccountRequiredModal
        visible={showAccountModal}
        onCreateAccount={() => navigation.navigate("Auth")}
        onMaybeLater={() => setShowAccountModal(false)}
      />

      <PaywallModal
        visible={showProModal}
        onClose={() => setShowProModal(false)}
      />
    </View>
  );
}
