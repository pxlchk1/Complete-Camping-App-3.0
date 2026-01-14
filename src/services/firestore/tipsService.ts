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

export interface TipPost {
  id: string;
  userId: string;
  userHandle?: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  downvotes?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // Moderation fields
  isHidden?: boolean;
  hiddenReason?: string;
  hiddenAt?: Timestamp;
  needsReview?: boolean;
  reviewQueueStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  // For moderation filter - authorId is an alias for userId
  authorId?: string;
  authorHandle?: string;
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

    // CRITICAL: Fetch handle from users/{uid}.handle via service
    const authorHandle = await getUserHandleForUid(user.uid);

    const tipData = {
      userId: user.uid,
      authorId: user.uid,
      authorHandle: authorHandle, // MUST be from users/{uid}.handle
      userHandle: authorHandle,   // Legacy field alias
      userAvatar: user.photoURL || null,
      title: data.title,
      content: data.content,
      category: data.category,
      upvotes: 0,
      downvotes: 0,
      createdAt: serverTimestamp(),
      isHidden: false,
      needsReview: false,
    };

    const docRef = await addDoc(collection(db, 'tips'), tipData);
    return docRef.id;
  },

  // Get all tips ordered by createdAt desc
  // Fetches author handles from users collection if not stored on tip
  async getTips(): Promise<TipPost[]> {
    const q = query(collection(db, 'tips'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const tips = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        content: data.text || data.content || data.body || '',
      };
    }) as TipPost[];

    // Fetch missing or invalid author handles from users collection
    const tipsWithHandles = await Promise.all(
      tips.map(async (tip) => {
        // Check if tip already has a VALID handle stored (could be userHandle OR authorHandle)
        const existingHandle = tip.userHandle || tip.authorHandle;
        
        // CRITICAL: Only skip lookup if the stored handle is actually valid
        // Old tips might have displayName stored instead of proper handle
        if (existingHandle && existingHandle.trim() !== '' && isValidHandle(existingHandle)) {
          return tip;
        }
        
        // No valid handle stored on tip - fetch from users collection
        const authorId = tip.userId || tip.authorId;
        if (!authorId) return tip;
        
        try {
          const userDocRef = doc(db, 'profiles', authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.handle && userData.handle.trim() !== '' && isValidHandle(userData.handle)) {
              // Found valid handle in users collection - attach it
              return { ...tip, userHandle: userData.handle };
            }
          }
        } catch (err) {
          // Silently fail - will use fallback at render time
        }
        return tip;
      })
    );

    return tipsWithHandles;
  },

  // Get a single tip by ID
  async getTipById(tipId: string): Promise<TipPost | null> {
    const docRef = doc(db, 'tips', tipId);
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

    const docRef = doc(db, 'tips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Tip not found');
    if (docSnap.data().userId !== user.uid) {
      throw new Error('You can only edit your own tips');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
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

    await deleteDoc(doc(db, 'tips', tipId));
  },

  // Upvote a tip
  async upvoteTip(tipId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upvote');

    const docRef = doc(db, 'tips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Tip not found');

    const currentUpvotes = docSnap.data().upvotes || 0;
    await updateDoc(docRef, {
      upvotes: currentUpvotes + 1,
    });
  },
};
