import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
  JosefinSlab_600SemiBold,
  JosefinSlab_700Bold,
} from "@expo-google-fonts/josefin-slab";
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from "@expo-google-fonts/source-sans-3";
import { Satisfy_400Regular } from "@expo-google-fonts/satisfy";
import RootNavigator from "./src/navigation/RootNavigator";
import { ToastProvider } from "./src/components/ToastManager";
import { FireflyTimeProvider } from "./src/context/FireflyTimeContext";
import { View, ImageBackground } from "react-native";
import { useEffect, useState } from "react";
import { initSubscriptions, identifyUser } from "./src/services/subscriptionService";
import { useAuthStore } from "./src/state/authStore";
import { auth } from "./src/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const [fontsLoaded] = useFonts({
    // Display Font: Josefin Slab (NEVER use 400Regular - use SemiBold instead)
    JosefinSlab_600SemiBold,
    JosefinSlab_700Bold,
    // Body Font: Source Sans 3
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
    // Accent Font: Satisfy (use very sparingly)
    Satisfy_400Regular,
  });

  const [appReady, setAppReady] = useState(false);
  const [subscriptionsInitialized, setSubscriptionsInitialized] = useState(false);

  // Initialize subscriptions ONCE at app launch (anonymous, before auth)
  useEffect(() => {
    if (fontsLoaded && !subscriptionsInitialized) {
      console.log("[App] Initializing subscriptions anonymously");
      initSubscriptions()
        .then(() => {
          setSubscriptionsInitialized(true);
          console.log("[App] Subscriptions initialized");
        })
        .catch((error) => {
          console.error("[App] Failed to initialize subscriptions:", error);
          setSubscriptionsInitialized(true); // Continue even if init fails
        });
    }
  }, [fontsLoaded, subscriptionsInitialized]);

  // Listen for Firebase auth state changes and identify user in RevenueCat
  useEffect(() => {
    if (!subscriptionsInitialized) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[App] Firebase user signed in:", firebaseUser.uid);
        try {
          // Identify user in RevenueCat with Firebase uid
          await identifyUser(firebaseUser.uid);
          console.log("[App] User identified in RevenueCat");
        } catch (error) {
          console.error("[App] Failed to identify user in RevenueCat:", error);
        }
      } else {
        console.log("[App] Firebase user signed out");
        // User remains anonymous in RevenueCat or call logOut if needed
      }
    });

    return () => unsubscribe();
  }, [subscriptionsInitialized]);

  // Show splash screen for minimum 2 seconds
  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => {
        setAppReady(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !appReady) {
    return (
      <ImageBackground
        source={require('./assets/images/splash-screen.png')}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    );
  }

  return (
    <FireflyTimeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ToastProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </FireflyTimeProvider>
  );
}
