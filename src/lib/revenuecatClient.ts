/**
 * RevenueCat Client Wrapper
 * Handles all RevenueCat SDK interactions for subscription management
 */

import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat API Keys - Using existing Complete Camping App project
const REVENUECAT_API_KEY_IOS = "appl_CXLKpXutDryiSmKJsclChUqLmie"; // Complete Camping App (App Store)
const REVENUECAT_API_KEY_ANDROID = ""; // Add when Android is needed

let isInitialized = false;
let isConfigured = false;

// Store original console.error to filter RevenueCat configuration errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Suppress expected RevenueCat configuration errors
  const errorString = args.join(' ');
  if (
    errorString.includes('[RevenueCat]') &&
    (errorString.includes('Error fetching offerings') ||
     errorString.includes('products registered') ||
     errorString.includes('why-are-offerings-empty'))
  ) {
    // Silently ignore - this is expected until App Store Connect API is configured
    return;
  }
  // Pass through all other errors
  originalConsoleError.apply(console, args);
};

/**
 * Check if RevenueCat is properly configured
 */
export const isRevenueCatEnabled = (): boolean => {
  return isConfigured && isInitialized;
};

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts, after user auth is ready
 */
export const initializeRevenueCat = async (): Promise<boolean> => {
  try {
    // Check if we're on web - RevenueCat doesn't work on web
    if (Platform.OS === "web") {
      console.log("[RevenueCat] Running on web - purchases disabled");
      isConfigured = false;
      return false;
    }

    // Check if API key is configured
    const apiKey = Platform.OS === "ios" ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    if (!apiKey) {
      console.log("[RevenueCat] No API key configured for platform:", Platform.OS);
      isConfigured = false;
      return false;
    }

    if (isInitialized) {
      console.log("[RevenueCat] Already initialized");
      return true;
    }

    // Set log level to suppress configuration warnings BEFORE configuring
    // These errors are expected until App Store Connect API credentials are configured
    // Setting to WARN level will hide offering fetch errors but show important warnings
    Purchases.setLogLevel(LOG_LEVEL.WARN);

    await Purchases.configure({ apiKey });

    isInitialized = true;
    isConfigured = true;
    console.log("[RevenueCat] Successfully initialized");
    return true;
  } catch (error) {
    console.error("[RevenueCat] Failed to initialize:", error);
    isConfigured = false;
    return false;
  }
};

/**
 * Identify the user in RevenueCat
 * Should be called after Firebase auth is complete
 */
export const identifyUser = async (userId: string): Promise<void> => {
  if (!isRevenueCatEnabled()) {
    console.log("[RevenueCat] Not configured - skipping user identification");
    return;
  }

  try {
    await Purchases.logIn(userId);
    console.log("[RevenueCat] User identified:", userId);
  } catch (error) {
    console.error("[RevenueCat] Failed to identify user:", error);
    throw error;
  }
};

/**
 * Get current customer info including entitlements
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!isRevenueCatEnabled()) {
    console.log("[RevenueCat] Not configured - returning null customer info");
    return null;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error: any) {
    // Suppress configuration errors - these are expected until App Store Connect API is configured
    if (error?.message?.includes("configuration") || error?.message?.includes("products registered")) {
      console.log("[RevenueCat] Customer info not available yet - configure App Store Connect API credentials");
      return null;
    }
    console.error("[RevenueCat] Failed to get customer info:", error);
    return null;
  }
};

/**
 * Check if user has a specific entitlement
 */
export const hasEntitlement = async (entitlementId: string): Promise<boolean> => {
  if (!isRevenueCatEnabled()) {
    return false;
  }

  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[entitlementId];
    return entitlement !== undefined && entitlement !== null;
  } catch (error) {
    console.error("[RevenueCat] Failed to check entitlement:", error);
    return false;
  }
};

/**
 * Check if user has any active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  if (!isRevenueCatEnabled()) {
    return false;
  }

  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error("[RevenueCat] Failed to check active subscription:", error);
    return false;
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  if (!isRevenueCatEnabled()) {
    console.log("[RevenueCat] Not configured - returning null offerings");
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error: any) {
    // Suppress configuration errors - these are expected until App Store Connect API is configured
    if (error?.message?.includes("configuration") || error?.message?.includes("products registered")) {
      console.log("[RevenueCat] Offerings not available yet - configure App Store Connect API credentials in RevenueCat dashboard");
      return null;
    }
    console.error("[RevenueCat] Failed to get offerings:", error);
    return null;
  }
};

/**
 * Get a specific package by identifier
 */
export const getPackage = async (packageIdentifier: string): Promise<PurchasesPackage | null> => {
  if (!isRevenueCatEnabled()) {
    return null;
  }

  try {
    const offering = await getOfferings();
    if (!offering) return null;

    const pkg = offering.availablePackages.find(
      (p) => p.identifier === packageIdentifier
    );
    return pkg || null;
  } catch (error) {
    console.error("[RevenueCat] Failed to get package:", error);
    return null;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> => {
  if (!isRevenueCatEnabled()) {
    throw new Error("RevenueCat is not configured. Please check your API keys.");
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log("[RevenueCat] Purchase successful");
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log("[RevenueCat] User cancelled purchase");
      return null;
    }
    console.error("[RevenueCat] Purchase failed:", error);
    throw error;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!isRevenueCatEnabled()) {
    throw new Error("RevenueCat is not configured. Please check your API keys.");
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log("[RevenueCat] Purchases restored");
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Failed to restore purchases:", error);
    throw error;
  }
};

/**
 * Log out the current user
 */
export const logOut = async (): Promise<void> => {
  if (!isRevenueCatEnabled()) {
    return;
  }

  try {
    await Purchases.logOut();
    console.log("[RevenueCat] User logged out");
  } catch (error) {
    console.error("[RevenueCat] Failed to log out:", error);
  }
};
