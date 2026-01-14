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

export interface FeedbackPost {
  id: string;
  title: string;
  description: string;
  category: 'Feature Request' | 'Bug Report' | 'Improvement' | 'Question' | 'Other';
  status: 'open' | 'planned' | 'in-progress' | 'completed' | 'declined';
  karmaScore: number;
  createdAt: Timestamp;
  createdByUserId: string;
}

export const feedbackService = {
  // Create new feedback
  async createFeedback(data: {
    title: string;
    description: string;
    category: 'Feature Request' | 'Bug Report' | 'Improvement' | 'Question' | 'Other';
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create feedback');

    // CRITICAL: Fetch handle from users/{uid}.handle via service
    const authorHandle = await getUserHandleForUid(user.uid);

    const feedbackData = {
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'open' as const,
      karmaScore: 1,
      createdAt: serverTimestamp(),
      createdByUserId: user.uid,
      authorId: user.uid,
      authorHandle: authorHandle, // MUST be from users/{uid}.handle
      userHandle: authorHandle,   // Legacy field alias
    };

    const docRef = await addDoc(collection(db, 'feedbackPosts'), feedbackData);
    return docRef.id;
  },

  // Get all feedback ordered by createdAt desc
  // Fetches author handles from users collection if not stored on feedback
  async getFeedback(): Promise<FeedbackPost[]> {
    const q = query(
      collection(db, 'feedbackPosts'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    const feedbackPosts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FeedbackPost[];

    // Fetch missing or invalid author handles from users collection
    const feedbackWithHandles = await Promise.all(
      feedbackPosts.map(async (feedback) => {
        // Check if feedback already has a VALID handle stored
        const existingHandle = (feedback as any).authorHandle || (feedback as any).userHandle;
        if (existingHandle && existingHandle.trim() !== '' && isValidHandle(existingHandle)) {
          return feedback;
        }
        
        // No valid handle stored on feedback - fetch from users collection
        const authorId = feedback.createdByUserId || (feedback as any).authorId || (feedback as any).userId;
        if (!authorId) return feedback;
        
        try {
          const userDocRef = doc(db, 'profiles', authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.handle && userData.handle.trim() !== '' && isValidHandle(userData.handle)) {
              return { ...feedback, authorHandle: userData.handle };
            }
          }
        } catch (err) {
          // Silently fail - will use fallback
        }
        return feedback;
      })
    );

    return feedbackWithHandles;
  },

  // Get feedback by ID (public read - anyone can view feedback details)
  async getFeedbackById(feedbackId: string): Promise<FeedbackPost | null> {
    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as FeedbackPost;
  },

  // Update feedback (only by owner)
  async updateFeedback(
    feedbackId: string,
    data: {
      title?: string;
      description?: string;
      category?: 'Feature Request' | 'Bug Report' | 'Improvement' | 'Question' | 'Other';
    }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update feedback');

    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Feedback not found');
    
    // Check if the current user created this feedback
    if (docSnap.data().createdByUserId !== user.uid) {
      throw new Error('You can only edit your own feedback');
    }

    await updateDoc(docRef, data);
  },

  // Delete feedback (admin only)
  async deleteFeedback(feedbackId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to delete feedback');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';

    if (!isAdmin) throw new Error('Only admins can delete feedback');

    await deleteDoc(doc(db, 'feedbackPosts', feedbackId));
  },

  // Upvote/downvote feedback (adjust karma score)
  async adjustKarma(feedbackId: string, delta: 1 | -1): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');

    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Feedback not found');

    const currentKarma = docSnap.data().karmaScore || 0;
    await updateDoc(docRef, {
      karmaScore: currentKarma + delta,
    });
  },

  // Legacy method for compatibility
  async upvoteFeedback(feedbackId: string): Promise<void> {
    return this.adjustKarma(feedbackId, 1);
  },
};

