import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

export interface FeedbackVote {
  userId: string;
  value: 1 | -1;
}

export const feedbackVoteService = {
  // Listen to vote state for a post for the current user
  onUserVote(postId: string, callback: (vote: FeedbackVote | null) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const voteRef = doc(db, 'feedbackPosts', postId, 'votes', user.uid);
    return onSnapshot(voteRef, (snap) => {
      if (snap.exists()) {
        callback({ userId: user.uid, value: snap.data().value });
      } else {
        callback(null);
      }
    });
  },

  // Get vote state for a post for the current user
  async getUserVote(postId: string): Promise<FeedbackVote | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const voteRef = doc(db, 'feedbackPosts', postId, 'votes', user.uid);
    const snap = await getDoc(voteRef);
    if (snap.exists()) {
      return { userId: user.uid, value: snap.data().value };
    }
    return null;
  },

  // Set vote (upvote or downvote)
  async setVote(postId: string, value: 1 | -1): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');
    const voteRef = doc(db, 'feedbackPosts', postId, 'votes', user.uid);
    await setDoc(voteRef, { value }, { merge: true });
  },

  // Remove vote
  async removeVote(postId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to remove vote');
    const voteRef = doc(db, 'feedbackPosts', postId, 'votes', user.uid);
    await deleteDoc(voteRef);
  },

  // Transactional voting: ensures karmaScore is updated atomically
  async vote(postId: string, value: 1 | -1): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');
    const postRef = doc(db, 'feedbackPosts', postId);
    const voteRef = doc(db, 'feedbackPosts', postId, 'votes', user.uid);
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      if (!postSnap.exists) throw new Error('Post not found');
      const voteSnap = await transaction.get(voteRef);
      let karmaScore = postSnap.data().karmaScore || 0;
      let prevValue = 0;
      if (voteSnap.exists) {
        prevValue = voteSnap.data().value;
      }
      // If same vote, remove
      if (prevValue === value) {
        transaction.delete(voteRef);
        karmaScore -= value;
      } else {
        transaction.set(voteRef, { value });
        karmaScore += value - prevValue;
      }
      transaction.update(postRef, { karmaScore });
    });
  },
};
