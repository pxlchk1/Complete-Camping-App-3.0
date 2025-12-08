import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTripsStore } from "../state/tripsStore";
import { Heading2, BodyText } from "../components/Typography";
import Button from "../components/Button";
import AccountButton from "../components/AccountButton";
import { RootStackParamList } from "../navigation/types";
import { CampingStyle } from "../types/camping";
import { DEEP_FOREST, EARTH_GREEN, GRANITE_GOLD, RIVER_ROCK, SIERRA_SKY, PARCHMENT, PARCHMENT_BORDER } from "../constants/colors";

type CreateTripScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreateTrip"
>;

const CAMPING_STYLES: { value: CampingStyle; label: string }[] = [
  { value: "CAR_CAMPING", label: "Car camping" },
  { value: "BACKPACKING", label: "Backpacking" },
  { value: "RV", label: "RV camping" },
  { value: "HAMMOCK", label: "Hammock camping" },
  { value: "ROOFTOP_TENT", label: "Roof-top tent camping" },
  { value: "OVERLANDING", label: "Overlanding" },
  { value: "BOAT_CANOE", label: "Boat or canoe camping" },
  { value: "BIKEPACKING", label: "Bikepacking" },
  { value: "WINTER", label: "Winter camping" },
  { value: "DISPERSED", label: "Dispersed camping" },
];

export default function CreateTripScreen() {
  const navigation = useNavigation<CreateTripScreenNavigationProp>();
  const addTrip = useTripsStore((s) => s.addTrip);

  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 2)); // 2 days later
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [campingStyle, setCampingStyle] = useState<CampingStyle | undefined>();
  const [partySize, setPartySize] = useState("");

  const handleCreate = () => {
    if (!tripName.trim()) {
      alert("Please enter a trip name");
      return;
    }

    addTrip({
      name: tripName.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      campingStyle,
      partySize: partySize ? parseInt(partySize) : undefined,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 border-b border-parchmentDark">
          <View className="flex-row items-center justify-between">
            <Heading2>Plan New Trip</Heading2>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-[#f0f9f4] items-center justify-center active:bg-[#dcf3e5]"
              >
                <Text className="text-forest text-lg" style={{ fontFamily: "SourceSans3_400Regular" }}>✕</Text>
              </Pressable>
              <AccountButton />
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          {/* Trip Name */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Trip Name</Text>
            <TextInput
              value={tripName}
              onChangeText={setTripName}
              placeholder="e.g., Yosemite Weekend"
              placeholderTextColor="#999"
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3 text-base text-[#16492f]"
            />
          </View>

          {/* Dates */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Start Date</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowStartDateModal(true);
              }}
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3"
            >
              <Text className="text-base text-[#16492f]" style={{ fontFamily: "SourceSans3_400Regular" }}>
                {startDate.toLocaleDateString()}
              </Text>
            </Pressable>
          </View>

          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>End Date</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEndDateModal(true);
              }}
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3"
            >
              <Text className="text-base text-[#16492f]" style={{ fontFamily: "SourceSans3_400Regular" }}>
                {endDate.toLocaleDateString()}
              </Text>
            </Pressable>
          </View>

          {/* Camping Style */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Camping Style</Text>
            <View className="flex-row flex-wrap gap-2">
              {CAMPING_STYLES.map((style) => (
                <Pressable
                  key={style.value}
                  onPress={() => setCampingStyle(style.value)}
                  className={`px-4 py-2 rounded-full ${
                    campingStyle === style.value
                      ? "bg-forest"
                      : "bg-[#f0f9f4] active:bg-[#dcf3e5]"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      campingStyle === style.value ? "text-parchment" : "text-forest"
                    }`}
                  >
                    {style.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Party Size */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Party Size</Text>
            <TextInput
              value={partySize}
              onChangeText={setPartySize}
              placeholder="Number of people"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3 text-base text-[#16492f]"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-5 pb-5 pt-3 border-t border-parchmentDark">
          <Button onPress={handleCreate} fullWidth icon="checkmark-circle">
            Create Trip
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Start Date Modal */}
      <Modal
        visible={showStartDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartDateModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowStartDateModal(false)}
        >
          <Pressable
            className="bg-parchment rounded-t-2xl p-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
                Select Start Date
              </Text>
              <Pressable
                onPress={() => setShowStartDateModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: "#f0f9f4" }}
              >
                <Ionicons name="close" size={24} color={DEEP_FOREST} />
              </Pressable>
            </View>
            <DateTimePicker
              value={startDate}
              mode="date"
              display="inline"
              onChange={(event, date) => {
                if (date) {
                  setStartDate(date);
                  setShowStartDateModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              themeVariant="light"
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* End Date Modal */}
      <Modal
        visible={showEndDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndDateModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowEndDateModal(false)}
        >
          <Pressable
            className="bg-parchment rounded-t-2xl p-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
                Select End Date
              </Text>
              <Pressable
                onPress={() => setShowEndDateModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: "#f0f9f4" }}
              >
                <Ionicons name="close" size={24} color={DEEP_FOREST} />
              </Pressable>
            </View>
            <DateTimePicker
              value={endDate}
              mode="date"
              display="inline"
              onChange={(event, date) => {
                if (date) {
                  setEndDate(date);
                  setShowEndDateModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              themeVariant="light"
              minimumDate={startDate}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
