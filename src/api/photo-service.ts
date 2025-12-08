import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../config/firebase";
import type { LibraryImage, ImageCategory } from "../types/community";

const PHOTOS_COLLECTION = "photos";
const PHOTO_VOTES_COLLECTION = "photoVotes";

// Upload a photo
export async function uploadPhoto(
  localUri: string,
  title: string,
  description: string,
  category: ImageCategory,
  tags: string[],
  userId: string,
  userHandle: string,
  userName?: string,
  isPrivate?: boolean
): Promise<string> {
  try {
    // Fetch the local image as a blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const filename = `photos/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    const imageUri = await getDownloadURL(storageRef);

    // Create photo document
    const photoDoc = {
      title,
      description,
      imageUri,
      category,
      tags,
      authorId: userId,
      authorHandle: userHandle,
      authorName: userName || userHandle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      score: 0,
      views: 0,
      isPrivate: isPrivate || false,
    };

    const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), photoDoc);
    return docRef.id;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
}

// Fetch photos
export async function fetchPhotos(userId?: string): Promise<LibraryImage[]> {
  try {
    let q = query(collection(db, PHOTOS_COLLECTION), orderBy("createdAt", "desc"), limit(100));

    const snapshot = await getDocs(q);
    const photos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LibraryImage[];

    // Filter private photos: only show to owner
    return photos.filter((photo) => {
      if (photo.isPrivate) {
        return userId && photo.authorId === userId;
      }
      return true;
    });
  } catch (error: any) {
    // Don't log permissions errors as errors - they're expected when Firebase is not configured
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
      console.log("Firebase unavailable for photos, returning empty array");
      return [];
    }
    console.error("Error fetching photos:", error);
    return [];
  }
}

// Delete a photo
export async function deletePhoto(photoId: string, userId: string): Promise<void> {
  try {
    const photoRef = doc(db, PHOTOS_COLLECTION, photoId);
    const photoDoc = await getDoc(photoRef);

    if (!photoDoc.exists()) {
      throw new Error("Photo not found");
    }

    const photoData = photoDoc.data();

    if (photoData.authorId !== userId) {
      throw new Error("Unauthorized to delete this photo");
    }

    // Delete from Storage
    const imageUri = photoData.imageUri;
    if (imageUri && imageUri.includes("firebase")) {
      try {
        const storageRef = ref(storage, imageUri);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn("Error deleting from storage:", storageError);
      }
    }

    // Delete the document and all votes
    const batch = writeBatch(db);
    batch.delete(photoRef);

    // Delete all votes for this photo
    const votesQuery = query(
      collection(db, PHOTO_VOTES_COLLECTION),
      where("photoId", "==", photoId)
    );
    const votesSnapshot = await getDocs(votesQuery);
    votesSnapshot.docs.forEach((voteDoc) => {
      batch.delete(voteDoc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
}

// Vote on a photo
export async function votePhoto(
  photoId: string,
  userId: string,
  voteType: "up" | "down"
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const voteDocRef = doc(db, PHOTO_VOTES_COLLECTION, `${photoId}_${userId}`);
    const voteDoc = await getDoc(voteDocRef);

    const photoRef = doc(db, PHOTOS_COLLECTION, photoId);

    if (voteDoc.exists()) {
      const existingVote = voteDoc.data().voteType;

      if (existingVote === voteType) {
        // Remove vote
        batch.delete(voteDocRef);
        if (voteType === "up") {
          batch.update(photoRef, {
            upvotes: increment(-1),
            score: increment(-1),
          });
        } else {
          batch.update(photoRef, {
            downvotes: increment(-1),
            score: increment(1),
          });
        }
      } else {
        // Switch vote
        batch.update(voteDocRef, { voteType });
        if (voteType === "up") {
          batch.update(photoRef, {
            upvotes: increment(1),
            downvotes: increment(-1),
            score: increment(2),
          });
        } else {
          batch.update(photoRef, {
            upvotes: increment(-1),
            downvotes: increment(1),
            score: increment(-2),
          });
        }
      }
    } else {
      // New vote
      batch.set(voteDocRef, {
        photoId,
        userId,
        voteType,
        createdAt: new Date().toISOString(),
      });
      if (voteType === "up") {
        batch.update(photoRef, {
          upvotes: increment(1),
          score: increment(1),
        });
      } else {
        batch.update(photoRef, {
          downvotes: increment(1),
          score: increment(-1),
        });
      }
    }

    await batch.commit();
  } catch (error) {
    console.error("Error voting on photo:", error);
    throw error;
  }
}

// Get user's vote on a photo
export async function getUserPhotoVote(
  photoId: string,
  userId: string
): Promise<"up" | "down" | null> {
  try {
    const voteDocRef = doc(db, PHOTO_VOTES_COLLECTION, `${photoId}_${userId}`);
    const voteDoc = await getDoc(voteDocRef);

    if (voteDoc.exists()) {
      return voteDoc.data().voteType as "up" | "down";
    }
    return null;
  } catch (error) {
    console.error("Error getting user photo vote:", error);
    return null;
  }
}

// Update photo details
export async function updatePhoto(
  photoId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string;
    category?: ImageCategory;
    tags?: string[];
  }
): Promise<void> {
  try {
    const photoRef = doc(db, PHOTOS_COLLECTION, photoId);
    const photoDoc = await getDoc(photoRef);

    if (!photoDoc.exists()) {
      throw new Error("Photo not found");
    }

    if (photoDoc.data().authorId !== userId) {
      throw new Error("Unauthorized to update this photo");
    }

    await updateDoc(photoRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating photo:", error);
    throw error;
  }
}
