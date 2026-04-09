import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { User, DanceLevel, UserWithProfile, Instructor } from '../../types';

/**
 * Fetch user profile data from Firestore
 */
export const fetchUserProfile = async (userId: string): Promise<UserWithProfile> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      throw new Error('User profile not found');
    }

    return userSnapshot.data() as UserWithProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Firestore'dan veya local cache'den gelen tarih verisini güvenli bir şekilde Date nesnesine çevirir
const parseDateSafe = (val: any): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') {
    try {
      return val.toDate();
    } catch (e) {
      console.warn('Error extracting date via toDate():', e);
    }
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return new Date(val.seconds * 1000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
};

/**
 * Utility function to resize an image to a specified maximum width/height
 * Also applies compression to reduce file size
 */
export const resizeImageFromBase64 = (
  base64Data: string,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      // Create canvas with new dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      // Draw resized image to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP if supported for better compression
      const isWebPSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

      // Get base64 data URL from canvas
      const resizedBase64 = isWebPSupported
        ? canvas.toDataURL('image/webp', quality)
        : canvas.toDataURL('image/jpeg', quality);

      resolve(resizedBase64);
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = base64Data;
  });
};

/**
 * Updates user profile information in both Firebase Auth and Firestore
 */
export const updateUserProfile = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Strip undefined values — Firestore rejects them in updateDoc
    const cleanedData = Object.fromEntries(
      Object.entries(userData).filter(([, v]) => v !== undefined)
    );

    // Add timestamps
    const dataToUpdate = {
      ...cleanedData,
      updatedAt: Timestamp.now()
    };

    await updateDoc(userRef, dataToUpdate);

    // Get the updated user data
    const updatedUserDoc = await getDoc(userRef);
    if (!updatedUserDoc.exists()) {
      throw new Error('User not found after update');
    }

    const data = updatedUserDoc.data();
    return {
      id: updatedUserDoc.id,
      ...data,
      createdAt: parseDateSafe(data.createdAt),
      updatedAt: parseDateSafe(data.updatedAt)
    } as User;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Updates profile picture directly in Firestore without using Firebase Storage
 * This is a workaround for base64 storage directly in Firestore
 * Note: Does not update Auth profile due to URL length limitations
 */
export const updateProfilePhotoDirectly = async (
  userId: string,
  base64Data: string
): Promise<string> => {
  try {
    // Resize the image to reduce its size
    const resizedImage = await resizeImageFromBase64(base64Data, 300, 300, 0.75);

    // Only update Firestore document with base64 image data
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      photoURL: resizedImage,
      updatedAt: Timestamp.now(),
    });

    // Skip updating Auth profile because base64 images are typically too large
    // Firebase Auth has a limit on the length of profile photo URLs

    return resizedImage;
  } catch (error) {
    console.error('Error updating profile photo directly:', error);
    throw error;
  }
};

/**
 * Fetches all instructors with their profile data from Firestore
 */
export const fetchAllInstructors = async (): Promise<Array<Instructor & { user: UserWithProfile }>> => {
  try {
    const { getDocs, collection, query } = await import('firebase/firestore');
    const instructorsQuery = query(collection(db, 'instructors'));
    const instructorsSnapshot = await getDocs(instructorsQuery);

    const instructors: Array<Instructor & { user: UserWithProfile }> = [];

    for (const instructorDoc of instructorsSnapshot.docs) {
      const rawData = instructorDoc.data();
      console.log('Raw instructor data from Firestore:', rawData);

      // Convert Turkish field names to English and handle data type conversions
      const instructorData: Instructor = {
        id: instructorDoc.id,
        userId: rawData.userId,
        displayName: rawData.displayName || '',
        email: rawData.email || '',
        photoURL: rawData.photoURL,
        phoneNumber: rawData.phoneNumber || '',
        role: 'instructor',
        bio: rawData.bio || '',
        // Handle specialties array correctly
        specialties: Array.isArray(rawData.specialties) ? rawData.specialties :
          rawData.uzmanlık ? [rawData.uzmanlık] : [],
        // Convert experience to number
        experience: typeof rawData.experience === 'number' ? rawData.experience :
          typeof rawData.experience === 'string' ? parseInt(rawData.experience) :
            typeof rawData.tecrube === 'number' ? rawData.tecrube :
              typeof rawData.tecrube === 'string' ? parseInt(rawData.tecrube) : 0,
        level: rawData.level || 'professional',
        schoolId: rawData.schoolId || null,
        schoolName: rawData.schoolName || null,
        availability: rawData.availability || { days: [], hours: [] },
        status: rawData.status || 'active',
        createdAt: rawData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: rawData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      console.log('Converted instructor data:', instructorData);

      try {
        const userDocRef = doc(db, 'users', instructorData.userId);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as UserWithProfile;

          // Taslak eğitmenleri public listeden gizle
          const isDraft =
            (userData as any).role === 'draft-instructor' ||
            (userData as any).is_instructor_pending === true;

          if (isDraft) {
            continue; // Bu eğitmeni listeye ekleme
          }

          instructors.push({
            ...instructorData,
            user: userData
          });
        } else {
          instructors.push({
            ...instructorData,
            user: {
              id: instructorData.userId,
              email: instructorData.email,
              displayName: instructorData.displayName,
              role: ['instructor'],
              createdAt: new Date(instructorData.createdAt),
              updatedAt: new Date(instructorData.updatedAt)
            } as unknown as UserWithProfile
          });
        }

      } catch (userError) {
        console.error(`Error fetching user data for instructor ${instructorData.userId}:`, userError);
        instructors.push({
          ...instructorData,
          user: {
            id: instructorData.userId,
            email: instructorData.email,
            displayName: instructorData.displayName,
            role: 'instructor',
            createdAt: new Date(instructorData.createdAt),
            updatedAt: new Date(instructorData.updatedAt)
          } as unknown as UserWithProfile
        });
      }
    }

    return instructors;
  } catch (error) {
    console.error('Error fetching instructors:', error);
    throw error;
  }
}; 