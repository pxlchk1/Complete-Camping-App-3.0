import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { getUserHandleForUid } from '../userHandleService';
import { getDisplayHandle, isValidHandle } from '../../utils/userHandle';

export interface FeedbackComment {
  id: string;
  feedbackID: string;
  handle: string;
  text: string;
  karmaScore: number;
  createdAt: Timestamp;
}

export const feedbackCommentsService = {
  // Get comments for a specific feedback post
  // Fetches author handles from users collection if not stored on comment
  async getCommentsByFeedbackId(feedbackID: string): Promise<FeedbackComment[]> {
    const q = query(
      collection(db, 'feedbackComments'),
      where('feedbackID', '==', feedbackID),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);

    const comments = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FeedbackComment[];

    // Fetch missing or invalid author handles from users collection
    const commentsWithHandles = await Promise.all(
      comments.map(async (comment) => {
        // Check if comment already has a VALID handle stored
        const existingHandle = comment.handle || (comment as any).authorHandle || (comment as any).userHandle;
        if (existingHandle && existingHandle.trim() !== '' && isValidHandle(existingHandle)) {
          return { ...comment, handle: existingHandle };
        }
        
        // No valid handle stored on comment - fetch from users collection
        const authorId = (comment as any).authorId || (comment as any).userId;
        if (!authorId) return comment;
        
        try {
          const userDocRef = doc(db, 'profiles', authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.handle && userData.handle.trim() !== '' && isValidHandle(userData.handle)) {
              return { ...comment, handle: userData.handle };
            }
          }
        } catch (err) {
          // Silently fail - will use fallback
        }
        return comment;
      })
    );

    return commentsWithHandles;
  },

  // Create a new comment
  async createComment(data: {
    feedbackID: string;
    text: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to comment');

    // CRITICAL: Fetch handle from users/{uid}.handle via service
    const authorHandle = await getUserHandleForUid(user.uid);

    const commentData = {
      feedbackID: data.feedbackID,
      handle: authorHandle,       // MUST be from users/{uid}.handle
      authorHandle: authorHandle, // Consistent field name
      authorId: user.uid,
      text: data.text,
      karmaScore: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'feedbackComments'), commentData);
    return docRef.id;
  },

  // Adjust karma score (upvote/downvote)
  async adjustKarma(commentId: string, delta: 1 | -1): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');

    const docRef = doc(db, 'feedbackComments', commentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Comment not found');

    const currentKarma = docSnap.data().karmaScore || 0;
    await updateDoc(docRef, {
      karmaScore: currentKarma + delta,
    });
  },
};
