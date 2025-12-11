import React, { useState } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform, ActivityIndicator, TextInput, KeyboardAvoidingView, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { OAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "../state/authStore";
import { useUserStore } from "../state/userStore";
import { Ionicons } from "@expo/vector-icons";
import { createUserProfile } from "../services/userService";

export default function AuthLanding({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        alert("Apple Sign In is not available on this device");
        return;
      }

      // Generate nonce for security
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      // Request Apple credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Sign in with Firebase
      const { identityToken } = credential;
      if (!identityToken) {
        throw new Error("No identity token received");
      }

      const provider = new OAuthProvider("apple.com");
      const firebaseCredential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const userCredential = await signInWithCredential(auth, firebaseCredential);
      const firebaseUser = userCredential.user;

      // Check if profile exists, if not create it
      const userDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // New user - create profile
        const rawHandle = firebaseUser.displayName || credential.fullName?.givenName || "user";
        const normalizedHandle = rawHandle.toLowerCase().replace(/[^a-z0-9]/g, "");
        const displayName = firebaseUser.displayName ||
          `${credential.fullName?.givenName || ""} ${credential.fullName?.familyName || ""}`.trim() ||
          "Anonymous User";

        await createUserProfile({
          userId: firebaseUser.uid,
          email: firebaseUser.email || credential.email || "",
          displayName: displayName,
          handle: normalizedHandle,
        });
      }

      // Load profile data
      const updatedUserDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));
      const userData = updatedUserDoc.data();

      const userProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || credential.email || "",
        handle: userData?.handle || "user",
        displayName: userData?.displayName || "User",
        avatarUrl: userData?.avatarUrl || firebaseUser.photoURL || undefined,
        createdAt: userData?.joinedAt || new Date().toISOString(),
      };

      console.log("🔐 [AuthLanding - Apple] User Profile:", JSON.stringify(userProfile, null, 2));
      console.log("🔐 [AuthLanding - Apple] Firebase User Data:", JSON.stringify(userData, null, 2));

      setUser(userProfile);
      
      // Also update userStore for components that use it (like HomeScreen)
      const userStoreData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || credential.email || "",
        handle: userData?.handle || "user",
        displayName: userData?.displayName || "User",
        photoURL: userData?.avatarUrl || firebaseUser.photoURL,
        coverPhotoURL: userData?.backgroundUrl,
        about: userData?.about,
        favoriteCampingStyle: userData?.favoriteCampingStyle,
        favoriteGear: userData?.favoriteGear,
        favoriteGearDetails: userData?.favoriteGearDetails,
        role: "user",
        membershipTier: userData?.membershipTier || "free",
        isBanned: false,
        createdAt: userData?.joinedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log("🔐 [AuthLanding - Apple] Setting userStore:", JSON.stringify(userStoreData, null, 2));
      setCurrentUser(userStoreData);
      
      navigation.navigate("HomeTabs");
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        console.error("Apple Sign In Error:", error);
        alert("Failed to sign in with Apple. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setLoading(true);
      setError("");

      if (!email.trim() || !password.trim()) {
        setError("Please enter email and password");
        return;
      }

      let userCredential;

      if (isSignUp) {
        // Create new account
        if (!handle.trim() || !displayName.trim()) {
          setError("Please enter display name and handle");
          return;
        }

        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

        // Create user profile in Firestore (profiles + emailSubscribers)
        // Normalize handle - remove any @ prefix before saving
        const normalizedHandle = handle.trim().replace(/^@+/, "");

        await createUserProfile({
          userId: userCredential.user.uid,
          email: email.trim(),
          displayName: displayName.trim(),
          handle: normalizedHandle,
        });
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      const firebaseUser = userCredential.user;

      // Load user profile from Firestore
      const userDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));
      const userData = userDoc.data();

      const userProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email.trim(),
        handle: userData?.handle || firebaseUser.displayName || "user",
        displayName: userData?.displayName || firebaseUser.displayName || "User",
        avatarUrl: userData?.photoURL || firebaseUser.photoURL || undefined,
        createdAt: userData?.createdAt || new Date().toISOString(),
      };

      console.log("🔐 [AuthLanding - Email] User Profile:", JSON.stringify(userProfile, null, 2));
      console.log("🔐 [AuthLanding - Email] Firebase User Data:", JSON.stringify(userData, null, 2));

      setUser(userProfile);
      
      // Also update userStore for components that use it (like HomeScreen)
      const userStoreData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email.trim(),
        handle: userData?.handle || firebaseUser.displayName || "user",
        displayName: userData?.displayName || firebaseUser.displayName || "User",
        photoURL: userData?.avatarUrl || firebaseUser.photoURL,
        coverPhotoURL: userData?.backgroundUrl,
        about: userData?.about,
        favoriteCampingStyle: userData?.favoriteCampingStyle,
        favoriteGear: userData?.favoriteGear,
        favoriteGearDetails: userData?.favoriteGearDetails,
        role: "user",
        membershipTier: userData?.membershipTier || "free",
        isBanned: false,
        createdAt: userData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log("🔐 [AuthLanding - Email] Setting userStore:", JSON.stringify(userStoreData, null, 2));
      setCurrentUser(userStoreData);
      
      navigation.navigate("HomeTabs");
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showEmailAuth) {
    return (
      <ImageBackground
        source={require('../../assets/images/splash-screen.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.overlay}>
                {/* Title at Top Center */}
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>{isSignUp ? "Create Account" : "Sign In"}</Text>
                </View>

                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowEmailAuth(false);
                    setError("");
                    setEmail("");
                    setPassword("");
                    setHandle("");
                    setDisplayName("");
                  }}
                >
                  <Ionicons name="arrow-back" size={24} color="#F4EBD0" />
                </TouchableOpacity>

                <View style={styles.spacer} />

                <View style={styles.content}>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {isSignUp && (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Display Name"
                        placeholderTextColor="#828872"
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="words"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Handle (e.g., @yourname)"
                        placeholderTextColor="#828872"
                        value={handle}
                        onChangeText={setHandle}
                        autoCapitalize="none"
                      />
                    </>
                  )}

                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#828872"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#828872"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleEmailAuth}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#F4EBD0" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {isSignUp ? "Create Account" : "Sign In"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setIsSignUp(!isSignUp);
                      setError("");
                    }}
                    style={styles.switchButton}
                  >
                    <Text style={styles.switchButtonText}>
                      {isSignUp ? "Already have an account? Sign In" : "Need an account? Create One"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                  By continuing, you agree to our{" "}
                  <Text
                    style={styles.footerLink}
                    onPress={() => Linking.openURL('https://tentandlantern.com/privacy/')}
                  >
                    Terms and Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/splash-screen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.overlay}>
          {/* Spacer to push buttons to bottom */}
          <View style={{ flex: 1 }} />

          {/* Button Stack at Bottom */}
          <View style={styles.content}>
            {/* 1. Create Account - Primary CTA */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setIsSignUp(true);
                setShowEmailAuth(true);
              }}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            {/* 2. Sign In - For existing users */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setIsSignUp(false);
                setShowEmailAuth(true);
              }}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* 3. Sign in with Apple - Apple Standard Style */}
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={24} color="#FFFFFF" style={styles.appleIcon} />
                    <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* 4. Explore the App - Lowest priority */}
            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => navigation.navigate("HomeTabs")}
            >
              <Text style={styles.ghostButtonText}>Explore the App</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            By continuing, you agree to our{" "}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL('https://tentandlantern.com/privacy/')}
            >
              Terms and Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%"
  },

  safeArea: {
    flex: 1,
    paddingBottom: 0,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 0,
  },

  titleContainer: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 8,
  },

  titleText: {
    fontFamily: "JosefinSlab_700Bold",
    fontSize: 32,
    color: "#485952", // Deep Forest Green
    textAlign: "center",
  },

  spacer: {
    flex: 3,
  },

  content: {
    paddingBottom: 0,
  },

  backButton: {
    paddingTop: 20,
    paddingBottom: 10,
  },

  authTitle: {
    fontFamily: "JosefinSlab_700Bold",
    fontSize: 32,
    color: "#F4EBD0",
    textAlign: "center",
    marginBottom: 24,
  },

  input: {
    backgroundColor: "rgba(244, 235, 208, 0.9)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    fontFamily: "SourceSans3_400Regular",
    fontSize: 16,
    color: "#485952",
  },

  errorText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    borderRadius: 8,
  },

  switchButton: {
    marginTop: 16,
  },

  switchButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 14,
    color: "#F4EBD0",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  primaryButton: {
    backgroundColor: "#485952",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8
  },

  primaryButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: "#F4EBD0",
    textAlign: "center"
  },

  appleButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },

  appleIcon: {
    marginRight: 8
  },

  appleButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center"
  },

  secondaryButton: {
    backgroundColor: "#828872",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8
  },

  secondaryButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: "#F4EBD0",
    textAlign: "center"
  },

  ghostButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#F4EBD0",
    marginBottom: 0
  },

  ghostButtonText: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 18,
    color: "#F4EBD0",
    textAlign: "center"
  },

  footerText: {
    fontFamily: "SourceSans3_400Regular",
    fontSize: 12,
    color: "#F4EBD0",
    opacity: 0.8,
    textAlign: "center",
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 0,
  },

  footerLink: {
    fontFamily: "SourceSans3_600SemiBold",
    fontSize: 12,
    color: "#F4EBD0",
    textDecorationLine: "underline",
  }
});
