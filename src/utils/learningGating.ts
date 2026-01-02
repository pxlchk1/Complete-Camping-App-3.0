/**
 * Learning Module Gating
 * 
 * Centralized access control for learning modules.
 * 
 * Access Rules:
 * - Leave No Trace module (moduleId="lnt-principles") is FREE for all authenticated users
 * - All other modules require Pro subscription
 * - Anonymous users cannot access any modules (must create account)
 */

// Free module IDs - available to all authenticated users
// Note: "lnt-principles" is the actual module ID in the Leave No Trace track
export const FREE_MODULE_IDS = ["lnt-principles", "leave_no_trace", "leave-no-trace"] as const;

/**
 * Lock reasons for modules
 */
export type LockReason = "account_required" | "pro_required" | null;

/**
 * Access state for a learning module
 */
export type ModuleAccessState = 
  | "anonymous_locked"    // Not logged in - show AccountRequiredModal
  | "free_unlocked"       // Logged in, free module - can open
  | "free_locked"         // Logged in, not Pro, Pro module - show PaywallModal
  | "pro_unlocked";       // Logged in, Pro - can open all

/**
 * Check if a module is free (available to all authenticated users)
 */
export function isFreeModule(moduleId: string): boolean {
  // Normalize the module ID (handle both underscore and hyphen formats)
  const normalizedId = moduleId.toLowerCase().replace(/_/g, "-");
  return FREE_MODULE_IDS.some(id => 
    id.toLowerCase().replace(/_/g, "-") === normalizedId
  );
}

/**
 * Get the access state for a learning module
 * 
 * @param moduleId - The module's ID
 * @param isAuthenticated - Whether the user is logged in
 * @param isPro - Whether the user has an active Pro subscription
 * @returns ModuleAccessState
 */
export function getModuleAccessState(
  moduleId: string,
  isAuthenticated: boolean,
  isPro: boolean
): ModuleAccessState {
  // State A: Anonymous (not logged in)
  if (!isAuthenticated) {
    return "anonymous_locked";
  }

  // State B: Logged in, Free (not Pro)
  if (!isPro) {
    return isFreeModule(moduleId) ? "free_unlocked" : "free_locked";
  }

  // State C: Logged in, Pro
  return "pro_unlocked";
}

/**
 * Check if user can open a learning module
 * 
 * @param moduleId - The module's ID
 * @param isAuthenticated - Whether the user is logged in
 * @param isPro - Whether the user has an active Pro subscription
 * @returns boolean - true if user can access the module
 */
export function canOpenLearningModule(
  moduleId: string,
  isAuthenticated: boolean,
  isPro: boolean
): boolean {
  const state = getModuleAccessState(moduleId, isAuthenticated, isPro);
  return state === "free_unlocked" || state === "pro_unlocked";
}

/**
 * Get the lock reason for a module
 * 
 * @param moduleId - The module's ID
 * @param isAuthenticated - Whether the user is logged in
 * @param isPro - Whether the user has an active Pro subscription
 * @returns LockReason - null if not locked
 */
export function getLearningModuleLockReason(
  moduleId: string,
  isAuthenticated: boolean,
  isPro: boolean
): LockReason {
  const state = getModuleAccessState(moduleId, isAuthenticated, isPro);
  
  switch (state) {
    case "anonymous_locked":
      return "account_required";
    case "free_locked":
      return "pro_required";
    default:
      return null;
  }
}

/**
 * Get the badge type to display for a module
 * 
 * @param moduleId - The module's ID
 * @returns "Free" | "Pro"
 */
export function getModuleBadgeType(moduleId: string): "Free" | "Pro" {
  return isFreeModule(moduleId) ? "Free" : "Pro";
}

/**
 * Get helper text for a locked module based on user state
 * 
 * @param lockReason - The reason the module is locked
 * @returns string - Helper text to display
 */
export function getLockedModuleHelperText(lockReason: LockReason): string {
  switch (lockReason) {
    case "account_required":
      return "Create an account to start";
    case "pro_required":
      return "Included with Pro";
    default:
      return "";
  }
}
