/**
 * Subscription Service
 * High-level service for managing subscriptions throughout the app
 */

import * as RevenueCat from "../lib/revenuecatClient";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { useAuthStore } from "../state/authStore";
import { auth, db } from "../config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Initialize the subscription system
 * Call this once when the app starts, after Firebase auth is ready
 */
export const initSubscriptions = async (): Promise<void> => {
  try {
    console.log("[SubscriptionService] Initializing subscriptions");

    // Initialize RevenueCat SDK
    const initialized = await RevenueCat.initializeRevenueCat();

    if (!initialized) {
      console.log("[SubscriptionService] RevenueCat not available on this platform");
      return;
    }

    // Identify user if logged in
    const user = useAuthStore.getState().user;
    if (user) {
      await identifyUser(user.id);
    }

    // Don't refresh entitlements on init to avoid triggering offering errors
    // Entitlements will be checked when user actually tries to use premium features
    console.log("[SubscriptionService] Subscriptions initialized (entitlements will load on-demand)");
  } catch (error) {
    console.error("[SubscriptionService] Failed to initialize subscriptions:", error);
  }
};

/**
 * Identify user in RevenueCat
 */
export const identifyUser = async (userId: string): Promise<void> => {
  try {
    await RevenueCat.identifyUser(userId);
    console.log("[SubscriptionService] User identified (entitlements will load on-demand)");
  } catch (error) {
    console.error("[SubscriptionService] Failed to identify user:", error);
    throw error;
  }
};

/**
 * Get current customer info
 */
export const getCurrentCustomerInfo = async () => {
  return await RevenueCat.getCustomerInfo();
};

/**
 * Subscribe to a plan
 */
export const subscribeToPlan = async (packageIdentifier: string): Promise<boolean> => {
  const { setLoading, setError, setSubscriptionInfo } = useSubscriptionStore.getState();

  try {
    setLoading(true);
    setError(null);

    // Get the package
    const pkg = await RevenueCat.getPackage(packageIdentifier);
    if (!pkg) {
      throw new Error("Package not found");
    }

    // Purchase the package
    const customerInfo = await RevenueCat.purchasePackage(pkg);

    if (customerInfo) {
      // Update store with new subscription info
      setSubscriptionInfo(customerInfo);
      return true;
    }

    return false; // User cancelled
  } catch (error: any) {
    console.error("[SubscriptionService] Purchase failed:", error);
    setError(error.message || "Purchase failed");
    throw error;
  } finally {
    setLoading(false);
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<boolean> => {
  const { setLoading, setError, setSubscriptionInfo } = useSubscriptionStore.getState();

  try {
    setLoading(true);
    setError(null);

    const customerInfo = await RevenueCat.restorePurchases();

    if (customerInfo) {
      setSubscriptionInfo(customerInfo);

      // Check if any entitlements were restored
      const hasEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
      return hasEntitlements;
    }

    return false;
  } catch (error: any) {
    console.error("[SubscriptionService] Restore failed:", error);
    setError(error.message || "Failed to restore purchases");
    throw error;
  } finally {
    setLoading(false);
  }
};

/**
 * Refresh entitlements from RevenueCat
 */
export const refreshEntitlements = async (): Promise<void> => {
  const { setLoading, setSubscriptionInfo } = useSubscriptionStore.getState();

  try {
    setLoading(true);

    const customerInfo = await RevenueCat.getCustomerInfo();
    setSubscriptionInfo(customerInfo);
  } catch (error) {
    console.error("[SubscriptionService] Failed to refresh entitlements:", error);
  } finally {
    setLoading(false);
  }
};

/**
 * Log out user from RevenueCat
 */
export const logOutSubscriptions = async (): Promise<void> => {
  try {
    await RevenueCat.logOut();
    useSubscriptionStore.getState().clearSubscription();
  } catch (error) {
    console.error("[SubscriptionService] Failed to log out:", error);
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async () => {
  return await RevenueCat.getOfferings();
};

/**
 * Sync RevenueCat subscription status to Firestore users/{uid}
 * Maps RevenueCat entitlements to membership tiers and subscription status
 */
export const syncSubscriptionToFirestore = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("[SubscriptionService] No user logged in, skipping Firestore sync");
    return;
  }

  try {
    const customerInfo = await RevenueCat.getCustomerInfo();
    if (!customerInfo) {
      console.log("[SubscriptionService] No customer info available");
      return;
    }

    // Determine membership tier based on entitlements
    let membershipTier = "freeMember";
    let subscriptionStatus = "none";

    const activeEntitlements = customerInfo.entitlements.active;

    if (Object.keys(activeEntitlements).length > 0) {
      // User has active subscription - set to subscribed
      membershipTier = "subscribed";
      subscriptionStatus = "active";
    } else {
      // Check if subscription is cancelled or expired
      const allEntitlements = customerInfo.entitlements.all;
      if (Object.keys(allEntitlements).length > 0) {
        const hasExpired = Object.values(allEntitlements).some(
          (ent: any) => ent.expirationDate && new Date(ent.expirationDate) < new Date()
        );
        subscriptionStatus = hasExpired ? "expired" : "canceled";
      }
    }

    // Update Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      membershipTier,
      subscriptionProvider: "revenuecat",
      subscriptionStatus,
      subscriptionUpdatedAt: serverTimestamp(),
    });

    console.log(`[SubscriptionService] Synced to Firestore: ${membershipTier} / ${subscriptionStatus}`);
  } catch (error) {
    console.error("[SubscriptionService] Failed to sync to Firestore:", error);
    // Don't throw - this is a background sync operation
  }
};

