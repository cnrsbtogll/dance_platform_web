import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
  limit,
  where,
  getDoc,
  arrayUnion,
  setDoc
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import Button from '../../../../common/components/ui/Button';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomInput from '../../../../common/components/ui/CustomInput';
import SimpleModal from '../../../../common/components/ui/SimpleModal';
import Avatar from '../../../../common/components/ui/Avatar';
import { generateInitialsAvatar } from '../../../../common/utils/imageUtils';

// Dans stilleri için interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

// Seviye options
const levelOptions = [
  { label: 'Başlangıç', value: 'beginner' },
  { label: 'Orta', value: 'intermediate' },
  { label: 'İleri', value: 'advanced' },
  { label: 'Profesyonel', value: 'professional' }
];

// Para birimi options
const currencyOptions = [
  { label: 'TL', value: 'TRY' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' }
];

// Şehir options
const cityOptions = [
  { label: 'İstanbul', value: 'İstanbul' },
  { label: 'Ankara', value: 'Ankara' },
  { label: 'İzmir', value: 'İzmir' },
  { label: 'Bursa', value: 'Bursa' }
];

// Gün options
const dayOptions = [
  { label: 'Pazartesi', value: 'Pazartesi' },
  { label: 'Salı', value: 'Salı' },
  { label: 'Çarşamba', value: 'Çarşamba' },
  { label: 'Perşembe', value: 'Perşembe' },
  { label: 'Cuma', value: 'Cuma' },
  { label: 'Cumartesi', value: 'Cumartesi' },
  { label: 'Pazar', value: 'Pazar' }
];

const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' }
];

// Stil bazlı görsel eşleşmeleri (Dinamik asset yapısı için)
const STYLE_IMAGES: Record<string, string[]> = {
  'salsa': ['salsa-1.jpeg', 'salsa-2.jpeg', 'salsa-3.jpeg', 'salsa-4.jpeg'],
  'bachata': ['bachata-1.jpeg', 'bachata-2.jpeg', 'bachata-3.jpeg', 'bachata-4.jpeg'],
  'kizomba': ['kizomba-1.jpeg', 'kizomba-2.jpeg', 'kizomba-3.jpeg', 'kizomba-4.jpeg'],
  'tango': ['tango-1.jpeg', 'tango-2.jpeg', 'tango-3.jpeg', 'tango-4.jpeg'],
  'moderndance': ['moderndance-1.jpeg', 'moderndance-2.jpeg', 'moderndance-3.jpeg', 'moderndance-4.jpeg']
};

interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

interface Schedule {
  day: string;
  time: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  instructorIds: string[];
  instructorNames: string[];
  schoolId: string;
  schoolName: string;
  danceStyle: string;
  level: string;
  maxParticipants: number;
  currentParticipants: number;
  duration: number;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'draft';
  recurring: boolean;
  schedule: Schedule[];
  date: any;
  time: string;
  location: Location;
  imageUrl: string;
  highlights: string[];
  tags: string[];
  instructorPhone?: string;
  schoolPhone: string;
  schoolAddress: string;
  locationType?: 'school' | 'custom';
  customAddress?: string;
  createdAt?: any;
  updatedAt?: any;
  rating?: number;
}

interface FormData {
  name: string;
  description: string;
  instructorIds: string[];
  instructorNames: string[];
  schoolId: string;
  schoolName: string;
  danceStyle: string;
  level: string;
  maxParticipants: number;
  currentParticipants: number;
  duration: number;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'draft';
  recurring: boolean;
  schedule: Schedule[];
  date: any;
  time: string;
  location: Location;
  imageUrl: string;
  highlights: string[];
  tags: string[];
  locationType?: 'school' | 'custom';
  customAddress?: string;
  schoolAddress: string;
}

interface CourseManagementProps {
  instructorId?: string;
  schoolId?: string;
  isAdmin?: boolean;
  colorVariant?: 'instructor' | 'school';
}

// İletişim Modal bileşeni
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, course }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">İletişim Bilgileri</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Eğitmen(ler)</h4>
          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
            {course.instructorNames.map((name, idx) => (
              <div key={idx} className="border-b border-gray-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-medium">İsim:</span> {name}
                </p>
                {course.instructorPhone && idx === 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Telefon:</span>{' '}
                    <a href={`tel:${course.instructorPhone}`} className="text-blue-600 hover:underline">
                      {course.instructorPhone}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Okul Bilgileri */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Dans Okulu</h4>
          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">İsim:</span> {course.schoolName}
            </p>
            {course.schoolPhone && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-medium">Telefon:</span>{' '}
                <a href={`tel:${course.schoolPhone}`} className="text-blue-600 hover:underline">
                  {course.schoolPhone}
                </a>
              </p>
            )}
            {course.schoolAddress && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Adres:</span> {course.schoolAddress}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
};

const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-school-yellow fill-school-yellow' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Timestamp'i tarihe çeviren yardımcı fonksiyon ekle
const timestampToDate = (timestamp: any): string => {
  if (!timestamp) return '';

  try {
    // Firebase timestamp kontrolü
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    }

    // Normal Date objesi kontrolü
    if (timestamp instanceof Date) {
      return timestamp.toISOString().split('T')[0];
    }

    return '';
  } catch (error) {
    console.error('Tarih dönüştürme hatası:', error);
    return '';
  }
};

function CourseManagement({ instructorId, schoolId, isAdmin = false, colorVariant = 'instructor' }: CourseManagementProps): JSX.Element {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [danceStyles, setDanceStyles] = useState<{ label: string; value: string; }[]>([]);
  const [loadingStyles, setLoadingStyles] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    instructorIds: [],
    instructorNames: [],
    schoolId: '',
    schoolName: 'Bilinmeyen Okul',
    danceStyle: '',
    level: 'beginner',
    maxParticipants: 10,
    currentParticipants: 0,
    duration: 90,
    date: null,
    time: '18:00',
    price: 1500,
    currency: 'TRY',
    status: 'active',
    recurring: true,
    schedule: [],
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: 0,
      longitude: 0
    },
    imageUrl: '/placeholders/default-course-image.png',
    highlights: [],
    tags: [],
    locationType: 'school',
    customAddress: '',
    schoolAddress: ''
  });
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Array<{ label: string; value: string; courseIds?: string[]; photoURL?: string; addedBySchoolName?: string; isCertifiedConfirmed?: boolean }>>([]);
  const [schools, setSchools] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingInstructors, setLoadingInstructors] = useState<boolean>(true);
  const [loadingSchools, setLoadingSchools] = useState<boolean>(true);
  const [selectedContactCourse, setSelectedContactCourse] = useState<Course | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('active');
  const [instructorSearchTerm, setInstructorSearchTerm] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<Course | null>(null);
  const [selectedCourseForInstructors, setSelectedCourseForInstructors] = useState<Course | null>(null);
  const [studentSearchInModal, setStudentSearchInModal] = useState<string>('');
  const [instructorSearchInModal, setInstructorSearchInModal] = useState<string>('');
  const [showQuickAddStudent, setShowQuickAddStudent] = useState<boolean>(false);
  const [quickAddStudentData, setQuickAddStudentData] = useState({ displayName: '', email: '', password: 'feriha123', phoneNumber: '' });
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const [showQuickAddInstructor, setShowQuickAddInstructor] = useState<boolean>(false);
  const [quickAddInstructorData, setQuickAddInstructorData] = useState({ displayName: '', email: '', password: 'feriha123', phoneNumber: '' });
  const [isQuickAddingInstructor, setIsQuickAddingInstructor] = useState(false);
  const [instructorToRemove, setInstructorToRemove] = useState<{ id: string, name: string, courseId: string } | null>(null);

  const sectionBorderColor = isAdmin ? 'border-indigo-600' : colorVariant === 'school' ? 'border-school' : 'border-instructor';
  const inputFocusRing = colorVariant === 'school' ? 'focus:ring-school focus:border-school' : 'focus:ring-instructor focus:border-instructor';

  // Dans stillerini getir
  const fetchDanceStyles = async () => {
    try {
      const stylesRef = collection(db, 'danceStyles');
      const q = query(stylesRef, orderBy('label'));
      const querySnapshot = await getDocs(q);

      const styles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          label: data.label || data.name || '',
          value: data.value || doc.id
        };
      });

      setDanceStyles(styles);
    } catch (error) {
      console.error('Dans stilleri yüklenirken hata:', error);
      // Hata durumunda varsayılan stiller
      setDanceStyles([
        { label: 'Salsa', value: 'salsa' },
        { label: 'Bachata', value: 'bachata' },
        { label: 'Kizomba', value: 'kizomba' },
        { label: 'Tango', value: 'tango' },
        { label: 'Vals', value: 'vals' }
      ]);
    } finally {
      setLoadingStyles(false);
    }
  };

  // Test verisi ekleme fonksiyonu
  const addTestData = async () => {
    try {
      const testCourse = {
        name: 'Test Vals Kursu',
        description: 'Vals dansına giriş yapacağınız bu kursta, dansın temel prensiplerini öğreneceksiniz.',
        instructorId: 'test-instructor',
        instructorName: 'Bilinmeyen Eğitmen',
        schoolId: 'test-school',
        schoolName: 'Bilinmeyen Okul',
        danceStyle: 'vals',
        level: 'beginner',
        maxParticipants: 15,
        currentParticipants: 0,
        duration: 90,
        date: serverTimestamp(),
        price: 350,
        currency: 'TRY',
        status: 'active',
        recurring: true,
        schedule: [{ day: 'Pazartesi', time: '19:00' }],
        location: {
          address: '',
          city: 'İstanbul',
          state: '',
          zipCode: '',
          latitude: 41.0082,
          longitude: 28.9784
        },
        imageUrl: '/assets/images/dance/kurs1.jpg',
        highlights: [
          '90 dakika süren dersler',
          'Temel seviyeye uygun',
          'Deneyimli eğitmenler eşliğinde'
        ],
        tags: ['vals', 'beginner', '90 dakika'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Test verisi ekleniyor...');
      const docRef = await addDoc(collection(db, 'courses'), testCourse);
      console.log('Test verisi eklendi, ID:', docRef.id);

      return docRef.id;
    } catch (err) {
      console.error('Test verisi eklenirken hata:', err);
      throw err;
    }
  };

  // Kursları getir
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Firebase bağlantısını ve auth durumunu kontrol et
      if (!db) {
        console.error('Firebase db objesi:', db);
        throw new Error('Firebase bağlantısı başlatılmamış');
      }

      // Auth durumunu kontrol et
      const currentUser = auth.currentUser;
      console.log('Mevcut kullanıcı:', currentUser?.uid);

      if (!currentUser) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      console.log('Firebase bağlantısı başarılı, kurslar getiriliyor...');

      try {
        const coursesRef = collection(db, 'courses');
        console.log('Courses koleksiyonu referansı alındı:', coursesRef);

        // Get current user's role
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const userRole = userData?.role || '';
        console.log('Current user role:', userRole);

        // Query oluştur
        let q = query(coursesRef, orderBy('createdAt', 'desc')); // Default query for admin

        if (!isAdmin) {
          // If a schoolId prop is provided, prioritize it. Otherwise use the specific target (instructorId or schoolId)
          const targetSchoolId = schoolId || (userRole === 'school' ? currentUser.uid : null);
          const targetInstructorId = instructorId || (userRole === 'instructor' ? currentUser.uid : null);

          if (targetSchoolId) {
            console.log('School: Okula ait kurslar getiriliyor -', targetSchoolId);
            q = query(
              coursesRef,
              where('schoolId', '==', targetSchoolId),
              orderBy('createdAt', 'desc')
            );
          } else if (targetInstructorId) {
            console.log('Instructor: Eğitmene ait kurslar getiriliyor -', targetInstructorId);
            q = query(
              coursesRef,
              where('instructorId', '==', targetInstructorId),
              orderBy('createdAt', 'desc')
            );
          }
        } else {
          console.log('Admin: Tüm kurslar getiriliyor');
        }

        console.log('Ana query oluşturuldu:', q);

        console.log('Veriler çekiliyor...');
        try {
          const querySnapshot = await Promise.race([
            getDocs(q),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Veri çekme zaman aşımına uğradı')), 10000)
            )
          ]) as QuerySnapshot<DocumentData>;

          console.log('Query tamamlandı, sonuçlar:', {
            empty: querySnapshot.empty,
            size: querySnapshot.size,
            metadata: querySnapshot.metadata,
            docs: querySnapshot.docs.map(doc => doc.id)
          });

          if (querySnapshot.empty) {
            console.log('Henüz kurs kaydı bulunmuyor');
            setCourses([]);
            return;
          }

          const coursesData: Course[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            try {
              const processedCourse = processQueryData(doc);
              console.log(`Kurs işlendi (ID: ${doc.id}):`, processedCourse);
              coursesData.push(processedCourse);
            } catch (docError) {
              console.error(`Kurs dökümanı işlenirken hata (ID: ${doc.id}):`, docError);
            }
          });

          console.log('Tüm kurslar işlendi:', {
            totalCount: coursesData.length,
            courses: coursesData
          });

          setCourses(coursesData);
        } catch (queryError: any) {
          console.error('Query işlemi sırasında hata:', {
            code: queryError.code,
            message: queryError.message,
            name: queryError.name
          });

          if (queryError.code === 'permission-denied') {
            throw new Error('Kurs verilerine erişim izniniz yok. Yönetici ile iletişime geçin.');
          }
          throw queryError;
        }
      } catch (queryError) {
        console.error('Query işlemi sırasında hata:', queryError);
        throw queryError;
      }
    } catch (err) {
      console.error('Kurslar yüklenirken hata detayı:', {
        error: err,
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Kurslar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Eğitmenleri getir
  const fetchInstructors = async () => {
    console.log('fetchInstructors başlatılıyor:', {
      instructorId,
      schoolId,
      isAdmin,
      currentUserId: auth.currentUser?.uid,
      loadingInstructors
    });

    if (!auth.currentUser?.uid) {
      console.error('Oturum açmış kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      console.log('[DEBUG-COURSE-MODAL] Eğitmenler getiriliyor...');
      const instructorsRef = collection(db, 'users');

      let q;
      const targetSchoolId = schoolId || auth.currentUser.uid;

      // We need to fetch from 'users' and then filter by role='instructor' and school
      q = query(
        instructorsRef,
        orderBy('createdAt', 'desc')
      );

      console.log('[DEBUG-COURSE-MODAL] Query oluşturuldu, çalıştırılıyor...', {
        currentUserId: auth.currentUser.uid,
        isAdmin,
        targetSchoolId
      });

      try {
        const querySnapshot = await Promise.race([
          getDocs(q),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Eğitmen verisi çekme zaman aşımına uğradı')), 10000)
          )
        ]) as QuerySnapshot<DocumentData>;

        console.log('[DEBUG-COURSE-MODAL] Fetched docs count:', querySnapshot.size);

        const validDocs: any[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          const roles = Array.isArray(data.role) ? data.role : [data.role];

          if (roles.includes('instructor') || roles.includes('draft-instructor')) {
            validDocs.push({ id: doc.id, ...data });
          }
        });

        console.log('[DEBUG-COURSE-MODAL] Query sonuçları (Valid Instructors):', validDocs.map(d => ({
          id: d.id,
          displayName: d.displayName,
          email: d.email,
          schoolId: d.schoolId,
          schoolIds: d.schoolIds
        })));

        const instructorsData = validDocs
          .map(data => {
            return {
              label: data.displayName || data.email || 'İsimsiz Eğitmen',
              value: data.id,
              courseIds: data.courseIds || [],
              photoURL: data.photoURL || '',
              addedBySchoolName: data.addedBySchoolName,
              isCertifiedConfirmed: data.isCertifiedConfirmed
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        console.log('İşlenmiş eğitmen listesi:', instructorsData);
        setInstructors(instructorsData);
      } catch (queryError: any) {
        console.error('Query işlemi sırasında hata:', {
          code: queryError.code,
          message: queryError.message,
          name: queryError.name,
          stack: queryError.stack
        });

        if (queryError.code === 'permission-denied') {
          throw new Error('Eğitmen verilerine erişim izniniz yok. Yönetici ile iletişime geçin.');
        }
        throw queryError;
      }
    } catch (error) {
      console.error('Eğitmenler yüklenirken hata detayı:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        code: error instanceof Error ? (error as any).code : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });
      setInstructors([]);
    } finally {
      setLoadingInstructors(false);
    }
  };

  // Okulları getir
  const fetchSchools = async () => {
    // Both admins and instructors can see the school list for course affiliation
    if (!isAdmin && colorVariant !== 'instructor') return;

    try {
      console.log('Okullar getiriliyor...');
      const schoolsRef = collection(db, 'schools');
      console.log('Schools koleksiyonu referansı:', schoolsRef);

      const q = query(schoolsRef);
      console.log('Oluşturulan query:', q);

      const querySnapshot = await getDocs(q);
      console.log('Query sonuçları:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
        docs: querySnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      });

      const schoolsList = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Okul verisi işleniyor:', {
            id: doc.id,
            data: data,
            displayName: data.displayName,
            name: data.name,
            ad: data.ad,
            status: data.status,
            userId: data.userId,
            email: data.email
          });

          // Sadece aktif okulları al
          if (data.status === 'active') {
            return {
              label: data.displayName || data.name || data.ad || data.email || 'İsimsiz Okul',
              value: doc.id
            };
          }
          return null;
        })
        .filter((school): school is { label: string; value: string } => school !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      console.log('İşlenmiş okul listesi:', schoolsList);
      setSchools(schoolsList);
    } catch (error) {
      console.error('Okullar yüklenirken hata detayı:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        code: error instanceof Error ? (error as any).code : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Varsayılan okul listesi
      setSchools([
        { label: 'Test Okul 1', value: 'test-school-1' },
        { label: 'Test Okul 2', value: 'test-school-2' }
      ]);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Öğrencileri getir (Kayıtlı sayısı için)
  const fetchStudents = async () => {
    try {
      // Okul kısıtlamasını kaldırıyoruz: Tüm öğrencileri arayabilmek için okulId filtresini sildik
      const usersRef = collection(db, 'users');
      // Rol filtresini Firestore tarafında veya yerel olarak yapabiliriz. 
      // Firestore 'array-contains' filtresi için index gerektirebilir, 
      // bu yüzden tüm kullanıcıları çekip yerel filtrelemeye devam ediyoruz.
      const q = query(usersRef);

      const querySnapshot = await getDocs(q);
      const studentList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter by role locally since Firestore doesn't allow multiple array-contains
        .filter((user: any) =>
          typeof user.role === 'string'
            ? user.role === 'student'
            : Array.isArray(user.role) && user.role.includes('student')
        );
      setStudents(studentList);
    } catch (error) {
      console.error('Öğrenciler yüklenirken hata:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Öğrenciyi kursa ekle
  const handleAddStudentToCourse = async (studentId: string, courseId: string) => {
    try {
      const isSchoolUser = typeof userRole === 'string' ? userRole === 'school' : Array.isArray(userRole) ? (userRole as string[]).includes('school') : false;
      const effectiveSchoolId = schoolId || (auth.currentUser as any)?.schoolId || (isSchoolUser ? auth.currentUser?.uid : null);

      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);
      const courseData = courseSnap.exists() ? courseSnap.data() : null;
      const courseInstructorIds = courseData?.instructorIds || (courseData?.instructorId ? [courseData.instructorId] : []);

      const updatePayload: any = {
        courseIds: arrayUnion(courseId),
        ...(effectiveSchoolId ? { schoolIds: arrayUnion(effectiveSchoolId) } : {}),
        updatedAt: serverTimestamp()
      };

      if (courseInstructorIds.length > 0) {
        updatePayload.instructorIds = arrayUnion(...courseInstructorIds);
      }

      await updateDoc(doc(db, 'users', studentId), updatePayload);

      // State'i güncelle
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          const currentCourseIds = s.courseIds || [];
          const currentSchoolIds = s.schoolIds || [];
          const currentInstructorIds = s.instructorIds || [];

          return {
            ...s,
            courseIds: currentCourseIds.includes(courseId) ? currentCourseIds : [...currentCourseIds, courseId],
            schoolIds: effectiveSchoolId && !currentSchoolIds.includes(effectiveSchoolId) ? [...currentSchoolIds, effectiveSchoolId] : currentSchoolIds,
            instructorIds: [...new Set([...currentInstructorIds, ...courseInstructorIds])]
          };
        }
        return s;
      }));
      setSuccess('Öğrenci kursa başarıyla eklendi ve okul öğrencilerine dahil edildi.');
      setStudentSearchInModal('');
    } catch (err) {
      console.error('Öğrenci eklenirken hata:', err);
      setError('Öğrenci eklenemedi.');
    }
  };

  // Yeni öğrenci oluştur ve kursa ekle
  const handleQuickAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddStudentData.email || !quickAddStudentData.displayName || !quickAddStudentData.password) {
      setError('E-posta, İsim ve Şifre alanları zorunludur.');
      return;
    }

    try {
      setIsQuickAdding(true);
      setError(null);

      const isSchoolUser = typeof userRole === 'string' ? userRole === 'school' : Array.isArray(userRole) ? (userRole as any as string[]).includes('school') : false;
      const isInstructorUser = typeof userRole === 'string' ? userRole === 'instructor' : Array.isArray(userRole) ? (userRole as any as string[]).includes('instructor') : false;

      // Önce prop'tan al, yoksa Firestore'dan çek
      let effectiveSchoolId = schoolId || (auth.currentUser as any)?.schoolId || (isSchoolUser ? auth.currentUser?.uid : null);

      if (!effectiveSchoolId && auth.currentUser?.uid) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          effectiveSchoolId = userDoc.data().schoolId || userDoc.data().schoolIds?.[0] || null;
        }
      }

      // Eğitmen okuldan bağımsız öğrenci ekleyebilir — okul zorunlu değil
      if (!effectiveSchoolId && !isAdmin && !isInstructorUser) {
        throw new Error("Okul bilgisi bulunamadı");
      }

      // Check if user already exists
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', quickAddStudentData.email)));
      if (!userSnapshot.empty) {
        setError('Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var. Lütfen arama kısmından ekleyin.');
        setIsQuickAdding(false);
        return;
      }

      const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth');
      const { secondaryAuth } = await import('../../../../api/firebase/firebase');

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, quickAddStudentData.email, quickAddStudentData.password);
      const newUser = userCredential.user;

      await updateProfile(newUser, {
        displayName: quickAddStudentData.displayName
      });

      // E-posta doğrulama maili gönder
      await sendEmailVerification(newUser);

      let schoolNameData = '';
      if (effectiveSchoolId) {
        const schoolRef = doc(db, 'users', effectiveSchoolId);
        const schoolDoc = await getDoc(schoolRef);
        schoolNameData = schoolDoc.exists() ? schoolDoc.data().displayName : '';
      }

      const courseInstructorIds = selectedCourseForStudents?.instructorIds || (auth.currentUser?.uid ? [auth.currentUser.uid] : []);

      // Assign to user collection
      const newStudentData = {
        id: newUser.uid,
        displayName: quickAddStudentData.displayName,
        email: quickAddStudentData.email,
        phoneNumber: quickAddStudentData.phoneNumber || '',
        role: ['student'],
        level: 'beginner',
        schoolId: effectiveSchoolId || null,
        schoolIds: effectiveSchoolId ? [effectiveSchoolId] : [],
        instructorIds: courseInstructorIds,
        schoolName: schoolNameData || null,
        emailVerified: false,
        password: quickAddStudentData.password,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: '',
        courseIds: selectedCourseForStudents?.id ? [selectedCourseForStudents.id] : []
      };

      await setDoc(doc(db, 'users', newUser.uid), newStudentData);

      // secondary auth session kapat
      await secondaryAuth.signOut();

      // Update local state
      setStudents(prev => [{ ...newStudentData } as any, ...prev]);

      setSuccess('Yeni öğrenci oluşturuldu ve kursa eklendi.');
      setShowQuickAddStudent(false);
      setQuickAddStudentData({ displayName: '', email: '', password: 'feriha123', phoneNumber: '' });

      // Sign out from the secondary auth so it doesn't affect main session
      await secondaryAuth.signOut();
    } catch (err: any) {
      console.error('Yeni öğrenci eklenirken hata:', err);
      setError(err.message || 'Öğrenci eklenirken bir hata oluştu');
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Yeni eğitmen oluştur (Kurstan hızlı ekleme)
  const handleQuickAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddInstructorData.email || !quickAddInstructorData.displayName || !quickAddInstructorData.password) {
      setError('E-posta, İsim ve Şifre alanları zorunludur.');
      return;
    }

    try {
      setIsQuickAddingInstructor(true);
      setError(null);

      const isSchoolUser = typeof userRole === 'string' ? userRole === 'school' : Array.isArray(userRole) ? (userRole as any as string[]).includes('school') : false;
      const isInstructorUser = typeof userRole === 'string' ? userRole === 'instructor' : Array.isArray(userRole) ? (userRole as any as string[]).includes('instructor') : false;

      // Önce prop'tan al, yoksa Firestore'dan çek
      let effectiveSchoolId = schoolId || (auth.currentUser as any)?.schoolId || (isSchoolUser ? auth.currentUser?.uid : null);

      if (!effectiveSchoolId && auth.currentUser?.uid) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          effectiveSchoolId = userDoc.data().schoolId || userDoc.data().schoolIds?.[0] || null;
        }
      }

      // Eğitmen okuldan bağımsız ekleyebilir
      if (!effectiveSchoolId && !isAdmin && !isInstructorUser) {
        throw new Error("Okul bilgisi bulunamadı");
      }

      const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', quickAddInstructorData.email)));
      if (!userSnapshot.empty) {
        setError('Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.');
        setIsQuickAddingInstructor(false);
        return;
      }

      const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth');
      const { secondaryAuth } = await import('../../../../api/firebase/firebase');

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, quickAddInstructorData.email, quickAddInstructorData.password);
      const newUser = userCredential.user;

      await updateProfile(newUser, {
        displayName: quickAddInstructorData.displayName
      });

      // E-posta doğrulama maili gönder
      await sendEmailVerification(newUser);

      let schoolNameData = '';
      if (effectiveSchoolId) {
        const schoolRef = doc(db, 'users', effectiveSchoolId);
        const schoolDoc = await getDoc(schoolRef);
        schoolNameData = schoolDoc.exists() ? schoolDoc.data().displayName : '';
      }

      const newInstructorData = {
        id: newUser.uid,
        displayName: quickAddInstructorData.displayName,
        email: quickAddInstructorData.email,
        phoneNumber: quickAddInstructorData.phoneNumber || '',
        role: isSchoolUser ? ['instructor'] : ['draft-instructor'],
        isInstructor: true,
        status: 'active',
        schoolId: effectiveSchoolId || null,
        schoolIds: effectiveSchoolId ? [effectiveSchoolId] : [],
        schoolName: schoolNameData || null,
        emailVerified: false,
        password: quickAddInstructorData.password,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: '',
        danceStyles: [],
        experience: 0,
        courseIds: selectedCourseForInstructors?.id ? [selectedCourseForInstructors.id] : []
      };

      // 1. Users koleksiyonuna ekle
      await setDoc(doc(db, 'users', newUser.uid), newInstructorData);

      // 2. Instructors koleksiyonuna da ekle (Admin panelinde görünmesi için)
      const instructorEntryId = `instructor_${newUser.uid}`;
      await setDoc(doc(db, 'instructors', instructorEntryId), {
        userId: newUser.uid,
        ad: quickAddInstructorData.displayName,
        displayName: quickAddInstructorData.displayName,
        email: quickAddInstructorData.email,
        phoneNumber: quickAddInstructorData.phoneNumber || '',
        okul_id: effectiveSchoolId || null,
        schoolId: effectiveSchoolId || null,
        schoolName: schoolNameData || null,
        status: isSchoolUser ? 'active' : 'pending',
        role: ['instructor'],
        uzmanlık: [],
        tecrube: 0,
        biyografi: '',
        gorsel: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        courseIds: newInstructorData.courseIds
      });

      // Listeye ekle (DropDown için)
      const newInstructorLabel = {
        label: newInstructorData.displayName,
        value: newInstructorData.id,
        courseIds: newInstructorData.courseIds,
        photoURL: ''
      };
      setInstructors(prev => [newInstructorLabel, ...prev]);

      // Eğer mevcut bir modal içindeysek (Manage Instructors modal)
      if (selectedCourseForInstructors) {
        // Kurs dokümanını güncelle
        const courseRef = doc(db, 'courses', selectedCourseForInstructors.id);
        await updateDoc(courseRef, {
          instructorIds: arrayUnion(newInstructorData.id),
          instructorNames: arrayUnion(newInstructorData.displayName),
          updatedAt: serverTimestamp()
        });

        // Local courses state'ini güncelle
        setCourses(prev => prev.map(c =>
          c.id === selectedCourseForInstructors.id
            ? {
              ...c,
              instructorIds: [...(c.instructorIds || []), newInstructorData.id],
              instructorNames: [...(c.instructorNames || []), newInstructorData.displayName]
            }
            : c
        ));

        // Modal state'ini güncelle
        setSelectedCourseForInstructors(prev => prev ? ({
          ...prev,
          instructorIds: [...(prev.instructorIds || []), newInstructorData.id],
          instructorNames: [...(prev.instructorNames || []), newInstructorData.displayName]
        }) : null);
      } else {
        // Sadece form data'ya ekle (Yeni kurs oluşturma flow'u)
        setFormData(prev => ({
          ...prev,
          instructorIds: [...prev.instructorIds, newInstructorData.id],
          instructorNames: [...prev.instructorNames, newInstructorData.displayName]
        }));
      }

      setSuccess('Yeni eğitmen oluşturuldu ve kursa eklendi.');
      setShowQuickAddInstructor(false);
      setQuickAddInstructorData({ displayName: '', email: '', password: 'feriha123', phoneNumber: '' });

      await secondaryAuth.signOut();
    } catch (err: any) {
      console.error('Yeni eğitmen eklenirken hata:', err);
      setError(err.message || 'Eğitmen eklenirken bir hata oluştu');
    } finally {
      setIsQuickAddingInstructor(false);
    }
  };

  // Öğrenciyi kurstan çıkar
  const handleRemoveStudentFromCourse = async (studentId: string, courseId: string) => {
    if (!window.confirm('Öğrenciyi bu kurstan çıkarmak istediğinizden emin misiniz?')) return;
    try {
      const student = students.find(s => s.id === studentId);
      const newCourseIds = student.courseIds.filter((id: string) => id !== courseId);
      await updateDoc(doc(db, 'users', studentId), {
        courseIds: newCourseIds,
        updatedAt: serverTimestamp()
      });
      // State'i güncelle
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, courseIds: newCourseIds } : s));
      setSuccess('Öğrenci kurstan çıkarıldı.');
    } catch (err) {
      console.error('Öğrenci çıkarılırken hata:', err);
      setError('Öğrenci çıkarılamadı.');
    }
  };

  // Eğitmeni kursa ekle
  const handleAddInstructorToCourse = async (instructorId: string, instructorName: string, courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const courseRef = doc(db, 'courses', courseId);

      const courseSnapshot = await getDoc(courseRef);
      if (!courseSnapshot.exists()) throw new Error('Kurs bulunamadı.');

      const courseData = courseSnapshot.data();
      const currentInstructorIds = courseData.instructorIds || [];
      const currentInstructorNames = courseData.instructorNames || [];

      if (!currentInstructorIds.includes(instructorId)) {
        await updateDoc(courseRef, {
          instructorIds: arrayUnion(instructorId),
          instructorNames: arrayUnion(instructorName),
          updatedAt: serverTimestamp()
        });

        // Update the instructor user document with the courseId
        const instructorRef = doc(db, 'users', instructorId);

        // Okul bağlamını belirle
        const isSchoolUser = typeof userRole === 'string' ? userRole === 'school' : Array.isArray(userRole) ? (userRole as any as string[]).includes('school') : false;
        const effectiveSchoolId = schoolId || (auth.currentUser as any)?.schoolId || (isSchoolUser ? auth.currentUser?.uid : null);

        await updateDoc(instructorRef, {
          courseIds: arrayUnion(courseId),
          // Eğer eğitmen bu okula bağlı değilse, okul listesine ekle
          ...(effectiveSchoolId ? { schoolIds: arrayUnion(effectiveSchoolId) } : {}),
          updatedAt: serverTimestamp()
        });

        // Modalı ve course id statelerini güncelle
        setCourses(prev => prev.map(c =>
          c.id === courseId ? { ...c, instructorIds: [...currentInstructorIds, instructorId], instructorNames: [...currentInstructorNames, instructorName] } : c
        ));

        if (selectedCourseForInstructors && selectedCourseForInstructors.id === courseId) {
          setSelectedCourseForInstructors(prev => prev ? {
            ...prev,
            instructorIds: [...currentInstructorIds, instructorId],
            instructorNames: [...currentInstructorNames, instructorName]
          } : null);
        }

        // Global eğitmen listesini de güncelle ki UI anında tepki versin
        setInstructors(prev => prev.map(inst =>
          inst.value === instructorId
            ? { ...inst, courseIds: [...(inst.courseIds || []), courseId] }
            : inst
        ));

        setSuccess('Eğitmen hesaba atandı.');
        setInstructorSearchInModal('');
      } else {
        setError('Bu eğitmen zaten kursa atanmış.');
      }
    } catch (error) {
      console.error('Eğitmen atanırken hata:', error);
      setError('Eğitmen atanamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Eğitmeni kurstan çıkar
  const handleRemoveInstructorFromCourse = async (id?: string, name?: string, cId?: string) => {
    const instructorId = id || instructorToRemove?.id;
    const instructorName = name || instructorToRemove?.name;
    const courseId = cId || instructorToRemove?.courseId;

    if (!instructorId || !courseId) return;

    if (auth.currentUser?.uid === instructorId) {
      setError('Kendinizi kurstan çıkaramazsınız.');
      setInstructorToRemove(null);
      return;
    }

    setInstructorToRemove(null);
    try {
      setLoading(true);
      setError(null);
      const courseRef = doc(db, 'courses', courseId);
      const courseSnapshot = await getDoc(courseRef);
      if (!courseSnapshot.exists()) throw new Error('Kurs bulunamadı.');

      const courseData = courseSnapshot.data();
      const currentInstructorIds = courseData.instructorIds || [];
      const currentInstructorNames = courseData.instructorNames || [];

      const newInstructorIds = currentInstructorIds.filter((id: string) => id !== instructorId);
      const newInstructorNames = currentInstructorNames.filter((name: string) => name !== instructorName);

      await updateDoc(courseRef, {
        instructorIds: newInstructorIds,
        instructorNames: newInstructorNames,
        updatedAt: serverTimestamp()
      });

      // Update the instructor user document, removing the courseId
      const instructorRef = doc(db, 'users', instructorId);
      const instructorSnap = await getDoc(instructorRef);
      if (instructorSnap.exists()) {
        const instData = instructorSnap.data();
        const currentCourseIds = instData.courseIds || [];
        const newCourseIds = currentCourseIds.filter((id: string) => id !== courseId);
        await updateDoc(instructorRef, {
          courseIds: newCourseIds,
          updatedAt: serverTimestamp()
        });
      }

      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, instructorIds: newInstructorIds, instructorNames: newInstructorNames } : c
      ));

      if (selectedCourseForInstructors && selectedCourseForInstructors.id === courseId) {
        setSelectedCourseForInstructors(prev => prev ? {
          ...prev,
          instructorIds: newInstructorIds,
          instructorNames: newInstructorNames
        } : null);
      }

      // Global eğitmen listesini de güncelle ki UI anında tepki versin
      setInstructors(prev => prev.map(inst =>
        inst.value === instructorId
          ? { ...inst, courseIds: (inst.courseIds || []).filter(id => id !== courseId) }
          : inst
      ));

      setSuccess('Eğitmen kurstan başarıyla çıkarıldı.');
    } catch (err) {
      console.error('Eğitmen çıkarılırken hata:', err);
      setError('Eğitmen çıkarılamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Eğitmen ve okul seçimlerini yönet
  const handleInstructorSchoolSelection = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Get current user's role
    const userRef = doc(db, 'users', currentUser.uid);
    getDoc(userRef).then((userDoc) => {
      const userData = userDoc.data();
      const role = userData?.role || '';
      setUserRole(role);

      if (isAdmin) {
        // Süper admin: Hem eğitmen hem okul seçebilir
        fetchInstructors();
        fetchSchools();
      } else if (role === 'instructor') {
        // Eğitmen: Otomatik olarak kendini ekle
        fetchSchools();
        setFormData(prev => ({
          ...prev,
          instructorIds: [currentUser.uid],
          instructorNames: [userData?.displayName || 'Bilinmeyen Eğitmen']
        }));
      } else if (role === 'school') {
        // Okul: Sadece eğitmen seçebilir, okul kendisidir
        const effectiveSchoolId = userData?.schoolId || currentUser.uid;
        console.log('Role school detected, setting effective schoolId:', effectiveSchoolId);

        fetchInstructors();
        setFormData(prev => ({
          ...prev,
          schoolId: effectiveSchoolId,
          schoolName: userData?.displayName || 'Bilinmeyen Okul'
        }));
      }
    });
  };

  useEffect(() => {
    handleInstructorSchoolSelection();
  }, [isAdmin]);

  // Stil bazlı görsel seçici bileşeni
  const renderImagePicker = () => {
    const selectedStyle = formData.danceStyle.toLowerCase().replace(/\s/g, '');
    const images = STYLE_IMAGES[selectedStyle] || [];

    if (!formData.danceStyle) return (
      <div className="p-4 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg text-center text-sm text-gray-500">
        Resim seçmek için önce bir dans stili seçin.
      </div>
    );

    if (images.length === 0) return (
      <div className="p-4 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg text-center text-sm text-gray-500">
        Bu stil için ön tanımlı görsel bulunamadı.
      </div>
    );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img) => {
          const folder = selectedStyle;
          const fullPath = `/assets/images/lessons/${folder}/${img}`;
          const isSelected = formData.imageUrl === fullPath;
          return (
            <button
              key={img}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, imageUrl: fullPath }))}
              className={`relative rounded-lg overflow-hidden border-2 transition-all h-24 group ${isSelected
                ? (colorVariant === 'school' ? 'border-school ring-2 ring-school/20' : 'border-instructor ring-2 ring-instructor/20')
                : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                }`}
            >
              <img src={fullPath} alt={img} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100 bg-black/10'}`}>
                {isSelected && (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Form render edilirken kullanıcı rolüne göre alanları göster/gizle
  const renderFormFields = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    return (
      <div className="space-y-8 md:col-span-2">
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in">
            {/* 1. Dans Stili */}
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                1. Dans Stili Seçimi
              </h3>
              <CustomSelect
                name="danceStyle"
                label="Dans Stili"
                options={danceStyles}
                value={formData.danceStyle}
                onChange={(value) => {
                  const style = value as string;
                  setFormData(prev => ({
                    ...prev,
                    danceStyle: style,
                    // Stil değişince otomatik ilk resmi seçelim (varsa)
                    imageUrl: STYLE_IMAGES[style.toLowerCase().replace(/\s/g, '')]?.[0]
                      ? `/assets/images/lessons/${style.toLowerCase().replace(/\s/g, '')}/${STYLE_IMAGES[style.toLowerCase().replace(/\s/g, '')][0]}`
                      : prev.imageUrl
                  }));
                }}
                placeholder="Dans Stili Seçin"
                colorVariant={colorVariant}
                required
              />
            </section>

            {/* 2. Görsel Seçimi */}
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                2. Kurs Görseli
              </h3>
              {renderImagePicker()}
            </section>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in">
            {/* 3. İsim ve Açıklama */}
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                3. Kurs Bilgileri
              </h3>
              <div className="space-y-4">
                <CustomInput
                  type="text"
                  name="name"
                  label="Kurs Adı"
                  value={formData.name}
                  onChange={handleInputChange}
                  colorVariant={colorVariant}
                  required
                />
                <CustomInput
                  name="description"
                  label="Açıklama"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  colorVariant={colorVariant}
                  required
                />

                {/* Konum Tipi Seçimi Geliştirmesi */}
                {colorVariant === 'instructor' && !isAdmin && (
                  <div className="pt-2 space-y-4">
                    <CustomSelect
                      name="locationType"
                      label="Kurs Nerede Verilecek?"
                      options={[
                        { label: 'Bir Dans Okulunda', value: 'school' },
                        { label: 'Özel Adreste', value: 'custom' }
                      ]}
                      value={formData.locationType || 'school'}
                      onChange={(value) => {
                        const type = value as 'school' | 'custom';
                        setFormData({
                          ...formData,
                          locationType: type,
                          // Seçim değiştiğinde diğer alanları temizle
                          schoolId: type === 'custom' ? '' : formData.schoolId,
                          schoolName: type === 'custom' ? '' : formData.schoolName,
                          schoolAddress: type === 'custom' ? '' : formData.schoolAddress,
                          customAddress: type === 'school' ? '' : formData.customAddress
                        });
                      }}
                      colorVariant={colorVariant}
                      required
                    />

                    {formData.locationType === 'school' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <CustomSelect
                          name="schoolId"
                          label="Hangi Dans Okulunda?"
                          options={schools}
                          value={formData.schoolId}
                          onChange={(value) => {
                            const style = value as string;
                            const selectedSchool = schools.find(s => s.value === style);
                            setFormData({
                              ...formData,
                              schoolId: style,
                              schoolName: selectedSchool?.label || ''
                            });
                          }}
                          placeholder="Okul Seçin"
                          colorVariant={colorVariant}
                        />
                        <p className="text-[10px] text-gray-500 mt-1 pl-1 italic">
                          Seçtiğiniz dans okulunun kayıtlı adresi kurs detaylarında öğrencilere gösterilecektir.
                        </p>
                      </div>
                    )}

                    {formData.locationType === 'custom' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <CustomInput
                          name="customAddress"
                          label="Açık Adres (Sokak, Bina No, Mahalle, İlçe/İl)"
                          value={formData.customAddress || ''}
                          onChange={(e) => setFormData({ ...formData, customAddress: e.target.value })}
                          multiline
                          rows={3}
                          placeholder="Örn: Caferağa Mah. Moda Cad. No:24/1 Kadıköy/İstanbul"
                          colorVariant={colorVariant}
                          required={formData.locationType === 'custom'}
                        />
                        <p className="text-[10px] text-gray-500 mt-1 pl-1 italic">
                          Öğrenciler kursun nerede yapılacağını bulmak için doğrudan bu adresi göreceklerdir.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 4. Seviye ve Kapasite */}
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                4. Seviye ve Kontenjan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomSelect
                  name="level"
                  label="Seviye"
                  options={levelOptions}
                  value={formData.level}
                  onChange={(value) => setFormData({ ...formData, level: value as string })}
                  colorVariant={colorVariant}
                  required
                />
                <CustomInput
                  type="number"
                  name="maxParticipants"
                  label="Maksimum Katılımcı"
                  value={formData.maxParticipants.toString()}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                  colorVariant={colorVariant}
                  required
                />
              </div>
            </section>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in">
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                5. Ücretlendirme ve Süre
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CustomInput
                  type="number"
                  name="price"
                  label="Fiyat"
                  value={formData.price.toString()}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  colorVariant={colorVariant}
                  required
                />
                <CustomSelect
                  name="currency"
                  label="Birim"
                  options={currencyOptions}
                  value={formData.currency}
                  onChange={(value) => setFormData({ ...formData, currency: value as string })}
                  colorVariant={colorVariant}
                  required
                />
                <CustomInput
                  type="number"
                  name="duration"
                  label="Süre (dk)"
                  value={formData.duration.toString()}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  colorVariant={colorVariant}
                  required
                />
              </div>
            </section>

            {/* 6. Eğitmen Seçimi */}
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                6. Eğitmenler
              </h3>
              <div className="space-y-4">
                <CustomInput
                  name="instructorSearch"
                  label=""
                  placeholder="İsim veya e-posta ile eğitmen ara..."
                  value={instructorSearchTerm}
                  onChange={(e: any) => setInstructorSearchTerm(e.target.value)}
                  colorVariant={colorVariant}
                  startIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto p-1">
                  {instructors
                    .filter(i =>
                      i.label.toLowerCase().includes(instructorSearchTerm.toLowerCase())
                    )
                    .map((instructor) => {
                      const isSelected = formData.instructorIds.includes(instructor.value);
                      return (
                        <button
                          key={instructor.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              const newIds = isSelected
                                ? prev.instructorIds.filter(id => id !== instructor.value)
                                : [...prev.instructorIds, instructor.value];
                              const newNames = isSelected
                                ? prev.instructorNames.filter(name => name !== instructor.label)
                                : [...prev.instructorNames, instructor.label];
                              return { ...prev, instructorIds: newIds, instructorNames: newNames };
                            });
                          }}
                          className={`flex items-center p-3 rounded-lg border transition-all text-sm ${isSelected
                            ? (colorVariant === 'school' ? 'bg-school/10 border-school text-school' : 'bg-instructor/10 border-instructor text-instructor')
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center border ${isSelected
                            ? (colorVariant === 'school' ? 'bg-school border-school' : 'bg-instructor border-instructor')
                            : 'border-gray-300 dark:border-slate-500'
                            }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">{instructor.label}</span>
                        </button>
                      );
                    })}
                  {instructors.filter(i => i.label.toLowerCase().includes(instructorSearchTerm.toLowerCase())).length === 0 && (
                    <div className="col-span-full py-4 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                      Eğitmen bulunamadı.
                    </div>
                  )}
                </div>
                {!showQuickAddInstructor ? (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    Eğitmen Feriha'da kayıtlı değil mi? <button type="button" onClick={(e) => { e.preventDefault(); setShowQuickAddInstructor(true); }} className="text-school dark:text-school-light font-medium hover:underline">Sıfırdan Eğitmen Ekle</button>
                  </div>
                ) : (
                  <div className="bg-school/5 border border-school/20 rounded-xl p-4 mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-sm font-semibold text-school mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Yeni Eğitmen Oluştur ve Seç
                    </h4>
                    {/* Browser Autofill Prevention Hacks */}
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Ad Soyad"
                        value={quickAddInstructorData.displayName}
                        onChange={(e) => setQuickAddInstructorData(prev => ({ ...prev, displayName: e.target.value }))}
                        autoComplete="off"
                        className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                      />
                      <input
                        type="email"
                        placeholder="E-posta Adresi"
                        value={quickAddInstructorData.email}
                        onChange={(e) => setQuickAddInstructorData(prev => ({ ...prev, email: e.target.value }))}
                        autoComplete="off"
                        className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="Telefon Numarası (Opsiyonel)"
                        value={quickAddInstructorData.phoneNumber}
                        onChange={(e) => setQuickAddInstructorData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        autoComplete="dont-fill-this"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                      />
                      <div className="w-full px-3 py-2 text-xs rounded-lg border bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400">
                        Eğitmen şifresi varsayılan olarak <span className="font-bold text-gray-900 dark:text-white">feriha123</span> yapılacaktır.
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickAddInstructor(false)}
                          className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium"
                          disabled={isQuickAddingInstructor}
                        >
                          İptal
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddInstructor}
                          disabled={isQuickAddingInstructor}
                          className="text-xs px-4 py-1.5 bg-school text-white rounded shadow-sm hover:bg-school-light font-medium transition-colors disabled:opacity-50"
                        >
                          {isQuickAddingInstructor ? 'Ekleniyor...' : 'Kaydet ve Seç'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in">
            {/* 7. Program */}
            <section className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                7. Kurs Programı
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {dayOptions.map((day) => {
                    const scheduleItem = formData.schedule.find(s => s.day === day.value);
                    const isSelected = !!scheduleItem;
                    return (
                      <div key={day.value} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              const newSchedule = isSelected
                                ? prev.schedule.filter(s => s.day !== day.value)
                                : [...prev.schedule, { day: day.value, time: '18:00' }];
                              return { ...prev, schedule: newSchedule, recurring: true };
                            });
                          }}
                          className={`w-full py-2 rounded-lg border text-xs font-medium transition-all ${isSelected
                            ? (colorVariant === 'school' ? 'bg-school/10 border-school text-school' : 'bg-instructor/10 border-instructor text-instructor')
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {day.label}
                        </button>
                        {isSelected && (
                          <input
                            type="time"
                            value={scheduleItem.time}
                            onChange={(e) => {
                              const newSchedule = formData.schedule.map(s =>
                                s.day === day.value ? { ...s, time: e.target.value } : s
                              );
                              setFormData({ ...formData, schedule: newSchedule });
                            }}
                            className={`block w-full px-2 py-1 rounded border-gray-300 dark:border-slate-600 text-[10px] dark:bg-slate-700 dark:text-white ${colorVariant === 'school' ? 'focus:ring-school focus:border-school' : 'focus:ring-instructor focus:border-instructor'}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 8. Durum */}
            <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 ${sectionBorderColor} pl-3`}>
                8. Yayınlanma Durumu
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: opt.value as any })}
                    className={`py-3 rounded-xl border-2 font-medium transition-all ${formData.status === opt.value
                      ? (colorVariant === 'school' ? 'bg-school/10 border-school text-school' : 'bg-instructor/10 border-instructor text-instructor')
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        console.log('loadInitialData başlatılıyor:', {
          isAdmin,
          schoolId,
          instructorId
        });

        // Her fonksiyonu ayrı ayrı çağıralım ki hata yerini bulalım
        try {
          await fetchCourses();
        } catch (e) {
          console.error('Kurslar yüklenirken hata:', e);
        }

        try {
          await fetchDanceStyles();
        } catch (e) {
          console.error('Dans stilleri yüklenirken hata:', e);
        }

        try {
          console.log('Eğitmenler yüklenecek');
          await fetchInstructors();
        } catch (e) {
          console.error('Eğitmenler yüklenirken hata:', e);
        }

        try {
          if (isAdmin) {
            await fetchSchools();
          }
        } catch (e) {
          console.error('Okullar yüklenirken hata:', e);
        }

        try {
          await fetchStudents();
        } catch (e) {
          console.error('Öğrenciler yüklenirken hata:', e);
        }

      } catch (err) {
        if (isMounted) {
          console.error('Veriler yüklenirken genel hata:', err);
          setError('Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, schoolId, instructorId]); // Dependency array'e schoolId ve instructorId ekleyelim

  // Kurs düzenleme
  const editCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      ...course,
      instructorIds: course.instructorIds || [],
      instructorNames: course.instructorNames || [],
      schedule: course.schedule || [],
      date: course.date,
      time: course.time || '18:00',
      locationType: course.locationType || 'school',
      customAddress: course.customAddress || '',
      schoolAddress: course.schoolAddress || ''
    });
    setCurrentStep(1);
    setEditMode(true);
  };

  // Yeni kurs ekleme
  const addNewCourse = () => {
    setSelectedCourse(null);
    setFormData({
      name: '',
      description: '',
      instructorIds: instructorId ? [instructorId] : [],
      instructorNames: instructorId ? [auth.currentUser?.displayName || 'Bilinmeyen Eğitmen'] : [],
      schoolId: schoolId || '',
      schoolName: 'Bilinmeyen Okul',
      danceStyle: '',
      level: 'beginner',
      maxParticipants: 10,
      currentParticipants: 0,
      duration: 90,
      date: null,
      time: '18:00',
      price: 1500,
      currency: 'TRY',
      status: 'active',
      recurring: true,
      schedule: [],
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: 0,
        longitude: 0
      },
      imageUrl: '/placeholders/default-course-image.png',
      highlights: [],
      tags: [],
      locationType: 'school',
      customAddress: '',
      schoolAddress: ''
    });
    setCurrentStep(1);
    setEditMode(true);
  };

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Firebase için veriyi temizleyen yardımcı fonksiyon
  const cleanDataForFirebase = (data: any) => {
    const cleanData = { ...data };

    // Obsolete fields from old single-instructor structure
    delete cleanData.instructorId;
    delete cleanData.instructorName;

    // Undefined değerleri kaldır
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    // Bazı alanları Firestore'a uygun hale getir
    const { id, createdAt, updatedAt, ...restData } = cleanData;

    return restData;
  };

  // Veri işleme fonksiyonunu güncelle
  const processQueryData = (doc: QueryDocumentSnapshot<DocumentData>): Course => {
    const courseData = doc.data();
    return {
      id: doc.id,
      name: courseData.name || '',
      description: courseData.description || '',
      instructorIds: courseData.instructorIds || (courseData.instructorId ? [courseData.instructorId] : []),
      instructorNames: courseData.instructorNames || (courseData.instructorName ? [courseData.instructorName] : ['Bilinmeyen Eğitmen']),
      instructorPhone: courseData.instructorPhone || '',
      schoolId: courseData.schoolId || '',
      schoolName: courseData.schoolName || 'Bilinmeyen Okul',
      schoolPhone: courseData.schoolPhone || '',
      schoolAddress: courseData.schoolAddress || '',
      danceStyle: courseData.danceStyle || '',
      level: courseData.level || 'beginner',
      maxParticipants: courseData.maxParticipants || 0,
      currentParticipants: courseData.currentParticipants || 0,
      duration: courseData.duration || 90,
      date: courseData.date,
      time: courseData.time || '18:00',
      price: courseData.price || 0,
      currency: courseData.currency || 'TRY',
      status: courseData.status || 'inactive',
      recurring: courseData.recurring || false,
      schedule: courseData.schedule || [],
      location: courseData.location || {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: 0,
        longitude: 0
      },
      imageUrl: courseData.imageUrl || '/placeholders/default-course-image.png',
      highlights: courseData.highlights || [],
      tags: courseData.tags || [],
      createdAt: courseData.createdAt,
      updatedAt: courseData.updatedAt,
      rating: courseData.rating,
      locationType: courseData.locationType || 'school',
      customAddress: courseData.customAddress || ''
    };
  };

  // Form gönderimi
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Eğer son adımda değilsek, "Enter" tuşu bir sonraki adıma geçirmeli
    if (currentStep < totalSteps) {
      const form = document.getElementById('course-form') as HTMLFormElement;
      if (form && form.reportValidity()) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    // Kurs programı kontrolü
    if (formData.schedule.length === 0) {
      setError('Lütfen en az bir ders günü seçerek kurs programını oluşturun.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Inherit school location
      let finalLocation = formData.location;
      if (formData.locationType === 'school' && formData.schoolId) {
        // Try schools collection first as it's the standard for schoolId
        const schoolRef = doc(db, 'schools', formData.schoolId);
        let schoolSnap = await getDoc(schoolRef);

        // Fallback to users if not found in schools (legacy or specific setup)
        if (!schoolSnap.exists()) {
          const userRef = doc(db, 'users', formData.schoolId);
          schoolSnap = await getDoc(userRef);
        }

        if (schoolSnap.exists()) {
          const schoolData = schoolSnap.data();
          if (schoolData.location) {
            finalLocation = schoolData.location;
          }
          formData.schoolAddress = schoolData.address || schoolData.location?.address || '';
        }
      } else {
        // Freelance course - clear school name if it was somehow set
        formData.schoolName = 'Freelance';
      }

      const cleanedData = cleanDataForFirebase(formData);

      // Clean up location data based on type
      if (cleanedData.locationType === 'custom') {
        cleanedData.schoolId = '';
        cleanedData.schoolName = '';
      } else {
        cleanedData.customAddress = '';
      }

      const courseDataToSave = {
        ...cleanedData,
        location: finalLocation,
        recurring: true,
        schedule: formData.schedule,
        updatedAt: serverTimestamp()
      };

      console.log('Kurs kaydediliyor (Payload):', courseDataToSave);
      console.log('Kullanıcı UID:', auth.currentUser?.uid);

      if (selectedCourse) {
        // Mevcut kursu güncelle
        const courseRef = doc(db, 'courses', selectedCourse.id);
        await updateDoc(courseRef, courseDataToSave);

        const updatedCourse: Course = {
          ...selectedCourse,
          ...courseDataToSave,
        };

        setCourses(prev => prev.map(course =>
          course.id === selectedCourse.id
            ? updatedCourse
            : course
        ));

        setSuccess('Kurs başarıyla güncellendi.');
      } else {
        // Yeni kurs ekle
        const docRef = await addDoc(collection(db, 'courses'), {
          ...courseDataToSave,
          createdAt: serverTimestamp()
        });

        const newCourse: Course = {
          ...courseDataToSave,
          id: docRef.id,
          createdAt: serverTimestamp(),
        };

        setCourses(prev => [newCourse, ...prev]);
        setSuccess('Yeni kurs başarıyla eklendi.');
      }

      setEditMode(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error('Kurs kaydedilirken hata oluştu:', err);
      setError('Kurs kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Kurs silme
  const deleteCourse = async (id: string) => {
    if (window.confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, 'courses', id));
        setCourses(prev => prev.filter(course => course.id !== id));
        setSuccess('Kurs başarıyla silindi.');
      } catch (err) {
        console.error('Kurs silinirken hata oluştu:', err);
        setError('Kurs silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Arama Bölümü */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Kurs Yönetimi</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kurslarınızı ekleyin, düzenleyin ve yönetin</p>
        </div>
        <div className="w-full sm:w-auto flex flex-col lg:flex-row gap-3">
          <div className="flex flex-col sm:flex-row gap-2 flex-grow">
            <div className="flex-grow sm:max-w-[240px]">
              <CustomInput
                name="search"
                label=""
                placeholder="Kurs ara..."
                value={searchTerm}
                onChange={(e: { target: { name: string; value: any } }) => setSearchTerm(e.target.value)}
                fullWidth
                colorVariant={colorVariant}
                startIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <Button
              onClick={addNewCourse}
              type="button"
              variant={isAdmin ? 'indigo' : colorVariant}
              className="h-10 px-4"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="whitespace-nowrap">Yeni Kurs</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <SimpleModal
        open={editMode || !!selectedCourse}
        onClose={() => {
          setEditMode(false);
          setSelectedCourse(null);
        }}
        title={`${selectedCourse ? 'Kursu Düzenle' : 'Yeni Kurs Ekle'} (Adım ${currentStep}/${totalSteps})`}
        colorVariant={isAdmin ? 'admin' : (colorVariant as 'school' | 'instructor')}
        bodyClassName={
          isAdmin
            ? 'bg-indigo-50/50 dark:bg-slate-900/80'
            : colorVariant === 'school'
              ? 'bg-orange-50/30 dark:bg-[#1a120b]'
              : 'bg-instructor-bg/90 dark:bg-slate-900/80'
        }
        actions={
          <div className="flex w-full justify-between items-center">
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setEditMode(false);
                setSelectedCourse(null);
              }}
              className="mr-auto"
            >
              İptal
            </Button>

            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Geri
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  variant={isAdmin ? 'indigo' : colorVariant}
                  onClick={() => {
                    const form = document.getElementById('course-form') as HTMLFormElement;
                    if (form && form.reportValidity()) {
                      setError(null);
                      setCurrentStep(prev => prev + 1);
                    } else if (!form) {
                      setError(null);
                      setCurrentStep(prev => prev + 1);
                    }
                  }}
                >
                  İleri
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById('course-form') as HTMLFormElement;
                    if (form && form.reportValidity()) {
                      handleSubmit();
                    }
                  }}
                  variant={isAdmin ? 'indigo' : colorVariant}
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : (selectedCourse ? 'Güncelle' : 'Kaydet')}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <form
          id="course-form"
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'textarea') {
              e.preventDefault();
              if (currentStep < totalSteps) {
                const form = document.getElementById('course-form') as HTMLFormElement;
                if (form && form.reportValidity()) {
                  setError(null);
                  setCurrentStep(prev => prev + 1);
                }
              }
            }
          }}
        >
          {error && (
            <div className="col-span-full p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="col-span-full p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {renderFormFields()}
          </div>
        </form>
      </SimpleModal>

      {/* Kurs Listesi Sekmeleri */}
      <div className="flex justify-start md:justify-end mb-4 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className={`flex w-full md:w-auto p-1 rounded-xl whitespace-nowrap ${colorVariant === 'school' ? 'bg-school-bg/50 dark:bg-school/5' : 'bg-gray-100 dark:bg-slate-800/50'} border border-gray-200 dark:border-slate-700/50`}>
          {([
            { value: 'all', label: 'Tümü' },
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Pasif' },
            { value: 'draft', label: 'Taslak' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex-1 md:flex-none justify-center px-2 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 ${statusFilter === value
                ? `${isAdmin ? 'bg-indigo-600' : colorVariant === 'school' ? 'bg-school' : 'bg-instructor'} text-white shadow-sm`
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent'
                }`}
            >
              <span className="truncate">{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusFilter === value
                ? 'bg-white/20 text-white'
                : (colorVariant === 'school' ? 'bg-school/10 text-school' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400')
                }`}>
                {courses.filter(c => value === 'all' ? true : c.status === value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Kurs Listesi */}
      <div className={`rounded-lg shadow overflow-hidden border ${isAdmin
        ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
        : colorVariant === 'school'
          ? 'bg-school-bg border-school/40 dark:border-school/30 dark:bg-[#1a120b]'
          : 'bg-instructor-bg/50 dark:bg-[#0f172a] border-instructor/30 dark:border-instructor/20'
        }`}>
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isAdmin
              ? 'bg-gray-50 dark:bg-slate-900'
              : colorVariant === 'school'
                ? 'bg-school-bg dark:bg-school/20'
                : 'bg-instructor-bg/80 dark:bg-instructor/10'
            }>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kurs</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yönetim</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kapasite</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Değerlendirme</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isAdmin
              ? 'bg-white dark:bg-slate-800 divide-gray-200 dark:divide-slate-700'
              : colorVariant === 'school'
                ? 'bg-school-bg dark:bg-[#1a120b] divide-school/20 dark:divide-[#493322]'
                : 'bg-instructor-bg/30 dark:bg-slate-900/40 divide-instructor/20 dark:divide-slate-800'
              }`}>
              {courses.filter(course =>
                (statusFilter === 'all' || course.status === statusFilter) &&
                (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.danceStyle.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map((course) => (
                <tr
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className={`transition-colors cursor-pointer ${isAdmin
                    ? 'hover:bg-gray-50 dark:hover:bg-slate-800'
                    : colorVariant === 'school'
                      ? 'hover:bg-school/5 dark:hover:bg-school/10'
                      : 'hover:bg-instructor/5 dark:hover:bg-instructor/10'
                    }`}>
                  <td className="px-4 py-4 max-w-[180px]">
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex items-center group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate max-w-[140px] transition-colors ${colorVariant === 'school' ? 'group-hover:text-school' : 'group-hover:text-instructor'
                          } text-gray-900 dark:text-white`}>
                          {course.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{course.danceStyle}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {course.recurring ? (
                        <div className="space-y-1">
                          {course.schedule.map((s, index) => (
                            <div key={index}>{s.day} {s.time}</div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {timestampToDate(course.date)} {course.time}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourseForStudents(course);
                        }}
                        title="Öğrenci Listesi"
                        className={`p-1.5 rounded-lg border transition-all ${colorVariant === 'school' ? 'bg-school/5 border-school/20 text-school hover:bg-school/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourseForInstructors(course);
                        }}
                        title="Eğitmen Atama/Listesi"
                        className={`p-1.5 rounded-lg border transition-all ${colorVariant === 'school' ? 'bg-school/5 border-school/20 text-school hover:bg-school/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${colorVariant === 'school' ? 'bg-school' : 'bg-instructor'}`}
                          style={{ width: `${Math.min(100, (students.filter(s => s.courseIds?.includes(course.id)).length / course.maxParticipants) * 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {students.filter(s => s.courseIds?.includes(course.id)).length}/{course.maxParticipants}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <StarIcon filled={true} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {course.rating ? course.rating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : course.status === 'draft'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {course.status === 'active' ? 'Aktif' : course.status === 'draft' ? 'Taslak' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editCourse(course);
                        }}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm active:scale-95 ${isAdmin
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                          : colorVariant === 'school'
                            ? 'bg-school/10 dark:bg-school/20 text-school dark:text-school-light border border-school/20 dark:border-school/30 hover:bg-school/20 dark:hover:bg-school/30'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }`}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
                            deleteCourse(course.id);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 rounded-md text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all shadow-sm active:scale-95"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 mt-2">
        {courses.filter(course =>
          (statusFilter === 'all' || course.status === statusFilter) &&
          (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.danceStyle.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length === 0 ? (
          <div className={`text-center py-8 text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
            {searchTerm ? 'Aramanıza uygun kurs bulunamadı.' : 'Henüz hiç kurs eklenmemiş.'}
          </div>
        ) : courses.filter(course =>
          (statusFilter === 'all' || course.status === statusFilter) &&
          (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.danceStyle.toLowerCase().includes(searchTerm.toLowerCase()))
        ).map((course) => (
          <div
            key={course.id}
            className={`rounded-xl border shadow-sm overflow-hidden ${isAdmin
              ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              : colorVariant === 'school'
                ? 'bg-white dark:bg-[#231810] border-school/20 dark:border-[#493322]'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between p-4 gap-3">
              <Link to={`/courses/${course.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm font-semibold text-gray-900 dark:text-white leading-tight ${colorVariant === 'school' ? 'group-hover:text-school' : 'group-hover:text-instructor'
                    }`}>{course.name}</h3>
                  <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full flex-shrink-0 ${course.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : course.status === 'draft'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {course.status === 'active' ? 'Aktif' : course.status === 'draft' ? 'Taslak' : 'Pasif'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{course.danceStyle}</p>
              </Link>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{course.rating ? course.rating.toFixed(1) : '0.0'}</span>
              </div>
            </div>

            {/* Card Body */}
            <div className={`px-4 pb-3 space-y-2 text-xs border-t ${isAdmin ? 'border-gray-100 dark:border-slate-700' : 'border-school/10 dark:border-[#493322]'
              }`}>
              <div className="flex items-center justify-between pt-2">
                {/* Schedule */}
                <div className="text-gray-600 dark:text-gray-400">
                  {course.recurring ? (
                    <span>{course.schedule.map(s => `${s.day} ${s.time}`).join(', ')}</span>
                  ) : (
                    <span>{timestampToDate(course.date)} {course.time}</span>
                  )}
                </div>
                {/* Capacity */}
                <div className="flex items-center gap-1.5">
                  <div className="w-16 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorVariant === 'school' ? 'bg-school' : 'bg-instructor'
                        }`}
                      style={{ width: `${Math.min(100, (students.filter(s => s.courseIds?.includes(course.id)).length / course.maxParticipants) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {students.filter(s => s.courseIds?.includes(course.id)).length}/{course.maxParticipants}
                  </span>
                </div>
              </div>

              {/* Management buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCourseForStudents(course); }}
                  title="Öğrenci Listesi"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${colorVariant === 'school' ? 'bg-school/5 border-school/20 text-school hover:bg-school/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Öğrenciler
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCourseForInstructors(course); }}
                  title="Eğitmen Atama"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${colorVariant === 'school' ? 'bg-school/5 border-school/20 text-school hover:bg-school/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Eğitmen
                </button>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className={`flex justify-end gap-2 px-4 py-2.5 border-t ${isAdmin
              ? 'bg-gray-50/70 dark:bg-slate-900/40 border-gray-100 dark:border-slate-700'
              : colorVariant === 'school'
                ? 'bg-school/5 dark:bg-school/10 border-school/10 dark:border-[#493322]'
                : 'bg-gray-50/50 dark:bg-slate-900/30 border-gray-100 dark:border-slate-700'
              }`}>
              <button
                onClick={(e) => { e.stopPropagation(); editCourse(course); }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAdmin
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100'
                  : colorVariant === 'school'
                    ? 'bg-school/10 text-school border border-school/20 hover:bg-school/20'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Düzenle
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (window.confirm('Bu kursu silmek istediğinizden emin misiniz?')) deleteCourse(course.id); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal - Kayıtlı Öğrenciler */}
      <SimpleModal
        open={!!selectedCourseForStudents}
        onClose={() => setSelectedCourseForStudents(null)}
        title={`"${selectedCourseForStudents?.name}" - Kayıtlı Öğrenciler`}
        colorVariant={isAdmin ? 'admin' : (colorVariant as 'school' | 'instructor')}
        bodyClassName={isAdmin
          ? 'bg-white dark:bg-slate-900'
          : colorVariant === 'school'
            ? 'bg-orange-50/30 dark:bg-[#1a120b]'
            : 'bg-instructor-bg/20 dark:bg-slate-900/60'}
        actions={
          <Button
            type="button"
            variant="outlined"
            onClick={() => setSelectedCourseForStudents(null)}
          >
            Kapat
          </Button>
        }
      >
        <div className="space-y-4">
          <div className={`flex justify-between items-center p-3 rounded-lg border ${colorVariant === 'school' ? 'bg-school/5 border-school/20 dark:border-school/10' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Toplam: <span className="font-bold text-gray-900 dark:text-white">{students.filter(s => s.courseIds?.includes(selectedCourseForStudents?.id)).length}</span> öğrenci
            </div>
          </div>

          {/* Öğrenci Ekleme Alanı */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="İsim veya email ile öğrenci ara ve ekle..."
                value={studentSearchInModal}
                onChange={(e) => setStudentSearchInModal(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 outline-none transition-all bg-white dark:bg-[#231810] dark:border-school/20 dark:text-white ${inputFocusRing}`}
              />
              <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Hızlı Öğrenci Ekleme Formu */}
            {showQuickAddStudent ? (
              <div className="bg-school/5 border border-school/20 rounded-xl p-4 mt-2 mb-4 animate-in fade-in zoom-in-95 duration-200">
                <h4 className="text-sm font-semibold text-school mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yeni Öğrenci Oluştur ve Ekle
                </h4>
                {/* Browser Autofill Prevention Hacks */}
                <input type="text" style={{ display: 'none' }} />
                <input type="password" style={{ display: 'none' }} />

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={quickAddStudentData.displayName}
                    onChange={(e) => setQuickAddStudentData(prev => ({ ...prev, displayName: e.target.value }))}
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                  />
                  <input
                    type="email"
                    placeholder="E-posta Adresi"
                    value={quickAddStudentData.email}
                    onChange={(e) => setQuickAddStudentData(prev => ({ ...prev, email: e.target.value }))}
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon Numarası (Opsiyonel)"
                    value={quickAddStudentData.phoneNumber}
                    onChange={(e) => setQuickAddStudentData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    autoComplete="dont-fill-this"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                  />
                  <div className="w-full px-3 py-2 text-xs rounded-lg border bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400">
                    Öğrenci şifresi varsayılan olarak <span className="font-bold text-gray-900 dark:text-white">feriha123</span> yapılacaktır.
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddStudent(false)}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium"
                      disabled={isQuickAdding}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddStudent}
                      disabled={isQuickAdding}
                      className="text-xs px-4 py-1.5 bg-school text-white rounded shadow-sm hover:bg-school-light font-medium transition-colors disabled:opacity-50"
                    >
                      {isQuickAdding ? 'Ekleniyor...' : 'Kaydet ve Kursa Ata'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                Öğrenciniz Feriha'da kayıtlı değil mi? <button type="button" onClick={() => setShowQuickAddStudent(true)} className="text-school hover:underline font-medium">Sıfırdan Öğrenci Oluştur</button>
              </div>
            )}

            {studentSearchInModal.length >= 2 && !showQuickAddStudent && (
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10">
                {students
                  .filter(s => {
                    const isAlreadyInCourse = s.courseIds?.includes(selectedCourseForStudents?.id);
                    const matchesSearch = (s.displayName?.toLowerCase().includes(studentSearchInModal.toLowerCase()) ||
                      s.email?.toLowerCase().includes(studentSearchInModal.toLowerCase()));
                    // Eğer admin ise tüm sistemdeki "student" rollü kişileri görsün
                    // Okul ise zaten sadece kendi öğrencilerini fetch ettik
                    return !isAlreadyInCourse && matchesSearch;
                  })
                  .map(student => (
                    <button
                      key={student.id}
                      onClick={() => handleAddStudentToCourse(student.id, selectedCourseForStudents!.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-gray-50 last:border-0 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {student.displayName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium dark:text-white">{student.displayName}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </div>
                      </div>
                      <div className={`p-1 rounded-full ${colorVariant === 'school' ? 'bg-school/10 text-school' : 'bg-instructor/10 text-instructor'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </button>
                  ))
                }
                {students.filter(s =>
                  !s.courseIds?.includes(selectedCourseForStudents?.id) &&
                  (s.displayName?.toLowerCase().includes(studentSearchInModal.toLowerCase()) ||
                    s.email?.toLowerCase().includes(studentSearchInModal.toLowerCase()))
                ).length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">Öğrenci bulunamadı.</div>
                  )}
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {students.filter(s => s.courseIds?.includes(selectedCourseForStudents?.id)).length > 0 ? (
              students.filter(s => s.courseIds?.includes(selectedCourseForStudents?.id)).map((student) => (
                <div key={student.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-colors ${colorVariant === 'school' ? 'border-school/10 dark:border-school/20 hover:bg-school/5 dark:hover:bg-school/10' : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-100 dark:border-slate-700">
                      <Avatar
                        src={student.photoURL}
                        alt={student.displayName}
                        className="w-full h-full"
                        userType="student"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{student.displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${student.level === 'advanced' ? 'bg-purple-100 text-purple-700' : student.level === 'intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {student.level === 'advanced' ? 'İleri' : student.level === 'intermediate' ? 'Orta' : 'Başlangıç'}
                    </span>
                    <button
                      onClick={() => handleRemoveStudentFromCourse(student.id, selectedCourseForStudents!.id)}
                      className="hidden group-hover:flex p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="Kurstan Çıkar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 dark:text-gray-600 italic">
                Bu kursa henüz öğrenci kaydı yapılmamış.
              </div>
            )}
          </div>
        </div>
      </SimpleModal>

      {/* Modal - Eğitmen Listesi */}
      <SimpleModal
        open={!!selectedCourseForInstructors}
        onClose={() => setSelectedCourseForInstructors(null)}
        title={`"${selectedCourseForInstructors?.name}" - Görevli Eğitmenler`}
        colorVariant={isAdmin ? 'admin' : (colorVariant as 'school' | 'instructor')}
        bodyClassName={isAdmin
          ? 'bg-white dark:bg-slate-900'
          : colorVariant === 'school'
            ? 'bg-orange-50/30 dark:bg-[#1a120b]'
            : 'bg-instructor-bg/20 dark:bg-slate-900/60'}
        actions={
          <Button
            type="button"
            variant="outlined"
            onClick={() => setSelectedCourseForInstructors(null)}
          >
            Kapat
          </Button>
        }
      >
        <div className="space-y-4">
          <div className={`flex justify-between items-center p-3 rounded-lg border ${colorVariant === 'school' ? 'bg-school/5 border-school/20 dark:border-school/10' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Görevli: <span className="font-bold text-gray-900 dark:text-white">
                {Array.from(new Set([
                  ...(selectedCourseForInstructors?.instructorIds || []),
                  ...instructors.filter(i => i.courseIds?.includes(selectedCourseForInstructors?.id || '')).map(i => i.value)
                ])).length}
              </span> eğitmen
            </div>
          </div>

          {/* Eğitmen Ara / Ata */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="İsim ile eğitmen ara ve ata..."
                value={instructorSearchInModal}
                onChange={(e) => setInstructorSearchInModal(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 outline-none transition-all bg-white dark:bg-[#231810] dark:border-school/20 dark:text-white ${inputFocusRing}`}
              />
              <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Arama Sonuçları */}
            {instructorSearchInModal.length >= 2 && (
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10">
                {instructors
                  .filter(i =>
                    !selectedCourseForInstructors?.instructorIds?.includes(i.value) &&
                    !i.courseIds?.includes(selectedCourseForInstructors?.id || '') &&
                    i.label.toLowerCase().includes(instructorSearchInModal.toLowerCase())
                  )
                  .map(instructor => (
                    <button
                      key={instructor.value}
                      onClick={() => handleAddInstructorToCourse(instructor.value, instructor.label, selectedCourseForInstructors!.id)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between border-b border-gray-50 dark:border-slate-700/50 last:border-0`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{instructor.label}</span>
                        {instructor.isCertifiedConfirmed && instructor.addedBySchoolName && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {instructor.addedBySchoolName} tarafından onaylı
                          </span>
                        )}
                      </div>
                      <span className="text-xs bg-school/10 text-school px-2 py-1 rounded-full">Ata</span>
                    </button>
                  ))}
                {instructors.filter(i =>
                  !selectedCourseForInstructors?.instructorIds?.includes(i.value) &&
                  !i.courseIds?.includes(selectedCourseForInstructors?.id || '') &&
                  i.label.toLowerCase().includes(instructorSearchInModal.toLowerCase())
                ).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">Eğitmen bulunamadı.</div>
                  )}
              </div>
            )}

            {/* Hızlı Eğitmen Ekleme Formu */}
            {showQuickAddInstructor ? (
              <div className="bg-school/5 border border-school/20 rounded-xl p-4 mt-2 mb-4 animate-in fade-in zoom-in-95 duration-200">
                <h4 className="text-sm font-semibold text-school mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yeni Eğitmen Oluştur ve Ata
                </h4>
                {/* Browser Autofill Prevention Hacks */}
                <input type="text" style={{ display: 'none' }} />
                <input type="password" style={{ display: 'none' }} />

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Eğitmen Ad Soyad"
                    value={quickAddInstructorData.displayName}
                    onChange={(e) => setQuickAddInstructorData(prev => ({ ...prev, displayName: e.target.value }))}
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                  />
                  <input
                    type="email"
                    placeholder="E-posta Adresi"
                    value={quickAddInstructorData.email}
                    onChange={(e) => setQuickAddInstructorData(prev => ({ ...prev, email: e.target.value }))}
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon Numarası (Opsiyonel)"
                    value={quickAddInstructorData.phoneNumber}
                    onChange={(e) => setQuickAddInstructorData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    autoComplete="dont-fill-this"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#231810] border-gray-200 dark:border-school/20 focus:ring-1 focus:ring-school outline-none dark:text-white transition-all"
                  />
                  <div className="w-full px-3 py-2 text-xs rounded-lg border bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400">
                    Eğitmen şifresi varsayılan olarak <span className="font-bold text-gray-900 dark:text-white">feriha123</span> yapılacaktır.
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddInstructor(false)}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium"
                      disabled={isQuickAddingInstructor}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddInstructor}
                      disabled={isQuickAddingInstructor}
                      className="text-xs px-4 py-1.5 bg-school text-white rounded shadow-sm hover:bg-school-light font-medium transition-colors disabled:opacity-50"
                    >
                      {isQuickAddingInstructor ? 'Ekleniyor...' : 'Kaydet ve Kursa Ata'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                Eğitmen Feriha'da kayıtlı değil mi? <button type="button" onClick={() => setShowQuickAddInstructor(true)} className="text-school dark:text-school-light font-medium hover:underline">Sıfırdan Eğitmen Ekle</button>
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 mt-4">
            {Array.from(new Set([
              ...(selectedCourseForInstructors?.instructorIds || []),
              ...instructors.filter(i => i.courseIds?.includes(selectedCourseForInstructors?.id || '')).map(i => i.value)
            ])).map((id) => {
              const matchedInstructor = instructors.find((i) => i.value === id);
              // Asıl kurs datasındaki isimlere fallback olmasını da sağlıyoruz.
              const fallbackIndex = selectedCourseForInstructors?.instructorIds?.indexOf(id);
              const fallbackName = fallbackIndex !== undefined && fallbackIndex > -1 ? selectedCourseForInstructors?.instructorNames?.[fallbackIndex] : undefined;
              const name = matchedInstructor?.label || fallbackName || 'İsimsiz Eğitmen';

              return (
                <div key={id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${colorVariant === 'school' ? 'border-school/10 dark:border-school/20 hover:bg-school/5 dark:hover:bg-school/10' : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-100 dark:border-slate-700">
                      <Avatar
                        src={matchedInstructor?.photoURL}
                        alt={name}
                        className="w-full h-full"
                        userType="instructor"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {id.substring(0, 8)}...</div>
                    </div>
                  </div>
                  {auth.currentUser?.uid !== id && (
                    <button
                      onClick={() => setInstructorToRemove({ id, name, courseId: selectedCourseForInstructors!.id })}
                      className="p-1.5 rounded-lg border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Kurstan Çıkar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SimpleModal>

      {/* Instructor Remove Confirmation Modal */}
      <SimpleModal
        open={!!instructorToRemove}
        onClose={() => setInstructorToRemove(null)}
        title="Eğitmeni Kurstan Çıkar"
        colorVariant={colorVariant}
        actions={
          <>
            <Button variant="outlined" onClick={() => setInstructorToRemove(null)}>Vazgeç</Button>
            <Button variant="danger" onClick={() => handleRemoveInstructorFromCourse()}>Çıkar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Bu işlem geri alınamaz.</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>{instructorToRemove?.name}</strong> isimli eğitmeni bu kurstan çıkarmak istediğinizden emin misiniz?
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Eğitmen bu kurstan çıkarıldığında artık derslere katılamayacak ve kurs listesinde görünmeyecektir.
          </p>
        </div>
      </SimpleModal>
    </div>
  );
}

export default CourseManagement; 