import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/user";

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  clearCurrentUser: () => void;
  isAuthenticated: () => boolean;
  isModerator: () => boolean;
  isAdministrator: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      updateCurrentUser: (updates) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...updates }
            : null,
        })),

      clearCurrentUser: () => set({ currentUser: null }),

      isAuthenticated: () => get().currentUser !== null,

      isModerator: () => {
        const user = get().currentUser;
        return user?.role === "moderator" || user?.role === "administrator";
      },

      isAdministrator: () => {
        const user = get().currentUser;
        return user?.role === "administrator";
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selector hooks
export const useCurrentUser = () => useUserStore((s) => s.currentUser);
export const useIsAuthenticated = () => useUserStore((s) => s.isAuthenticated());
export const useIsModerator = () => useUserStore((s) => s.isModerator());
export const useIsAdministrator = () => useUserStore((s) => s.isAdministrator());

// Helper to create test user (for development)
export function createTestUser(role: User["role"] = "administrator"): User {
  return {
    id: "test_user_1",
    email: "admin@tentandlantern.com",
    handle: "campingadmin",
    displayName: "Camping Admin",
    photoURL: undefined,
    role,
    membershipTier: "premium",
    membershipExpiresAt: undefined,
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

