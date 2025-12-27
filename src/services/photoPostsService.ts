/**
 * Photo Posts Firestore Service
 * Enhanced photo posts with post types, tags, and helpful reactions
 * Collection: photoPosts
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  DocumentSnapshot,
} from "firebase/firestore";
import firebaseApp from "../config/firebase";
import {
  PhotoPost,
  PhotoPostType,
  TripStyle,
  DetailTag,
  PhotoFeedFilters,
} from "../types/photoPost";

const db = getFirestore(firebaseApp);
const COLLECTION = "photoPosts";

// ==================== Create Photo Post ====================

export interface CreatePhotoPostData {
  userId: string;
  displayName?: string;
  photoUrls: string[];
  storagePaths?: string[];
  postType: PhotoPostType;
  caption: string;
  campgroundId?: string;
  campgroundName?: string;
  parkId?: string;
  parkName?: string;
  campsiteNumber?: string;
  hideCampsiteNumber?: boolean;
  tripStyle?: TripStyle;
  detailTags?: DetailTag[];
  location?: { latitude: number; longitude: number };
}

export async function createPhotoPost(data: CreatePhotoPostData): Promise<string> {
  const postsRef = collection(db, COLLECTION);

  const docData: Partial<PhotoPost> = {
    userId: data.userId,
    displayName: data.displayName || "Anonymous",
    photoUrls: data.photoUrls,
    storagePaths: data.storagePaths || [],
    postType: data.postType,
    caption: data.caption,
    createdAt: serverTimestamp() as any,
    helpfulCount: 0,
    saveCount: 0,
    commentCount: 0,
    isHidden: false,
    needsReview: false,
  };

  // Add optional campground fields
  if (data.campgroundId) docData.campgroundId = data.campgroundId;
  if (data.campgroundName) docData.campgroundName = data.campgroundName;
  if (data.parkId) docData.parkId = data.parkId;
  if (data.parkName) docData.parkName = data.parkName;
  if (data.campsiteNumber) docData.campsiteNumber = data.campsiteNumber;
  if (data.hideCampsiteNumber) docData.hideCampsiteNumber = data.hideCampsiteNumber;

  // Add tags
  if (data.tripStyle) docData.tripStyle = data.tripStyle;
  if (data.detailTags && data.detailTags.length > 0) docData.detailTags = data.detailTags;

  // Add location
  if (data.location) {
    docData.location = data.location;
  }

  const docRef = await addDoc(postsRef, docData);
  return docRef.id;
}

// ==================== Get Photo Posts (Feed) ====================

export interface GetPhotoPostsResult {
  posts: PhotoPost[];
  lastDoc: DocumentSnapshot | null;
}

export async function getPhotoPosts(
  filters?: Partial<PhotoFeedFilters>,
  limitCount: number = 30,
  lastDoc?: DocumentSnapshot
): Promise<GetPhotoPostsResult> {
  const postsRef = collection(db, COLLECTION);

  // Build query based on filters
  let constraints: any[] = [];

  // Filter by post type
  // Include legacy "tip-or-fix" posts when filtering for "setup-ideas"
  if (filters?.postType) {
    if (filters.postType === "setup-ideas") {
      // Include both setup-ideas and legacy tip-or-fix
      constraints.push(where("postType", "in", ["setup-ideas", "tip-or-fix"]));
    } else {
      constraints.push(where("postType", "==", filters.postType));
    }
  }

  // Filter by trip style
  if (filters?.tripStyle) {
    constraints.push(where("tripStyle", "==", filters.tripStyle));
  }

  // Filter by campground
  if (filters?.campgroundId) {
    constraints.push(where("campgroundId", "==", filters.campgroundId));
  }

  // Filter by detail tags (can only do array-contains for one tag)
  if (filters?.detailTags && filters.detailTags.length > 0) {
    constraints.push(where("detailTags", "array-contains", filters.detailTags[0]));
  }

  // Only show visible posts
  constraints.push(where("isHidden", "==", false));

  // Sort by
  if (filters?.sortBy === "most-helpful") {
    constraints.push(orderBy("helpfulCount", "desc"));
    constraints.push(orderBy("createdAt", "desc"));
  } else {
    // Default: newest
    constraints.push(orderBy("createdAt", "desc"));
  }

  constraints.push(limit(limitCount));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(postsRef, ...constraints);
  const snapshot = await getDocs(q);

  const posts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PhotoPost[];

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { posts, lastDoc: lastVisible };
}

// ==================== Get Single Photo Post ====================

export async function getPhotoPostById(postId: string): Promise<PhotoPost | null> {
  const postRef = doc(db, COLLECTION, postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return null;
  }

  return {
    id: postSnap.id,
    ...postSnap.data(),
  } as PhotoPost;
}

// ==================== Get User's Photo Posts ====================

export async function getUserPhotoPosts(
  userId: string,
  limitCount: number = 30
): Promise<PhotoPost[]> {
  const postsRef = collection(db, COLLECTION);
  const q = query(
    postsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PhotoPost[];
}

// ==================== Update Photo Post ====================

export async function updatePhotoPost(
  postId: string,
  updates: Partial<PhotoPost>
): Promise<void> {
  const postRef = doc(db, COLLECTION, postId);
  await updateDoc(postRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ==================== Delete Photo Post ====================

export async function deletePhotoPost(postId: string): Promise<void> {
  const postRef = doc(db, COLLECTION, postId);
  await deleteDoc(postRef);
}

// ==================== Helpful Reactions ====================

export async function toggleHelpful(
  postId: string,
  userId: string
): Promise<{ isHelpful: boolean; newCount: number }> {
  const helpfulRef = doc(db, COLLECTION, postId, "helpful", userId);
  const postRef = doc(db, COLLECTION, postId);

  const helpfulSnap = await getDoc(helpfulRef);

  if (helpfulSnap.exists()) {
    // Remove helpful
    await deleteDoc(helpfulRef);
    await updateDoc(postRef, {
      helpfulCount: increment(-1),
    });

    const postSnap = await getDoc(postRef);
    const newCount = (postSnap.data()?.helpfulCount || 0) as number;

    return { isHelpful: false, newCount };
  } else {
    // Add helpful
    await setDoc(helpfulRef, {
      createdAt: serverTimestamp(),
    });
    await updateDoc(postRef, {
      helpfulCount: increment(1),
    });

    const postSnap = await getDoc(postRef);
    const newCount = (postSnap.data()?.helpfulCount || 0) as number;

    return { isHelpful: true, newCount };
  }
}

export async function checkIfHelpful(
  postId: string,
  userId: string
): Promise<boolean> {
  const helpfulRef = doc(db, COLLECTION, postId, "helpful", userId);
  const helpfulSnap = await getDoc(helpfulRef);
  return helpfulSnap.exists();
}

// ==================== Get Helpful Status for Multiple Posts ====================

export async function getHelpfulStatuses(
  postIds: string[],
  userId: string
): Promise<Record<string, boolean>> {
  const statuses: Record<string, boolean> = {};

  // Batch check (in parallel)
  await Promise.all(
    postIds.map(async (postId) => {
      statuses[postId] = await checkIfHelpful(postId, userId);
    })
  );

  return statuses;
}

// ==================== Migration Helper ====================

/**
 * Check if a post is a legacy post (no postType)
 * Legacy posts will display as "Photo" type
 */
export function isLegacyPost(post: PhotoPost): boolean {
  return !post.postType;
}

/**
 * Get display label for post type, with fallback for legacy posts
 * Maps legacy "tip-or-fix" to "Setup Ideas"
 */
export function getPostTypeLabel(post: PhotoPost): string {
  if (!post.postType) {
    return "Photo";
  }

  // Map legacy tip-or-fix to setup-ideas (cast to string for legacy data comparison)
  const rawType = post.postType as string;
  const postType = rawType === "tip-or-fix" ? "setup-ideas" : rawType;

  const labels: Record<string, string> = {
    "campsite-spotlight": "Campsite Spotlight",
    "conditions-report": "Conditions Report",
    "setup-ideas": "Setup Ideas",
    "gear-in-real-life": "Gear in Real Life",
    "camp-cooking": "Camp Cooking",
    "wildlife-nature": "Wildlife & Nature",
    "accessibility": "Accessibility",
  };

  return labels[postType] || "Photo";
}
