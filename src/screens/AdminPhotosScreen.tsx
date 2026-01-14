/**
 * Admin Photos Review Screen
 * Review and moderate community photos
 * Admins can delete any photo; normal users can only delete their own
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { db, auth, functions } from "../config/firebase";
import { collection, query, getDocs, doc, orderBy, limit, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import ModalHeader from "../components/ModalHeader";
import { useToast } from "../components/ToastManager";
import {
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  DEEP_FOREST,
} from "../constants/colors";

interface PhotoPost {
  id: string;
  photoUrls?: string[];
  imageUrl?: string; // Legacy fallback
  caption: string;
  userId: string;
  displayName?: string;
  userHandle?: string;
  storagePaths?: string[];
  storagePath?: string; // Legacy fallback
  createdAt: any;
  postType?: string;
  isHidden?: boolean;
}

export default function AdminPhotosScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<PhotoPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<PhotoPost | null>(null);
  const [uploaderNames, setUploaderNames] = useState<Record<string, string>>({});
  const currentUserId = auth.currentUser?.uid;
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    checkAdminStatus();
    loadPhotos();
  }, []);

  const checkAdminStatus = async () => {
    if (!currentUserId) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", currentUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setIsAdmin(
          data.isAdmin === true || 
          data.role === "admin" || 
          data.role === "administrator"
        );
      }
    } catch (error) {
      console.error("[AdminPhotos] Error checking admin status:", error);
    }
  };

  // Fetch uploader name for a given userId
  const fetchUploaderName = useCallback(async (userId: string): Promise<string> => {
    if (uploaderNames[userId]) return uploaderNames[userId];
    
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const name = data.displayName || data.handle || data.email?.split("@")[0] || userId.slice(0, 8);
        setUploaderNames(prev => ({ ...prev, [userId]: name }));
        return name;
      }
    } catch (error) {
      console.warn("[AdminPhotos] Error fetching uploader name:", error);
    }
    return userId.slice(0, 8);
  }, [uploaderNames]);

  const loadPhotos = async () => {
    try {
      // Query the photoPosts collection (canonical collection for Connect photos)
      const photosRef = collection(db, "photoPosts");
      const q = query(photosRef, orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const photosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PhotoPost[];

      setPhotos(photosData);

      // Fetch uploader names for all unique userIds
      const uniqueUserIds = [...new Set(photosData.map(p => p.userId).filter(Boolean))];
      const namesMap: Record<string, string> = {};
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          if (!userId) return;
          try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              namesMap[userId] = data.displayName || data.handle || data.email?.split("@")[0] || userId.slice(0, 8);
            } else {
              namesMap[userId] = userId.slice(0, 8);
            }
          } catch {
            namesMap[userId] = userId.slice(0, 8);
          }
        })
      );
      
      setUploaderNames(namesMap);
    } catch (error) {
      console.error("[AdminPhotos] Error loading photos:", error);
      showError("Failed to load photos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check if current user can delete this photo (owner OR admin)
  const canDeletePhoto = (photo: PhotoPost): boolean => {
    if (!currentUserId) return false;
    
    const ownerId = photo.userId;
    const isOwner = ownerId === currentUserId;
    
    return isOwner || isAdmin;
  };

  // Get uploader display name
  const getUploaderName = (photo: PhotoPost): string => {
    // Use displayName from post if available
    if (photo.displayName) return photo.displayName;
    
    const ownerId = photo.userId;
    if (!ownerId) return "Unknown";
    return uploaderNames[ownerId] || ownerId.slice(0, 8);
  };

  // Step 1: Show confirmation modal
  const handleRemoveRequest = (photo: PhotoPost) => {
    if (!canDeletePhoto(photo)) {
      showError("You can only delete your own photos.");
      return;
    }
    setPhotoToDelete(photo);
    setConfirmModalVisible(true);
  };

  // Step 2: Actually delete the photo
  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    
    const photo = photoToDelete;
    setConfirmModalVisible(false);
    setDeletingPhotoId(photo.id);

    try {
      // Use Cloud Function for secure deletion (handles both Firestore + Storage)
      const deletePhotoSecure = httpsCallable<
        { photoId: string }, 
        { success: boolean; photoId: string }
      >(functions, "deletePhotoSecure");

      const result = await deletePhotoSecure({ photoId: photo.id });
      
      if (result.data.success) {
        // Log moderation action (for admins deleting others' photos)
        const ownerId = photo.userId;
        if (isAdmin && ownerId !== currentUserId) {
          try {
            await addDoc(collection(db, "moderationLogs"), {
              action: "delete_photo",
              photoId: photo.id,
              removedByUid: currentUserId,
              uploaderUid: ownerId,
              photoCaption: photo.caption?.slice(0, 100) || "",
              timestamp: serverTimestamp(),
            });
          } catch (logError) {
            console.warn("[AdminPhotos] Failed to write moderation log:", logError);
          }
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        showSuccess("Photo removed");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error: any) {
      console.error("[AdminPhotos] Error removing photo:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError("Couldn't remove photo. Try again.");
    } finally {
      setDeletingPhotoId(null);
      setPhotoToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmModalVisible(false);
    setPhotoToDelete(null);
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
        <ModalHeader title="Review photos" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ModalHeader title="Review photos" showTitle />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPhotos();
            }}
            tintColor={DEEP_FOREST}
          />
        }
      >
        <View className="px-5 pt-5 pb-8">
          {photos.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="images-outline" size={48} color={TEXT_SECONDARY} />
              <Text className="mt-4 text-center" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                No photos to review
              </Text>
            </View>
          )}
          {photos.map((photo) => {
            const isDeleting = deletingPhotoId === photo.id;
            const hasPermission = canDeletePhoto(photo);
            // Use photoUrls array (new schema) or imageUrl (legacy fallback)
            const imageUrl = photo.photoUrls?.[0] || photo.imageUrl || "";
            
            return (
              <View
                key={photo.id}
                className="mb-4 rounded-xl overflow-hidden border"
                style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT, opacity: isDeleting ? 0.6 : 1 }}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: 300 }}
                  resizeMode="cover"
                />
                <View className="p-4">
                  <Text
                    className="mb-2"
                    style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }}
                  >
                    {photo.caption || "(No caption)"}
                  </Text>
                  <Text
                    className="mb-3 text-xs"
                    style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
                  >
                    Uploaded by: {getUploaderName(photo)}
                  </Text>
                  
                  {/* Permission-based button rendering */}
                  {hasPermission ? (
                    <Pressable
                      onPress={() => handleRemoveRequest(photo)}
                      disabled={isDeleting}
                      className="p-3 rounded-xl items-center active:opacity-70 flex-row justify-center"
                      style={{ backgroundColor: isDeleting ? "#aaa" : "#D32F2F" }}
                    >
                      {isDeleting ? (
                        <>
                          <ActivityIndicator size="small" color={PARCHMENT} />
                          <Text
                            className="ml-2"
                            style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: PARCHMENT }}
                          >
                            Removing…
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: PARCHMENT }}
                        >
                          Remove
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <View>
                      <View className="p-3 rounded-xl items-center" style={{ backgroundColor: "#e0e0e0" }}>
                        <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: "#888" }}>
                          Cannot remove
                        </Text>
                      </View>
                      <Text className="mt-2 text-xs text-center" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                        Only the uploader can remove this photo.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View 
            className="w-full max-w-sm rounded-2xl p-5 border"
            style={{ backgroundColor: PARCHMENT, borderColor: BORDER_SOFT }}
          >
            {/* Header */}
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                <Ionicons name="warning" size={22} color="#D32F2F" />
              </View>
              <Text className="text-lg font-semibold flex-1" style={{ fontFamily: "Raleway_600SemiBold", color: TEXT_PRIMARY_STRONG }}>
                Remove this photo?
              </Text>
            </View>

            {/* Photo info */}
            {photoToDelete && (
              <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: CARD_BACKGROUND_LIGHT }}>
                {photoToDelete.caption ? (
                  <Text className="mb-2" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }} numberOfLines={2}>
                    &ldquo;{photoToDelete.caption}&rdquo;
                  </Text>
                ) : null}
                <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                  Uploaded by: {getUploaderName(photoToDelete)}
                </Text>
              </View>
            )}

            {/* Warning text */}
            <Text className="mb-5" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
              This will remove it from the app. This can&apos;t be undone.
            </Text>

            {/* Action buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCancelDelete}
                className="flex-1 p-3 rounded-xl items-center border active:opacity-70"
                style={{ borderColor: BORDER_SOFT }}
              >
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: TEXT_PRIMARY_STRONG }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                className="flex-1 p-3 rounded-xl items-center active:opacity-70"
                style={{ backgroundColor: "#D32F2F" }}
              >
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: PARCHMENT }}>
                  Confirm Remove
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
