/**
 * Auth Context
 * Provides authentication state throughout the app
 * Wraps zustand store with React Context for compatibility
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useAuthStore } from "../state/authStore";

interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreUser = useAuthStore((state) => state.setUser);
  const signOutStore = useAuthStore((state) => state.signOut);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
      
      // Sync with zustand store
      if (firebaseUser) {
        setStoreUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          handle: "",
          displayName: firebaseUser.displayName || undefined,
          avatarUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
        });
      } else {
        signOutStore();
      }
    });

    return () => unsubscribe();
  }, [setStoreUser, signOutStore]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
