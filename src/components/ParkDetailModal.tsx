import React, { useRef, useEffect } from "react";
import { Modal, View, Text, Pressable, ScrollView, Linking, Platform } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Park } from "../types/camping";
import { useLocationStore } from "../state/locationStore";
import { useTripsStore } from "../state/tripsStore";
import { useUserStatus } from "../utils/authHelper";
import { DEEP_FOREST, EARTH_GREEN, GRANITE_GOLD, PARCHMENT, BORDER_SOFT } from "../constants/colors";

interface ParkDetailModalProps {
  visible: boolean;
  park: Park | null;
  onClose: () => void;
  onAddToTrip: (park: Park, tripId?: string) => void;
  onCheckWeather?: (park: Park) => void;
}

export default function ParkDetailModal({ visible, park, onClose, onAddToTrip, onCheckWeather }: ParkDetailModalProps) {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  const { isGuest } = useUserStatus();
  const setSelectedLocation = useLocationStore((s) => s.setSelectedLocation);
  const trips = useTripsStore((s) => s.trips);

  // Get the most recent trip that is planning, upcoming, or active
  const activeTrip = trips.find((trip) =>
    trip.status === "planning" || trip.status === "upcoming" || trip.status === "active"
  );

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

  const handleCheckWeather = () => {
    if (park) {
      // Save location to store
      setSelectedLocation({
        name: park.name,
        latitude: park.latitude,
        longitude: park.longitude,
        state: park.state,
      });

      // Call the callback if provided
      if (onCheckWeather) {
        onCheckWeather(park);
      }
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
        {/* Header */}
        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_SOFT,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text
              style={{
                fontFamily: "JosefinSlab_700Bold",
                fontSize: 24,
                color: DEEP_FOREST,
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
                backgroundColor: "#f0f9f4",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color={DEEP_FOREST} />
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
                <Pressable
                  onPress={() => {
                    if (isGuest) {
                      onClose();
                      navigation.navigate("Auth" as any);
                      return;
                    }
                    onAddToTrip(park, activeTrip.id);
                  }}
                  style={{
                    backgroundColor: PARCHMENT,
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderWidth: 1,
                    borderColor: BORDER_SOFT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="add-circle" size={20} color={DEEP_FOREST} />
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 16,
                      color: DEEP_FOREST,
                      marginLeft: 8,
                    }}
                  >
                    Add to {activeTrip.name}
                  </Text>
                </Pressable>

                {/* Add to New Trip */}
                <Pressable
                  onPress={() => {
                    if (isGuest) {
                      onClose();
                      navigation.navigate("Auth" as any);
                      return;
                    }
                    onAddToTrip(park);
                  }}
                  style={{
                    backgroundColor: PARCHMENT,
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderWidth: 1,
                    borderColor: BORDER_SOFT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={DEEP_FOREST} />
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 16,
                      color: DEEP_FOREST,
                      marginLeft: 8,
                    }}
                  >
                    Add to New Trip
                  </Text>
                </Pressable>
              </>
            ) : (
              /* No active trip - just show create new trip */
              <Pressable
                onPress={() => {
                  if (isGuest) {
                    onClose();
                    navigation.navigate("Auth" as any);
                    return;
                  }
                  onAddToTrip(park);
                }}
                style={{
                  backgroundColor: PARCHMENT,
                  borderRadius: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add-circle" size={20} color={DEEP_FOREST} />
                <Text
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    fontSize: 16,
                    color: DEEP_FOREST,
                    marginLeft: 8,
                  }}
                >
                  Add to Trip
                </Text>
              </Pressable>
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

              {/* Check Weather */}
              <View style={{ width: "48%" }}>
                <Pressable
                  onPress={handleCheckWeather}
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
                  <Ionicons name="cloud" size={18} color={DEEP_FOREST} />
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 16,
                      color: DEEP_FOREST,
                      marginLeft: 8,
                    }}
                  >
                    Weather
                  </Text>
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
