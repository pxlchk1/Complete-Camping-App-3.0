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

export interface FeedbackPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  category: 'feature' | 'bug' | 'improvement' | 'question' | 'other';
  status: 'open' | 'planned' | 'in-progress' | 'completed' | 'declined';
  upvotes: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const feedbackService = {
  // Create new feedback
  async createFeedback(data: {
    title: string;
    description: string;
    category: 'feature' | 'bug' | 'improvement' | 'question' | 'other';
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create feedback');

    const feedbackData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || null,
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'open' as const,
      upvotes: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'feedbackPosts'), feedbackData);
    return docRef.id;
  },

  // Get all feedback ordered by createdAt desc
  async getFeedback(): Promise<FeedbackPost[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to read feedback');

    const q = query(
      collection(db, 'feedbackPosts'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedbackPost[];
  },

  // Get feedback by ID
  async getFeedbackById(feedbackId: string): Promise<FeedbackPost | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to read feedback');

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
      category?: 'feature' | 'bug' | 'improvement' | 'question' | 'other';
    }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update feedback');

    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Feedback not found');
    if (docSnap.data().userId !== user.uid) {
      throw new Error('You can only edit your own feedback');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
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

  // Upvote feedback
  async upvoteFeedback(feedbackId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upvote');

    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Feedback not found');

    const currentUpvotes = docSnap.data().upvotes || 0;
    await updateDoc(docRef, {
      upvotes: currentUpvotes + 1,
    });
  },

  // Update status (admin only)
  async updateStatus(
    feedbackId: string,
    status: 'open' | 'planned' | 'in-progress' | 'completed' | 'declined'
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';

    if (!isAdmin) throw new Error('Only admins can update status');

    await updateDoc(doc(db, 'feedbackPosts', feedbackId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};
