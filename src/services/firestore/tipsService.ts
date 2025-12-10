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

export interface TipPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  views?: number;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export const tipsService = {
  // Create a new tip
  async createTip(data: {
    title: string;
    content: string;
    category: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create a tip');

    const tipData = {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorHandle: user.displayName || 'user',
      title: data.title,
      content: data.content,
      category: data.category,
      likes: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'communityTips'), tipData);
    return docRef.id;
  },

  // Get all tips ordered by createdAt desc
  async getTips(): Promise<TipPost[]> {
    // Tips are public - no auth required to read
    const tipsRef = collection(db, 'communityTips');
    const snapshot = await getDocs(tipsRef);

    // Sort by createdAt in memory since we're not using a query
    const tips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TipPost[];

    tips.sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.toMillis();
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.toMillis();
      return dateB - dateA;
    });

    return tips;
  },

  // Get a single tip by ID
  async getTipById(tipId: string): Promise<TipPost | null> {
    const docRef = doc(db, 'communityTips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TipPost;
  },

  // Update a tip (only by owner)
  async updateTip(
    tipId: string,
    data: { title?: string; content?: string; category?: string }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update a tip');

    const docRef = doc(db, 'communityTips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Tip not found');
    if (docSnap.data().authorId !== user.uid) {
      throw new Error('You can only edit your own tips');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // Delete a tip (admin only)
  async deleteTip(tipId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to delete a tip');

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';

    if (!isAdmin) throw new Error('Only admins can delete tips');

    await deleteDoc(doc(db, 'communityTips', tipId));
  },

  // Upvote a tip
  async upvoteTip(tipId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upvote');

    const docRef = doc(db, 'communityTips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Tip not found');

    const currentLikes = docSnap.data().likes || 0;
    await updateDoc(docRef, {
      likes: currentLikes + 1,
    });
  },
};
