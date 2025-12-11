/**
 * Edit Profile Screen
 * Allows users to edit their profile information including:
 * - About section
 * - Favorite camping style
 * - Favorite gear
 * - Profile photo
 * - Cover photo
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useCurrentUser, useUserStore } from "../state/userStore";
import ModalHeader from "../components/ModalHeader";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../constants/colors";
import { CampingStyle } from "../types/camping";
import { GearCategory, GEAR_CATEGORIES } from "../types/gear";

const CAMPING_STYLES: { value: CampingStyle; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "CAR_CAMPING", label: "Car camping", icon: "car-outline" },
  { value: "BACKPACKING", label: "Backpacking", icon: "bag-outline" },
  { value: "RV", label: "RV camping", icon: "bus-outline" },
  { value: "HAMMOCK", label: "Hammock camping", icon: "leaf-outline" },
  { value: "ROOFTOP_TENT", label: "Roof-top tent", icon: "triangle-outline" },
  { value: "OVERLANDING", label: "Overlanding", icon: "compass-outline" },
  { value: "BOAT_CANOE", label: "Boat or canoe", icon: "boat-outline" },
  { value: "BIKEPACKING", label: "Bikepacking", icon: "bicycle-outline" },
  { value: "WINTER", label: "Winter camping", icon: "snow-outline" },
  { value: "DISPERSED", label: "Dispersed camping", icon: "map-outline" },
];

const GEAR_ICONS: Record<GearCategory, keyof typeof Ionicons.glyphMap> = {
  shelter: "home-outline",
  sleep: "bed-outline",
  kitchen: "restaurant-outline",
  clothing: "shirt-outline",
  bags: "bag-outline",
  lighting: "flashlight-outline",
  misc: "albums-outline",
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUserStore((s) => s.updateCurrentUser);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form state
  const [about, setAbout] = useState(currentUser?.about || "");
  const [favoriteCampingStyle, setFavoriteCampingStyle] = useState<CampingStyle | undefined>(
    currentUser?.favoriteCampingStyle as CampingStyle | undefined
  );
  const [favoriteGear, setFavoriteGear] = useState<GearCategory[]>(
    (currentUser?.favoriteGear as GearCategory[]) || []
  );
  const [favoriteGearDetails, setFavoriteGearDetails] = useState(currentUser?.favoriteGearDetails || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL);
  const [coverPhotoURL, setCoverPhotoURL] = useState(currentUser?.coverPhotoURL);

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setSaving(true);

      // Update profiles collection with correct field names
      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        about: about.trim() || null,
        favoriteCampingStyle: favoriteCampingStyle || null,
        favoriteGear: favoriteGear.length > 0 ? favoriteGear : null,
        favoriteGearDetails: favoriteGearDetails.trim() || null,
        avatarUrl: photoURL || null,
        backgroundUrl: coverPhotoURL || null,
        updatedAt: serverTimestamp(),
      });

      // Update local store (keeping photoURL/coverPhotoURL for backward compatibility)
      updateCurrentUser({
        about: about.trim() || undefined,
        favoriteCampingStyle: favoriteCampingStyle || undefined,
        favoriteGear: favoriteGear.length > 0 ? favoriteGear : undefined,
        favoriteGearDetails: favoriteGearDetails.trim() || undefined,
        photoURL: photoURL || undefined,
        coverPhotoURL: coverPhotoURL || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("[EditProfile] Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        const user = auth.currentUser;
        if (!user) return;

        // Upload to Firebase Storage
        const imageUri = result.assets[0].uri;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        setPhotoURL(downloadURL);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("[EditProfile] Error uploading photo:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectCoverPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingCover(true);
        const user = auth.currentUser;
        if (!user) return;

        // Upload to Firebase Storage
        const imageUri = result.assets[0].uri;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const storageRef = ref(storage, `profileBackgrounds/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        setCoverPhotoURL(downloadURL);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("[EditProfile] Error uploading cover photo:", error);
    } finally {
      setUploadingCover(false);
    }
  };

  const toggleGear = (gear: GearCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (favoriteGear.includes(gear)) {
      setFavoriteGear(favoriteGear.filter((g) => g !== gear));
    } else {
      setFavoriteGear([...favoriteGear, gear]);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PARCHMENT }} edges={["top"]}>
      <ModalHeader
        title="Edit Profile"
        showTitle
        rightAction={{
          icon: "checkmark",
          onPress: handleSave,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-5 pb-8">
            {/* Photos Section */}
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Photos
            </Text>

            <View
              className="mb-6 p-4 rounded-xl border"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
            >
              {/* Profile Photo */}
              <View className="mb-4">
                <Text
                  className="mb-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  Profile Photo
                </Text>
                <View className="flex-row items-center">
                  <View
                    className="w-20 h-20 rounded-full mr-4"
                    style={{ backgroundColor: BORDER_SOFT }}
                  >
                    {photoURL ? (
                      <Image
                        source={{ uri: photoURL }}
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full rounded-full items-center justify-center">
                        <Ionicons name="person" size={32} color={TEXT_MUTED} />
                      </View>
                    )}
                    {uploadingPhoto && (
                      <View className="absolute inset-0 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <ActivityIndicator color={PARCHMENT} />
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={handleSelectPhoto}
                    className="px-4 py-2 rounded-xl active:opacity-70"
                    style={{ backgroundColor: DEEP_FOREST }}
                    disabled={uploadingPhoto}
                  >
                    <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
                      {photoURL ? "Change" : "Upload"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Cover Photo */}
              <View>
                <Text
                  className="mb-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  Cover Photo
                </Text>
                <View>
                  <View
                    className="w-full rounded-xl mb-2"
                    style={{ height: 120, backgroundColor: BORDER_SOFT }}
                  >
                    {coverPhotoURL ? (
                      <Image
                        source={{ uri: coverPhotoURL }}
                        className="w-full h-full rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full rounded-xl items-center justify-center">
                        <Ionicons name="image-outline" size={48} color={TEXT_MUTED} />
                      </View>
                    )}
                    {uploadingCover && (
                      <View className="absolute inset-0 rounded-xl items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <ActivityIndicator color={PARCHMENT} />
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={handleSelectCoverPhoto}
                    className="px-4 py-2 rounded-xl active:opacity-70"
                    style={{ backgroundColor: DEEP_FOREST }}
                    disabled={uploadingCover}
                  >
                    <Text
                      className="text-center"
                      style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                    >
                      {coverPhotoURL ? "Change Cover Photo" : "Upload Cover Photo"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* About Section */}
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              About
            </Text>

            <View
              className="mb-6 p-4 rounded-xl border"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
            >
              <TextInput
                value={about}
                onChangeText={setAbout}
                placeholder="Tell us about yourself and your camping adventures..."
                placeholderTextColor={TEXT_MUTED}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: PARCHMENT,
                  borderColor: BORDER_SOFT,
                  fontFamily: "SourceSans3_400Regular",
                  color: TEXT_PRIMARY_STRONG,
                  minHeight: 100,
                }}
              />
            </View>

            {/* Favorite Camping Style */}
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Favorite Camping Style
            </Text>

            <View className="mb-6">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {CAMPING_STYLES.map((style) => (
                  <Pressable
                    key={style.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFavoriteCampingStyle(
                        favoriteCampingStyle === style.value ? undefined : style.value
                      );
                    }}
                    className="px-4 py-3 rounded-xl border"
                    style={{
                      backgroundColor:
                        favoriteCampingStyle === style.value ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                      borderColor:
                        favoriteCampingStyle === style.value ? DEEP_FOREST : BORDER_SOFT,
                    }}
                  >
                    <View className="items-center">
                      <Ionicons
                        name={style.icon}
                        size={20}
                        color={favoriteCampingStyle === style.value ? PARCHMENT : TEXT_PRIMARY_STRONG}
                      />
                      <Text
                        className="mt-1 text-xs"
                        style={{
                          fontFamily: "SourceSans3_600SemiBold",
                          color:
                            favoriteCampingStyle === style.value ? PARCHMENT : TEXT_PRIMARY_STRONG,
                        }}
                      >
                        {style.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Favorite Gear */}
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Favorite Gear
            </Text>

            <View className="mb-6">
              <View className="flex-row flex-wrap gap-2">
                {GEAR_CATEGORIES.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() => toggleGear(category.value)}
                    className="px-4 py-3 rounded-xl border"
                    style={{
                      backgroundColor: favoriteGear.includes(category.value)
                        ? DEEP_FOREST
                        : CARD_BACKGROUND_LIGHT,
                      borderColor: favoriteGear.includes(category.value)
                        ? DEEP_FOREST
                        : BORDER_SOFT,
                    }}
                  >
                    <View className="items-center flex-row">
                      <Ionicons
                        name={GEAR_ICONS[category.value]}
                        size={18}
                        color={
                          favoriteGear.includes(category.value) ? PARCHMENT : TEXT_PRIMARY_STRONG
                        }
                      />
                      <Text
                        className="ml-2 text-sm"
                        style={{
                          fontFamily: "SourceSans3_600SemiBold",
                          color: favoriteGear.includes(category.value)
                            ? PARCHMENT
                            : TEXT_PRIMARY_STRONG,
                        }}
                      >
                        {category.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Favorite Gear Details */}
            {favoriteGear.length > 0 && (
              <View className="mb-6">
                <Text
                  className="mb-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  Tell us about your favorite gear
                </Text>
                <Text
                  className="mb-2 text-sm"
                  style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}
                >
                  Example: "Tent and Lantern BaseCamp Box" or "MSR Hubba Hubba NX 2-Person Tent"
                </Text>
                <TextInput
                  value={favoriteGearDetails}
                  onChangeText={setFavoriteGearDetails}
                  placeholder="Enter your favorite gear details..."
                  placeholderTextColor={TEXT_MUTED}
                  className="px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: PARCHMENT,
                    borderColor: BORDER_SOFT,
                    fontFamily: "SourceSans3_400Regular",
                    color: TEXT_PRIMARY_STRONG,
                  }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Saving Overlay */}
      {saving && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <ActivityIndicator size="large" color={PARCHMENT} />
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-4"
          onPress={() => {
            setShowSuccessModal(false);
            navigation.goBack();
          }}
        >
          <Pressable
            className="bg-parchment rounded-2xl p-6 w-full max-w-sm"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: DEEP_FOREST }}
              >
                <Ionicons name="checkmark" size={32} color={PARCHMENT} />
              </View>
              <Text
                className="text-xl mb-2"
                style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
              >
                Profile Updated
              </Text>
              <Text
                className="text-center"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                Your profile has been updated successfully.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSuccessModal(false);
                navigation.goBack();
              }}
              className="bg-forest rounded-xl py-3 active:opacity-90"
              style={{ backgroundColor: DEEP_FOREST }}
            >
              <Text
                className="text-center text-parchment"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Done
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
