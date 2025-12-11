// User and account types for Firebase

export type UserRole = "user" | "moderator" | "administrator";

export type MembershipTier = "free" | "premium" | "isAdmin" | "isModerator";

export type MembershipDuration = "1_month" | "3_months" | "6_months" | "1_year" | "lifetime";

export interface User {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  photoURL?: string;
  coverPhotoURL?: string; // Background photo for profile
  about?: string; // User bio/about section
  favoriteCampingStyle?: string; // Favorite camping style
  favoriteGear?: string[]; // Array of favorite gear categories
  role: UserRole;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string; // ISO string, undefined for lifetime or free
  isBanned: boolean;
  bannedAt?: string;
  bannedBy?: string; // Admin user ID
  banReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentModeration {
  id: string;
  contentType: "photo" | "comment" | "post" | "question" | "review";
  contentId: string;
  userId: string; // Content creator
  moderatedBy: string; // Moderator/Admin user ID
  moderatedAt: string;
  reason: string;
  isHidden: boolean;
  createdAt: string;
}

export interface MembershipGrant {
  id: string;
  userId: string;
  grantedBy: string; // Admin user ID
  duration: MembershipDuration;
  grantedAt: string;
  expiresAt?: string; // undefined for lifetime
}

export interface AuditLog {
  id: string;
  action: "ban_user" | "unban_user" | "hide_content" | "unhide_content" | "grant_membership" | "revoke_membership" | "promote_moderator" | "demote_moderator";
  performedBy: string; // User ID
  targetUserId?: string;
  targetContentId?: string;
  details: string;
  timestamp: string;
}
