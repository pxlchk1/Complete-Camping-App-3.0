import React, { useRef, useEffect, useState, useCallback } from "react";
import { Modal, View, Text, Pressable, ScrollView, Linking, Platform, ActivityIndicator, Animated } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Park } from "../types/camping";
import { useTripsStore } from "../state/tripsStore";
import { useUserStatus } from "../utils/authHelper";
import { auth } from "../config/firebase";
import { 
  isParkFavorited, 
  addFavoritePark, 
  removeFavoritePark 
} from "../services/favoriteParksService";
import { DEEP_FOREST, PARCHMENT, BORDER_SOFT, RUST, GRANITE_GOLD, EARTH_GREEN } from "../constants/colors";

// Success green color for confirmation
const SUCCESS_GREEN = "#2E7D32";

interface ParkDetailModalProps {
  visible: boolean;
  park: Park | null;
  onClose: () => void;
  onAddToTrip: (park: Park, tripId?: string) => void;
  onRequireAccount?: () => void;
}

export default function ParkDetailModal({ visible, park, onClose, onAddToTrip, onRequireAccount }: ParkDetailModalProps) {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  const { isGuest } = useUserStatus();
  const trips = useTripsStore((s) => s.trips);
  
  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Add to trip confirmation state
  const [addedToTripId, setAddedToTripId] = useState<string | null>(null);
  const [addedToNewTrip, setAddedToNewTrip] = useState(false);
  const successScale = useRef(new Animated.Value(1)).current;

  // Get the most recent trip that is planning, upcoming, or active
  const activeTrip = trips.find((trip) =>
    trip.status === "planning" || trip.status === "upcoming" || trip.status === "active"
  );

  // Reset added state when modal closes or park changes
  useEffect(() => {
    if (!visible) {
      // Reset after modal closes
      setTimeout(() => {
        setAddedToTripId(null);
        setAddedToNewTrip(false);
        successScale.setValue(1);
      }, 300);
    }
  }, [visible]);

  // Check favorite status when modal opens
  useEffect(() => {
    if (visible && park) {
      checkFavoriteStatus();
      // Reset add state when opening for a new park
      setAddedToTripId(null);
      setAddedToNewTrip(false);
    }
  }, [visible, park]);

  // Handler for adding park to trip with confirmation
  const handleAddToTripWithConfirmation = useCallback((tripId?: string) => {
    if (isGuest) {
      onClose();
      navigation.navigate("Auth" as never);
      return;
    }
    
    if (!park) return;
    
    // Call the parent handler
    onAddToTrip(park, tripId);
    
    // Show success confirmation
    if (tripId) {
      setAddedToTripId(tripId);
    } else {
      setAddedToNewTrip(true);
    }
    
    // Haptic feedback - success notification
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Animate the button
    Animated.sequence([
      Animated.timing(successScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isGuest, park, onAddToTrip, onClose, navigation, successScale]);

  const checkFavoriteStatus = async () => {
    const user = auth.currentUser;
    if (!user || !park) {
      setIsFavorited(false);
      return;
    }
    
    try {
      const fav = await isParkFavorited(user.uid, park.id);
      setIsFavorited(fav);
    } catch (error) {
      console.error("[ParkDetail] Error checking favorite status:", error);
    }
  };

  const handleToggleFavorite = async () => {
    const user = auth.currentUser;
    
    if (!user || isGuest) {
      // Show account required modal
      if (onRequireAccount) {
        onRequireAccount();
      } else {
        onClose();
        navigation.navigate("Auth" as any);
      }
      return;
    }
    
    if (!park) return;
    
    try {
      setFavoriteLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (isFavorited) {
        await removeFavoritePark(user.uid, park.id);
        setIsFavorited(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await addFavoritePark(user.uid, park);
        setIsFavorited(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[ParkDetail] Error toggling favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    if (park && mapRef.current) {
      // Zoom to park location when modal opens
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: park.latitude,
          longitude: park.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 500);
      }, 300);
    }
  }, [park, visible]);

  if (!park) return null;

  const handleDriveThere = () => {
    const destination = encodeURIComponent(park.address);
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${destination}`,
      android: `geo:0,0?q=${destination}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to web
        Linking.openURL(`https://maps.apple.com/?daddr=${destination}`);
      });
    }
  };

  const handleReserveSite = () => {
    if (park.url) {
      Linking.openURL(park.url);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: PARCHMENT }}>
        {/* Header - Deep Forest Green background */}
        <View
          style={{
            paddingTop: 30,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: DEEP_FOREST,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text
              style={{
                fontFamily: "Raleway_700Bold",
                fontSize: 24,
                color: PARCHMENT,
                flex: 1,
                marginRight: 12,
              }}
            >
              {park.name}
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color={PARCHMENT} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Address */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4 }}>
              <Ionicons name="location" size={18} color={GRANITE_GOLD} style={{ marginTop: 2 }} />
              <Text
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 15,
                  color: EARTH_GREEN,
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                {park.address}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ width: "100%", marginBottom: 24, gap: 12 }}>
            {/* Add to Current Trip or Create New Trip */}
            {activeTrip ? (
              <>
                {/* Add to Current Trip */}
                <Animated.View style={{ transform: [{ scale: addedToTripId === activeTrip.id ? successScale : 1 }] }}>
                  <Pressable
                    onPress={() => handleAddToTripWithConfirmation(activeTrip.id)}
                    disabled={addedToTripId === activeTrip.id}
                    style={{
                      backgroundColor: addedToTripId === activeTrip.id ? SUCCESS_GREEN : PARCHMENT,
                      borderRadius: 16,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderWidth: 1,
                      borderColor: addedToTripId === activeTrip.id ? SUCCESS_GREEN : BORDER_SOFT,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: addedToTripId === activeTrip.id ? 1 : 1,
                    }}
                  >
                    <Ionicons 
                      name={addedToTripId === activeTrip.id ? "checkmark-circle" : "add-circle"} 
                      size={20} 
                      color={addedToTripId === activeTrip.id ? PARCHMENT : DEEP_FOREST} 
                    />
                    <Text
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 16,
                        color: addedToTripId === activeTrip.id ? PARCHMENT : DEEP_FOREST,
                        marginLeft: 8,
                      }}
                    >
                      {addedToTripId === activeTrip.id ? `Added to ${activeTrip.name}!` : `Add to ${activeTrip.name}`}
                    </Text>
                  </Pressable>
                </Animated.View>

                {/* Add to New Trip */}
                <Animated.View style={{ transform: [{ scale: addedToNewTrip ? successScale : 1 }] }}>
                  <Pressable
                    onPress={() => handleAddToTripWithConfirmation()}
                    disabled={addedToNewTrip}
                    style={{
                      backgroundColor: addedToNewTrip ? SUCCESS_GREEN : PARCHMENT,
                      borderRadius: 16,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderWidth: 1,
                      borderColor: addedToNewTrip ? SUCCESS_GREEN : BORDER_SOFT,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons 
                      name={addedToNewTrip ? "checkmark-circle" : "calendar-outline"} 
                      size={20} 
                      color={addedToNewTrip ? PARCHMENT : DEEP_FOREST} 
                    />
                    <Text
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 16,
                        color: addedToNewTrip ? PARCHMENT : DEEP_FOREST,
                        marginLeft: 8,
                      }}
                    >
                      {addedToNewTrip ? "Creating new trip..." : "Add to new trip"}
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : (
              /* No active trip - just show create new trip */
              <Animated.View style={{ transform: [{ scale: addedToNewTrip ? successScale : 1 }] }}>
                <Pressable
                  onPress={() => handleAddToTripWithConfirmation()}
                  disabled={addedToNewTrip}
                  style={{
                    backgroundColor: addedToNewTrip ? SUCCESS_GREEN : PARCHMENT,
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderWidth: 1,
                    borderColor: addedToNewTrip ? SUCCESS_GREEN : BORDER_SOFT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons 
                    name={addedToNewTrip ? "checkmark-circle" : "add-circle"} 
                    size={20} 
                    color={addedToNewTrip ? PARCHMENT : DEEP_FOREST} 
                  />
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 16,
                      color: addedToNewTrip ? PARCHMENT : DEEP_FOREST,
                      marginLeft: 8,
                    }}
                  >
                    {addedToNewTrip ? "Creating new trip..." : "Add to trip"}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Reserve a Site */}
            <Pressable
              onPress={handleReserveSite}
              style={{
                backgroundColor: DEEP_FOREST,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderWidth: 0,
                marginTop: 4,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="calendar" size={20} color={PARCHMENT} />
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  fontSize: 16,
                  color: PARCHMENT,
                  marginLeft: 8,
                }}
              >
                Reserve a Site
              </Text>
            </Pressable>

            {/* Bottom row of utility buttons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginTop: 8,
              }}
            >
              {/* Drive There */}
              <View style={{ width: "48%" }}>
                <Pressable
                  onPress={handleDriveThere}
                  style={{
                    backgroundColor: PARCHMENT,
                    borderRadius: 16,
                    paddingVertical: 9,
                    paddingHorizontal: 20,
                    borderWidth: 1,
                    borderColor: BORDER_SOFT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="navigate" size={18} color={DEEP_FOREST} />
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 16,
                      color: DEEP_FOREST,
                      marginLeft: 8,
                    }}
                  >
                    Drive There
                  </Text>
                </Pressable>
              </View>

              {/* Add to Favorites */}
              <View style={{ width: "48%" }}>
                <Pressable
                  onPress={handleToggleFavorite}
                  disabled={favoriteLoading}
                  style={{
                    backgroundColor: isFavorited ? RUST : PARCHMENT,
                    borderRadius: 16,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: isFavorited ? RUST : BORDER_SOFT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {favoriteLoading ? (
                    <ActivityIndicator size="small" color={isFavorited ? PARCHMENT : DEEP_FOREST} />
                  ) : (
                    <>
                      <Ionicons 
                        name={isFavorited ? "heart" : "heart-outline"} 
                        size={18} 
                        color={isFavorited ? PARCHMENT : RUST} 
                      />
                      <Text
                        style={{
                          fontFamily: "SourceSans3_600SemiBold",
                          fontSize: 12,
                          color: isFavorited ? PARCHMENT : DEEP_FOREST,
                          marginLeft: 6,
                        }}
                        numberOfLines={1}
                      >
                        {isFavorited ? "Added to favorites" : "Favorite"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Map */}
          <View
            style={{
              height: 300,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: BORDER_SOFT,
            }}
          >
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: park.latitude,
                longitude: park.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              <Marker
                coordinate={{
                  latitude: park.latitude,
                  longitude: park.longitude,
                }}
                pinColor={DEEP_FOREST}
              >
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: DEEP_FOREST,
                      borderWidth: 3,
                      borderColor: PARCHMENT,
                    }}
                  />
                </View>
              </Marker>
            </MapView>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
