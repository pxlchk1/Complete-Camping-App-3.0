import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { RootStackNavigationProp } from "../../navigation/types";
import { createQuestion } from "../../api/qa-service";
import { useAuthStore } from "../../state/authStore";
import { useToast } from "../../components/ToastManager";

export default function AskQuestionModal() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const [question, setQuestion] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!question.trim()) {
      showError("Please enter a question");
      return;
    }

    if (!user) {
      navigation.goBack();
      return;
    }

    try {
      setSubmitting(true);

      await createQuestion(
        question.trim(),
        details.trim(),
        user.id
      );

      showSuccess("Question posted successfully!");

      // Close the modal
      navigation.goBack();
    } catch {
      showError("Failed to post question. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={() => navigation.goBack()}
    >
      <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-6 py-4 border-b border-cream-200">
            <View className="flex-row justify-between items-center">
              <Pressable onPress={() => navigation.goBack()} className="active:opacity-70">
                <Ionicons name="close" size={28} color="#1F1F1F" />
              </Pressable>
              <Text className="text-lg text-forest-800" style={{ fontFamily: "JosefinSlab_700Bold" }}>Ask a Question</Text>
              <Pressable
                onPress={onSubmit}
                disabled={submitting || !question.trim()}
                className={`px-4 py-2 rounded-full ${
                  submitting || !question.trim()
                    ? "bg-stone-300"
                    : "bg-forest-800 active:bg-forest-900"
                }`}
              >
                <Text className="text-parchment" style={{ fontFamily: "SourceSans3_600SemiBold" }}>
                  {submitting ? "Posting..." : "Post"}
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            {/* Question */}
            <View className="mb-4">
              <Text className="text-base text-forest-800 mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>
                Question <Text className="text-red-600" style={{ fontFamily: "SourceSans3_600SemiBold" }}>*</Text>
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="What do you want to know?"
                placeholderTextColor="#9ca3af"
                className="bg-cream-50 rounded-xl px-4 py-3 text-base text-forest-800 border border-cream-200"
                style={{ fontFamily: "SourceSans3_400Regular" }}
                maxLength={200}
              />
            </View>

            {/* Details */}
            <View className="mb-4">
              <Text className="text-base text-forest-800 mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>
                Details (Optional)
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Provide more context about your question..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-cream-50 rounded-xl px-4 py-3 text-base text-forest-800 border border-cream-200"
                style={{ minHeight: 120, fontFamily: "SourceSans3_400Regular" }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
