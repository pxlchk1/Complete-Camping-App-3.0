import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, PARCHMENT, TEXT_PRIMARY_STRONG, TEXT_SECONDARY } from "../constants/colors";

interface Props {
  children: React.ReactNode;
  navigation?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: number;
}

export class CommunityErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0, lastErrorTime: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    const newErrorCount = timeSinceLastError < 5000 ? this.state.errorCount + 1 : 1;
    
    console.error("[CommunityErrorBoundary] Crash caught:", {
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      componentStack: info.componentStack?.split("\n").slice(0, 10).join("\n"),
      errorCount: newErrorCount,
      timeSinceLastError,
    });
    
    this.setState({ errorCount: newErrorCount, lastErrorTime: now });
    
    // Auto-retry once if this is the first error in 5 seconds
    // This handles transient navigation timing issues
    if (newErrorCount === 1 && timeSinceLastError >= 5000) {
      console.log("[CommunityErrorBoundary] Auto-retrying after first error");
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.navigation) {
      this.props.navigation.navigate("Home");
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: PARCHMENT,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Ionicons name="alert-circle-outline" size={64} color={DEEP_FOREST} />
          <Text
            style={{
              fontFamily: "Raleway_700Bold",
              fontSize: 24,
              color: TEXT_PRIMARY_STRONG,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: "SourceSans3_400Regular",
              fontSize: 16,
              color: TEXT_SECONDARY,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            We hit a snag loading this section.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              style={{
                fontFamily: "SourceSans3_400Regular",
                fontSize: 12,
                color: "#dc2626",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {this.state.error.message}
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={this.handleRetry}
              style={{
                backgroundColor: DEEP_FOREST,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  fontSize: 15,
                  color: PARCHMENT,
                }}
              >
                Try again
              </Text>
            </Pressable>
            <Pressable
              onPress={this.handleGoHome}
              style={{
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: DEEP_FOREST,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  fontSize: 15,
                  color: DEEP_FOREST,
                }}
              >
                Go home
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
