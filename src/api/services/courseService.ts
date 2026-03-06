import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  setDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { DanceClass, DanceStyle, DanceLevel } from '../../types';
import { getAllDanceSchools } from './schoolService';

// Koleksiyon adı
const COURSES_COLLECTION = 'courses';

/**
 * Yeni bir dans kursu oluşturur
 */
export const createDanceCourse = async (danceClassData: Omit<DanceClass, 'id'>): Promise<string> => {
  try {
    // Gerekli alanların kontrolü
    if (!danceClassData.name || !danceClassData.instructorId || !danceClassData.danceStyle) {
      throw new Error('Kurs adı, eğitmen ID ve dans stili zorunludur');
    }

    // undefined değerli alanları temizle
    const cleanData = Object.fromEntries(
      Object.entries(danceClassData).filter(([_, value]) => value !== undefined)
    );

    // Firestore'a eklenecek veri
    const courseData = {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currentParticipants: danceClassData.currentParticipants || 0,
    };

    // Yeni döküman oluştur
    const docRef = await addDoc(collection(db, COURSES_COLLECTION), courseData);
    console.log('Yeni dans kursu oluşturuldu:', docRef.id);

    // Oluşturulan ID'yi ekleyerek güncelle
    await updateDoc(docRef, { id: docRef.id });

    return docRef.id;
  } catch (error) {
    console.error('Dans kursu oluşturulurken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir dans kursunu ID'ye göre getirir
 */
export const getDanceCourseById = async (courseId: string): Promise<DanceClass | null> => {
  try {
    const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
    const courseSnapshot = await getDoc(courseDocRef);

    if (!courseSnapshot.exists()) {
      return null;
    }

    return courseSnapshot.data() as DanceClass;
  } catch (error) {
    console.error('Dans kursu getirilirken hata:', error);
    throw error;
  }
};

/**
 * Tüm dans kurslarını getirir
 */
export const getAllDanceCourses = async (): Promise<DanceClass[]> => {
  try {
    const activeSchools = await getAllDanceSchools();
    const activeSchoolIds = new Set(activeSchools.map(school => school.id));

    const coursesQuery = query(
      collection(db, COURSES_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const coursesSnapshot = await getDocs(coursesQuery);
    const courses: DanceClass[] = [];

    coursesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active' && activeSchoolIds.has(data.schoolId)) {
        courses.push({
          id: doc.id,
          ...data
        } as DanceClass);
      }
    });

    return courses;
  } catch (error) {
    console.error('Dans kursları getirilirken hata:', error);
    throw error;
  }
};

/**
 * Bir okulun tüm kurslarını getirir
 */
export const getSchoolDanceCourses = async (schoolId: string): Promise<DanceClass[]> => {
  try {
    const coursesQuery = query(
      collection(db, COURSES_COLLECTION),
      where('schoolId', '==', schoolId)
    );

    const coursesSnapshot = await getDocs(coursesQuery);
    const courses: DanceClass[] = [];

    coursesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active') {
        courses.push({
          ...data,
          id: doc.id
        } as DanceClass);
      }
    });

    courses.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return (b.createdAt as any).seconds - (a.createdAt as any).seconds;
      }
      return 0;
    });

    return courses;
  } catch (error) {
    console.error('Okul kursları getirilirken hata:', error);
    throw error;
  }
};

/**
 * Bir eğitmenin tüm kurslarını getirir
 */
export const getInstructorDanceCourses = async (instructorId: string): Promise<DanceClass[]> => {
  try {
    console.log('getInstructorDanceCourses çağrıldı, instructorId:', instructorId);

    const coursesQuery = query(
      collection(db, COURSES_COLLECTION),
      where('instructorId', '==', instructorId)
    );

    console.log('Query oluşturuldu:', COURSES_COLLECTION, 'instructorId ==', instructorId);

    const coursesSnapshot = await getDocs(coursesQuery);
    console.log('Query sonucu:', coursesSnapshot.size, 'belge bulundu');

    const courses: DanceClass[] = [];

    coursesSnapshot.forEach((docSnapshot) => {
      // Firestore belgesi kimliğini ve verilerini al
      const id = docSnapshot.id;
      const data = docSnapshot.data();

      // Timestamp dönüşümü için düzeltme
      const courseData = {
        id,
        ...data,
        // Firestore timestamp'i JavaScript Date nesnesine dönüştür
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
      } as DanceClass;

      console.log('İşlenmiş kurs verisi:', id, courseData);
      courses.push(courseData);
    });

    console.log('Toplam kurslar:', courses.length);
    return courses;
  } catch (error) {
    console.error('Eğitmen kursları getirilirken hata:', error);
    throw error;
  }
};

/**
 * Dans kursunu günceller
 */
export const updateDanceCourse = async (
  courseId: string,
  updateData: Partial<DanceClass>
): Promise<void> => {
  try {
    const courseDocRef = doc(db, COURSES_COLLECTION, courseId);

    // Güncellenecek veri
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(courseDocRef, updatePayload);
    console.log('Dans kursu güncellendi:', courseId);
  } catch (error) {
    console.error('Dans kursu güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Dans kursuna katılımcı ekler
 */
export const addParticipantToCourse = async (
  courseId: string,
  userId: string
): Promise<void> => {
  try {
    // Kursu getir
    const courseData = await getDanceCourseById(courseId);
    if (!courseData) {
      throw new Error('Kurs bulunamadı');
    }

    // Kapasite kontrolü
    if (courseData.currentParticipants >= courseData.maxParticipants) {
      throw new Error('Kurs kapasitesi dolu');
    }

    // Katılımcılar koleksiyonunu güncelle
    const participantDocRef = doc(db, `${COURSES_COLLECTION}/${courseId}/participants`, userId);
    await setDoc(participantDocRef, {
      userId,
      joinedAt: serverTimestamp()
    });

    // Kurs belgesindeki katılımcı sayısını güncelle
    const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(courseDocRef, {
      currentParticipants: (courseData.currentParticipants || 0) + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Kursa katılımcı eklenirken hata:', error);
    throw error;
  }
};

/**
 * Dans kursundan katılımcı çıkarır
 */
export const removeParticipantFromCourse = async (
  courseId: string,
  userId: string
): Promise<void> => {
  try {
    // Katılımcıyı sil
    const participantDocRef = doc(db, `${COURSES_COLLECTION}/${courseId}/participants`, userId);
    await deleteDoc(participantDocRef);

    // Kursu getir
    const courseData = await getDanceCourseById(courseId);
    if (!courseData) {
      throw new Error('Kurs bulunamadı');
    }

    // Katılımcı sayısını güncelle, en az 0 olacak şekilde
    const currentParticipants = Math.max(0, (courseData.currentParticipants || 1) - 1);

    // Kurs belgesini güncelle
    const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(courseDocRef, {
      currentParticipants,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Kursdan katılımcı çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Dans kursunu iptal eder (siler değil, durumunu günceller)
 */
export const cancelDanceCourse = async (courseId: string): Promise<void> => {
  try {
    const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(courseDocRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
    console.log('Dans kursu iptal edildi:', courseId);
  } catch (error) {
    console.error('Dans kursu iptal edilirken hata:', error);
    throw error;
  }
};

/**
 * Dans kursunu siler
 */
export const deleteDanceCourse = async (courseId: string): Promise<void> => {
  try {
    const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
    await deleteDoc(courseDocRef);
    console.log('Dans kursu silindi:', courseId);
  } catch (error) {
    console.error('Dans kursu silinirken hata:', error);
    throw error;
  }
};

/**
 * Öne çıkan dans kurslarını getirir (örn. anasayfa için)
 */
export const getFeaturedDanceCourses = async (count: number = 4): Promise<DanceClass[]> => {
  try {
    const activeSchools = await getAllDanceSchools();
    const activeSchoolIds = new Set(activeSchools.map(school => school.id));

    // Limit(50) fetch to have enough courses to filter local active ones, then pick count
    const coursesQuery = query(
      collection(db, COURSES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const coursesSnapshot = await getDocs(coursesQuery);
    const courses: DanceClass[] = [];

    coursesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active' && activeSchoolIds.has(data.schoolId)) {
        courses.push({
          id: doc.id,
          ...data
        } as DanceClass);
      }
    });

    // We only return the requested count
    return courses.slice(0, count);
  } catch (error) {
    console.error('Öne çıkan dans kursları getirilirken hata:', error);
    throw error;
  }
}; 