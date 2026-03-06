import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { DanceSchool } from '../../types';
import { generateInitialsAvatar } from '../../common/utils/imageUtils';

// Koleksiyon adı
const SCHOOLS_COLLECTION = 'schools';

/**
 * Tüm dans okullarını getirir
 */
export const getAllDanceSchools = async (): Promise<DanceSchool[]> => {
  try {
    const schoolsQuery = query(
      collection(db, SCHOOLS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const schoolsSnapshot = await getDocs(schoolsQuery);
    const schools: DanceSchool[] = [];

    for (const doc of schoolsSnapshot.docs) {
      const schoolData = doc.data();

      // Kurs sayısını hesapla
      let courseCount = 0;
      try {
        const coursesQuery = query(
          collection(db, 'courses'),
          where('schoolId', '==', doc.id)
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        courseCount = coursesSnapshot.size;
      } catch (err: any) {
        console.error(`Error fetching courses for school ${doc.id}:`, err?.message);
      }

      // Okul değerlendirmelerini hesapla
      let totalRating = 0;
      let ratingCount = 0;
      try {
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('schoolId', '==', doc.id)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);

        ratingsSnapshot.forEach(ratingDoc => {
          const rating = ratingDoc.data().rating;
          if (rating) {
            totalRating += rating;
            ratingCount++;
          }
        });
      } catch (err: any) {
        console.error(`Error fetching ratings for school ${doc.id}:`, err?.message);
      }

      const rating = ratingCount > 0 ? totalRating / ratingCount : 0;

      // Okul verilerini DanceSchool tipine dönüştür
      const schoolWithData: DanceSchool = {
        id: doc.id,
        displayName: schoolData.displayName || schoolData.name || 'İsimsiz Okul',
        name: schoolData.name,
        description: schoolData.description || 'Açıklama bulunmuyor',
        address: schoolData.address || '',
        city: schoolData.city || '',
        district: schoolData.district || '',
        phone: schoolData.phone || '',
        email: schoolData.email || '',
        website: schoolData.website,
        photoURL: schoolData.photoURL || schoolData.logo || schoolData.images?.[0],
        socialMedia: schoolData.socialMedia,
        danceStyles: schoolData.danceStyles || [],
        images: schoolData.images,
        createdAt: schoolData.createdAt,
        updatedAt: schoolData.updatedAt,
        courseCount: courseCount,
        rating: Number(rating.toFixed(1))
      };

      schools.push(schoolWithData);
    }

    return schools;
  } catch (error) {
    console.error('Dans okulları getirilirken hata:', error);
    throw error;
  }
};

/**
 * Dans okulu ID'ye göre getirir
 */
export const getDanceSchoolById = async (schoolId: string): Promise<DanceSchool | null> => {
  try {
    const schoolDocRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const schoolSnapshot = await getDoc(schoolDocRef);

    if (!schoolSnapshot.exists()) {
      return null;
    }

    return {
      id: schoolSnapshot.id,
      ...schoolSnapshot.data()
    } as DanceSchool;
  } catch (error) {
    console.error('Dans okulu getirilirken hata:', error);
    throw error;
  }
};

/**
 * Featured dans okullarını getirir (en çok kursu olan veya öne çıkarılan)
 */
export const getFeaturedDanceSchools = async (count: number = 4): Promise<DanceSchool[]> => {
  try {
    const schools = await getAllDanceSchools();

    // Okulları kurs sayısı ve değerlendirme puanına göre sırala
    return schools
      .sort((a, b) => {
        // Önce kurs sayısına göre sırala
        const courseCountDiff = (b.courseCount || 0) - (a.courseCount || 0);
        if (courseCountDiff !== 0) return courseCountDiff;

        // Kurs sayıları eşitse değerlendirme puanına göre sırala
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, count);
  } catch (error) {
    console.error('Öne çıkan dans okulları getirilirken hata:', error);
    throw error;
  }
};

export const createSchoolRequestForNewUser = async (userId: string, userEmail: string, displayName: string) => {
  const photoURL = generateInitialsAvatar(displayName, 'school');

  await setDoc(doc(db, 'users', userId), {
    photoURL,
    role: 'draft-school',
    is_school_pending: true,
    updatedAt: serverTimestamp()
  }, { merge: true });

  const schoolRequestRef = await addDoc(collection(db, 'schoolRequests'), {
    schoolName: displayName + ' Dans Okulu',
    contactPerson: displayName,
    contactEmail: userEmail,
    userId,
    userEmail,
    status: 'draft',
    type: 'activation',
    document_url: null,
    documentStatus: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, 'users', userId), {
    schoolRequestId: schoolRequestRef.id,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return schoolRequestRef.id;
};
