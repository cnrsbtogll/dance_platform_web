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

// Durum options
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' },
  { label: 'Taslak', value: 'draft' }
];

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
  instructorId: string;
  instructorName: string;
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
  instructorPhone: string;
  schoolPhone: string;
  schoolAddress: string;
  createdAt?: any;
  updatedAt?: any;
}

interface FormData {
  name: string;
  description: string;
  instructorId: string;
  instructorName: string;
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

        {/* Eğitmen Bilgileri */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Eğitmen</h4>
          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">İsim:</span> {course.instructorName}
            </p>
            {course.instructorPhone && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Telefon:</span>{' '}
                <a href={`tel:${course.instructorPhone}`} className="text-blue-600 hover:underline">
                  {course.instructorPhone}
                </a>
              </p>
            )}
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
    instructorId: '',
    instructorName: 'Bilinmeyen Eğitmen',
    schoolId: '',
    schoolName: 'Bilinmeyen Okul',
    danceStyle: '',
    level: 'beginner',
    maxParticipants: 10,
    currentParticipants: 0,
    duration: 90,
    date: null,
    time: '18:00',
    price: 0,
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Array<{ label: string; value: string }>>([]);
  const [schools, setSchools] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingInstructors, setLoadingInstructors] = useState<boolean>(true);
  const [loadingSchools, setLoadingSchools] = useState<boolean>(true);
  const [selectedContactCourse, setSelectedContactCourse] = useState<Course | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');

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
        // Eğitmen: Sadece okul seçebilir, eğitmen kendisidir
        fetchSchools();
        setFormData(prev => ({
          ...prev,
          instructorId: currentUser.uid,
          instructorName: userData?.displayName || 'Bilinmeyen Eğitmen'
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

  // Form render edilirken kullanıcı rolüne göre alanları göster/gizle
  const renderFormFields = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    return (
      <div className="space-y-4 md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 border-violet-600 pl-3">
          Temel Bilgiler
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <CustomInput
              type="text"
              name="name"
              label="Kurs Adı"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <CustomSelect
              name="danceStyle"
              label="Dans Stili"
              options={danceStyles}
              value={formData.danceStyle}
              onChange={(value) => setFormData({ ...formData, danceStyle: value as string })}
              placeholder="Dans Stili Seçin"
              required
            />
          </div>
        </div>

        {/* Eğitmen Seçimi - Sadece süper admin ve okul kullanıcıları için */}
        {(isAdmin || userRole === 'school') && (
          <div className="mt-4">
            <CustomSelect
              name="instructorId"
              label="Eğitmen"
              options={instructors}
              value={formData.instructorId}
              onChange={(value) => {
                const selectedInstructor = instructors.find(i => i.value === value);
                setFormData({
                  ...formData,
                  instructorId: value as string,
                  instructorName: selectedInstructor?.label || ''
                });
              }}
              placeholder="Eğitmen Seçin"
              required
            />
          </div>
        )}

        {/* Okul Seçimi - Sadece süper admin ve eğitmen kullanıcıları için */}
        {(isAdmin || userRole === 'instructor') && (
          <div className="mt-4">
            <CustomSelect
              name="schoolId"
              label="Okul"
              options={schools}
              value={formData.schoolId}
              onChange={(value) => {
                const selectedSchool = schools.find(s => s.value === value);
                setFormData({
                  ...formData,
                  schoolId: value as string,
                  schoolName: selectedSchool?.label || ''
                });
              }}
              placeholder="Okul Seçin"
              required
            />
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
      schedule: course.schedule || [],
      date: course.date,
      time: course.time || '18:00'
    });
    setEditMode(true);
  };

  // Yeni kurs ekleme
  const addNewCourse = () => {
    setSelectedCourse(null);
    setFormData({
      name: '',
      description: '',
      instructorId: instructorId || '',
      instructorName: instructorId ? auth.currentUser?.displayName || 'Bilinmeyen Eğitmen' : '',
      schoolId: schoolId || '',
      schoolName: 'Bilinmeyen Okul',
      danceStyle: '',
      level: 'beginner',
      maxParticipants: 10,
      currentParticipants: 0,
      duration: 90,
      date: null,
      time: '18:00',
      price: 0,
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

    // Undefined değerleri kaldır
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    // Eğer recurring true değilse date alanını kaldır
    if (!cleanData.recurring) {
      delete cleanData.date;
    }

    // Timestamp alanlarını koru
    const { createdAt, updatedAt, ...restData } = cleanData;

    return restData;
  };

  // Veri işleme fonksiyonunu güncelle
  const processQueryData = (doc: QueryDocumentSnapshot<DocumentData>): Course => {
    const courseData = doc.data();
    return {
      id: doc.id,
      name: courseData.name || '',
      description: courseData.description || '',
      instructorId: courseData.instructorId || '',
      instructorName: courseData.instructorName || 'Bilinmeyen Eğitmen',
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const courseDataToSave = {
        ...formData,
        recurring: formData.recurring,
        schedule: formData.recurring ? formData.schedule : [],
        date: formData.recurring ? null : formData.date,
        time: formData.time,
        instructorPhone: '',
        schoolPhone: '',
        schoolAddress: '',
        updatedAt: serverTimestamp()
      };

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
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden text-sm h-9">
            {([
              { value: 'all', label: 'Tümü' },
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Pasif' },
              { value: 'draft', label: 'Taslak' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${statusFilter === value
                  ? value === 'active'
                    ? 'bg-green-600 text-white'
                    : value === 'inactive'
                      ? 'bg-gray-500 text-white'
                      : value === 'draft'
                        ? 'bg-amber-500 text-white'
                        : 'bg-violet-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
              >
                {label}
                <span className="ml-1.5 text-xs opacity-75">
                  ({courses.filter(c => value === 'all' ? true : c.status === value).length})
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-grow sm:max-w-[200px]">
            <input
              type="text"
              placeholder="Kurs ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${colorVariant === 'school' ? 'focus:ring-school dark:focus:ring-school-light' : 'focus:ring-instructor dark:focus:ring-instructor-light'} focus:border-transparent`}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          <Button
            onClick={addNewCourse}
            type="button"
            variant={isAdmin ? 'violet' : colorVariant}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Kurs Ekle
            </div>
          </Button>
        </div>
      </div>

      {/* Form Bölümü */}
      {(editMode || selectedCourse) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {renderFormFields()}

              {/* Program ve Kapasite */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 border-violet-600 pl-3">
                  Program ve Kapasite
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <CustomSelect
                      name="level"
                      label="Seviye"
                      options={levelOptions}
                      value={formData.level}
                      onChange={(value) => setFormData({ ...formData, level: value as string })}
                      placeholder="Seviye Seçin"
                      required
                    />
                  </div>
                  <div>
                    <CustomInput
                      type="text"
                      name="maxParticipants"
                      label="Maksimum Katılımcı"
                      value={formData.maxParticipants.toString()}
                      onChange={(e) => setFormData({
                        ...formData,
                        maxParticipants: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Fiyat ve Süre */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 border-violet-600 pl-3">
                  Fiyat ve Süre
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fiyat</label>
                      <div className="flex items-stretch">
                        <input
                          type="text"
                          name="price"
                          value={formData.price.toString()}
                          onChange={(e) => setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0
                          })}
                          className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 sm:text-sm border-r-0 outline-none transition-all`}
                          required
                        />
                        <div className="flex items-center px-3 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-md bg-gray-50 dark:bg-slate-900 h-[38px] mt-[1px]">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">₺</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <CustomInput
                      type="text"
                      name="duration"
                      label="Süre (dakika)"
                      value={formData.duration.toString()}
                      onChange={(e) => setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 0
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Durum ve Tekrar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 border-violet-600 pl-3">
                  Durum
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <CustomSelect
                      name="status"
                      label="Durum"
                      options={statusOptions}
                      value={formData.status}
                      onChange={(value) => setFormData({
                        ...formData,
                        status: value as 'active' | 'inactive' | 'draft'
                      })}
                      placeholder="Durum Seçin"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Lokasyon */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 border-violet-600 pl-3">
                  Lokasyon
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <CustomSelect
                      name="city"
                      label="Şehir"
                      options={cityOptions}
                      value={formData.location.city}
                      onChange={(value) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: value as string }
                      })}
                      placeholder="Şehir Seçin"
                      required
                    />
                  </div>
                  <div>
                    <CustomInput
                      type="text"
                      name="address"
                      label="Adres"
                      value={formData.location.address}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, address: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Açıklama */}
              <div className="md:col-span-2">
                <CustomInput
                  type="text"
                  name="description"
                  label="Açıklama"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </div>

              {/* Program Seçimi */}
              <div className="md:col-span-2 space-y-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-l-4 border-violet-600 pl-3">
                  Program Detayları
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurs Tipi</label>
                    <div className="mt-2">
                      <label className="inline-flex items-center mr-4">
                        <input
                          type="radio"
                          name="recurring"
                          checked={formData.recurring}
                          onChange={(e) => setFormData({ ...formData, recurring: true })}
                          className={`form-radio h-4 w-4 ${colorVariant === 'school' ? 'text-school dark:text-school-light' : 'text-instructor dark:text-instructor-light'}`}
                        />
                        <span className="ml-2">Periyodik Kurs</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recurring"
                          checked={!formData.recurring}
                          onChange={(e) => setFormData({ ...formData, recurring: false })}
                          className={`form-radio h-4 w-4 ${colorVariant === 'school' ? 'text-school dark:text-school-light' : 'text-instructor dark:text-instructor-light'}`}
                        />
                        <span className="ml-2">Tek Seferlik Kurs</span>
                      </label>
                    </div>
                  </div>

                  {formData.recurring ? (
                    <div className="space-y-4">
                      {formData.schedule.map((scheduleItem, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <CustomSelect
                              name={`schedule-day-${index}`}
                              label="Gün"
                              options={dayOptions}
                              value={scheduleItem.day}
                              onChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[index].day = value as string;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              placeholder="Gün Seçin"
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saat</label>
                            <input
                              type="time"
                              value={scheduleItem.time}
                              onChange={(e) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[index].time = e.target.value;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm ${colorVariant === 'school' ? 'focus:border-school focus:ring-school dark:focus:ring-school-light' : 'focus:border-instructor focus:ring-instructor dark:focus:ring-instructor-light'} sm:text-sm`}
                              required
                            />
                          </div>
                          <div className="flex items-end pb-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newSchedule = formData.schedule.filter((_, i) => i !== index);
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            schedule: [...formData.schedule, { day: 'Pazartesi', time: '18:00' }]
                          });
                        }}
                        className={`flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg ${colorVariant === 'school' ? 'hover:border-school hover:text-school dark:hover:border-school-light dark:hover:text-school-light' : 'hover:border-instructor hover:text-instructor dark:hover:border-instructor-light dark:hover:text-instructor-light'} w-full`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Program Ekle
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurs Tarihi</label>
                        <input
                          type="date"
                          name="date"
                          value={timestampToDate(formData.date)}
                          onChange={(e) => {
                            const selectedDate = e.target.value ? new Date(e.target.value) : null;
                            setFormData({ ...formData, date: selectedDate });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-brand-pink focus:ring-brand-pink sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurs Saati</label>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-brand-pink focus:ring-brand-pink sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Butonları */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditMode(false);
                  setSelectedCourse(null);
                }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant={isAdmin ? 'violet' : colorVariant}
              >
                {selectedCourse ? 'Güncelle' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Kurs Listesi */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-slate-900">
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
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
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
                            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40'
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