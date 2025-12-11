import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase';

export interface Photo {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  imageUrl: string;
  caption: string;
  location?: string;
  tags?: string[];
  upvotes: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const photosService = {
  // Upload photo to Firebase Storage
  async uploadPhoto(uri: string, userId: string, postId: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `stories/${userId}/${postId}/${Date.now()}.jpg`);\n    await uploadBytes(storageRef, blob);

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  },

  // Create photo post
  async createPhoto(data: {
    imageUri: string;
    caption: string;
    location?: string;
    tags?: string[];
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upload a photo');

    // Create document first to get ID
    const photoData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || null,
      imageUrl: '', // Will be updated after upload
      caption: data.caption,
      location: data.location || '',
      tags: data.tags || [],
      upvotes: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'stories'), photoData);

    // Upload image to Storage
    const imageUrl = await photosService.uploadPhoto(
      data.imageUri,
      user.uid,
      docRef.id
    );

    // Update document with image URL
    await updateDoc(docRef, { imageUrl });

    return docRef.id;
  },

  // Get all stories ordered by createdAt desc (Grid view)
  async getPhotos(): Promise<Photo[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to view stories');

    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Photo[];
  },

  // Get stories by user (Detail view)
  async getPhotosByUser(userId: string): Promise<Photo[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to view stories');

    const q = query(
      collection(db, 'stories'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Photo[];
  },

  // Get photo by ID
  async getPhotoById(photoId: string): Promise<Photo | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to view stories');

    const docRef = doc(db, 'stories', photoId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Photo;
  },

  // Update photo (only by owner)
  async updatePhoto(
    photoId: string,
    data: {
      caption?: string;
      location?: string;
      tags?: string[];
    }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update a photo');

    const docRef = doc(db, 'stories', photoId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Photo not found');
    if (docSnap.data().userId !== user.uid) {
      throw new Error('You can only edit your own stories');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete photo (admin only)
  async deletePhoto(photoId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to delete a photo');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';

    if (!isAdmin) throw new Error('Only admins can delete stories');

    // Get photo doc to get userId for storage path
    const photoDoc = await getDoc(doc(db, 'stories', photoId));
    if (photoDoc.exists()) {
      const photoData = photoDoc.data();

      // Delete from Storage
      try {
        const storageRef = ref(
          storage,
          `stories/${photoData.userId}/${photoId}.jpg`
        );
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting photo from storage:', error);
      }
    }

    // Delete from Firestore
    await deleteDoc(doc(db, 'stories', photoId));
  },

  // Upvote photo
  async upvotePhoto(photoId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upvote');

    const docRef = doc(db, 'stories', photoId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Photo not found');

    const currentUpvotes = docSnap.data().upvotes || 0;
    await updateDoc(docRef, {
      upvotes: currentUpvotes + 1,
    });
  },
};
