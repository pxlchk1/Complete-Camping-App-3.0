import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { getUserHandleForUid } from '../userHandleService';
import { getDisplayHandle, isValidHandle } from '../../utils/userHandle';

export interface GearReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  gearName: string;
  brand: string;
  category: string;
  rating: number;
  review: string;
  pros?: string;
  cons?: string;
  upvotes: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const gearReviewsService = {
  // Create gear review
  async createReview(data: {
    gearName: string;
    brand: string;
    category: string;
    rating: number;
    review: string;
    pros?: string;
    cons?: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create a review');

    // CRITICAL: Fetch handle from users/{uid}.handle via service
    const authorHandle = await getUserHandleForUid(user.uid);

    const reviewData = {
      userId: user.uid,
      authorId: user.uid,
      authorHandle: authorHandle, // MUST be from users/{uid}.handle
      userHandle: authorHandle,   // Legacy field alias
      userAvatar: user.photoURL || null,
      gearName: data.gearName,
      brand: data.brand,
      category: data.category,
      rating: data.rating,
      review: data.review,
      pros: data.pros || '',
      cons: data.cons || '',
      upvotes: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'gearReviews'), reviewData);
    return docRef.id;
  },

  // Get all gear reviews ordered by createdAt desc
  // Fetches author handles from users collection if not stored on review
  async getReviews(): Promise<GearReview[]> {
    const q = query(
      collection(db, 'gearReviews'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const reviews = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        body: data.review || data.body || data.reviewText || '',
        summary: data.summary || data.title || '',
        rating: data.rating || data.overallRating || 0,
      } as unknown as GearReview;
    });

    // Fetch missing or invalid author handles from users collection
    const reviewsWithHandles = await Promise.all(
      reviews.map(async (review) => {
        // Check if review already has a VALID handle stored
        const existingHandle = (review as any).authorHandle || (review as any).userHandle;
        if (existingHandle && existingHandle.trim() !== '' && isValidHandle(existingHandle)) {
          return review;
        }
        
        // No valid handle stored on review - fetch from users collection
        const authorId = review.userId || (review as any).authorId;
        if (!authorId) return review;
        
        try {
          const userDocRef = doc(db, 'profiles', authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.handle && userData.handle.trim() !== '' && isValidHandle(userData.handle)) {
              return { ...review, authorHandle: userData.handle };
            }
          }
        } catch (err) {
          // Silently fail - will use fallback
        }
        return review;
      })
    );

    return reviewsWithHandles;
  },

  // Get review by ID
  async getReviewById(reviewId: string): Promise<GearReview | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to read reviews');

    const docRef = doc(db, 'gearReviews', reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as GearReview;
  },

  // Update review (only by owner)
  async updateReview(
    reviewId: string,
    data: {
      gearName?: string;
      brand?: string;
      category?: string;
      rating?: number;
      review?: string;
      pros?: string;
      cons?: string;
    }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update a review');

    const docRef = doc(db, 'gearReviews', reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Review not found');
    if (docSnap.data().userId !== user.uid) {
      throw new Error('You can only edit your own reviews');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete review (admin only)
  async deleteReview(reviewId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to delete a review');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';

    if (!isAdmin) throw new Error('Only admins can delete reviews');

    await deleteDoc(doc(db, 'gearReviews', reviewId));
  },

  // Upvote review
  async upvoteReview(reviewId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upvote');

    const docRef = doc(db, 'gearReviews', reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Review not found');

    const currentUpvotes = docSnap.data().upvotes || 0;
    await updateDoc(docRef, {
      upvotes: currentUpvotes + 1,
    });
  },
};
