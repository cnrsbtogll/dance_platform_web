import React, { useState, useEffect } from 'react';
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
  getDoc
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import Button from '../../../../common/components/ui/Button';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomInput from '../../../../common/components/ui/CustomInput';
import SimpleModal from '../../../../common/components/ui/SimpleModal';

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
  createdAt?: any;
  updatedAt?: any;
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
    tags: []
  });
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Array<{ label: string; value: string }>>([]);
  const [schools, setSchools] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingInstructors, setLoadingInstructors] = useState<boolean>(true);
  const [loadingSchools, setLoadingSchools] = useState<boolean>(true);
  const [selectedContactCourse, setSelectedContactCourse] = useState<Course | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');

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
          if (userRole === 'school') {
            console.log('School: Okula ait kurslar getiriliyor -', currentUser.uid);
            q = query(
              coursesRef,
              where('schoolId', '==', currentUser.uid),
              orderBy('createdAt', 'desc')
            );
          } else if (userRole === 'instructor') {
            console.log('Instructor: Eğitmene ait kurslar getiriliyor -', currentUser.uid);
            q = query(
              coursesRef,
              where('instructorId', '==', currentUser.uid),
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

    if (instructorId) {
      console.log('Instructor ID mevcut, eğitmenler getirilmeyecek');
      return;
    }

    if (!auth.currentUser?.uid) {
      console.error('Oturum açmış kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      console.log('Eğitmenler getiriliyor...');
      const instructorsRef = collection(db, 'instructors');

      let q;
      // Okul yöneticisi için kendi ID'sine bağlı eğitmenleri getir
      if (!isAdmin) {
        console.log('Okul yöneticisi için eğitmen sorgusu oluşturuluyor:', auth.currentUser.uid);
        q = query(
          instructorsRef,
          where('schoolId', '==', auth.currentUser.uid),
          where('status', '==', 'active')
        );
      } else {
        console.log('Admin için tüm eğitmenler sorgusu oluşturuluyor');
        q = query(
          instructorsRef,
          where('status', '==', 'active')
        );
      }

      console.log('Eğitmenler için query oluşturuldu, çalıştırılıyor...', {
        currentUserId: auth.currentUser.uid,
        isAdmin,
        queryConditions: q
      });

      try {
        const querySnapshot = await Promise.race([
          getDocs(q),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Eğitmen verisi çekme zaman aşımına uğradı')), 10000)
          )
        ]) as QuerySnapshot<DocumentData>;

        console.log('Query sonuçları:', {
          empty: querySnapshot.empty,
          size: querySnapshot.size,
          docs: querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: {
              displayName: doc.data().displayName,
              email: doc.data().email,
              schoolId: doc.data().schoolId,
              status: doc.data().status
            }
          }))
        });

        const instructorsData = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              label: data.displayName || data.email || 'İsimsiz Eğitmen',
              value: doc.id
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
    if (!isAdmin) return;

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
        fetchInstructors();
        setFormData(prev => ({
          ...prev,
          schoolId: currentUser.uid,
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {instructors.map((instructor) => {
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
                      <div className={`w-4 h-4 rounded mr-2 flex items-center justify-center border ${isSelected
                        ? (colorVariant === 'school' ? 'bg-school border-school' : 'bg-instructor border-instructor')
                        : 'border-gray-300 dark:border-slate-500'
                        }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {instructor.label}
                    </button>
                  );
                })}
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
          // isAdmin kontrolünü kaldıralım, schoolId varsa da çağıralım
          if (schoolId || isAdmin) {
            console.log('Eğitmenler yüklenecek çünkü:', { schoolId, isAdmin });
            await fetchInstructors();
          } else {
            console.log('Eğitmenler yüklenmeyecek çünkü:', { schoolId, isAdmin });
          }
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
      time: course.time || '18:00'
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
      tags: []
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
      updatedAt: courseData.updatedAt
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
      if (formData.schoolId) {
        const schoolRef = doc(db, 'users', formData.schoolId);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const schoolData = schoolSnap.data();
          if (schoolData.location) {
            finalLocation = schoolData.location;
          }
        }
      }

      const cleanedData = cleanDataForFirebase(formData);
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
      <div className="flex justify-end mb-2">
        <div className={`flex p-1 rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50`}>
          {([
            { value: 'all', label: 'Tümü' },
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Pasif' },
            { value: 'draft', label: 'Taslak' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${statusFilter === value
                ? `${isAdmin ? 'bg-indigo-600' : colorVariant === 'school' ? 'bg-school' : 'bg-instructor'} text-white shadow-sm`
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent'
                }`}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === value
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
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
          ? 'bg-school-bg/50 dark:bg-[#1a120b] border-school/30 dark:border-school/20'
          : 'bg-instructor-bg/50 dark:bg-[#0f172a] border-instructor/30 dark:border-instructor/20'
        }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isAdmin
              ? 'bg-gray-50 dark:bg-slate-900'
              : colorVariant === 'school'
                ? 'bg-school-bg/80 dark:bg-school/10'
                : 'bg-instructor-bg/80 dark:bg-instructor/10'
            }>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kurs</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kapasite</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200">
              {courses.filter(course =>
                (statusFilter === 'all' || course.status === statusFilter) &&
                (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.danceStyle.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map((course) => (
                <tr key={course.id} className={`transition-colors ${isAdmin
                  ? 'hover:bg-gray-50 dark:hover:bg-slate-800'
                  : colorVariant === 'school'
                    ? 'hover:bg-school/5 dark:hover:bg-school/10'
                    : 'hover:bg-instructor/5 dark:hover:bg-instructor/10'
                  }`}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{course.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{course.danceStyle}</div>
                      </div>
                    </div>
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
                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.currentParticipants}/{course.maxParticipants}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
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
                        onClick={() => editCourse(course)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm active:scale-95 ${isAdmin
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }`}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => {
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
    </div>
  );
}

export default CourseManagement; 