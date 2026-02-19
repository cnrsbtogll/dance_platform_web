import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider } from '@mui/material/styles';
import schoolTheme from '../../../styles/schoolTheme';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { StudentManagement } from '../../../features/shared/components/students/StudentManagement';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import AttendanceManagement from '../../../features/shared/components/attendance/AttendanceManagement';
import ProgressTracking from '../../../features/shared/components/progress/ProgressTracking';
import BadgeSystem from '../../../features/shared/components/badges/BadgeSystem';
import ScheduleManagement from '../../../features/shared/components/schedule/ScheduleManagement';
import InstructorManagement from '../components/InstructorManagement/InstructorManagement';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import { User } from '../../../types';
import { SchoolProfile } from '../components/SchoolProfile/SchoolProfile';

interface Course {
  id: string;
  name: string;
  schedule: {
    day: string;
    time: string;
  }[];
}

interface SchoolInfo {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  description?: string;
  iban?: string;
  recipientName?: string;
  [key: string]: any;
}

const SchoolAdmin: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'profile' |
    'courses' |
    'students' |
    'instructors' |
    'schedule' |
    'attendance' |
    'progress' |
    'badges'
  >('profile');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  // Debug logs for school info
  useEffect(() => {
    if (schoolInfo && activeTab === 'students') {
      console.log('SchoolAdmin - Using school info:', {
        schoolInfoId: schoolInfo.id,
        currentUserId: currentUser?.uid,
        schoolInfo: schoolInfo
      });
    }
  }, [schoolInfo, activeTab, currentUser?.uid]);

  // Fetch school information
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);

        // Fetch user document to get school ID
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setError('Kullanıcı bilgileri bulunamadı.');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const userRole = userData.role;

        // Safely check if the user has the school role
        const isSchool = userRole
          ? (Array.isArray(userRole)
            ? userRole.includes('school')
            : userRole === 'school')
          : false;

        if (!isSchool) {
          setError('Bu sayfaya erişim yetkiniz bulunmamaktadır. Yalnızca dans okulu hesapları için erişilebilir.');
          setLoading(false);
          return;
        }

        // If this is the user's school account
        if (userData.schoolId) {
          const schoolRef = doc(db, 'schools', userData.schoolId);
          const schoolDoc = await getDoc(schoolRef);

          if (schoolDoc.exists()) {
            const schoolData = schoolDoc.data();
            setSchoolInfo({
              id: schoolDoc.id,
              displayName: schoolData.displayName || 'İsimsiz Okul',
              email: schoolData.email || '',
              ...schoolData
            });
          }
        } else {
          // If the user doc itself is for a school
          setSchoolInfo({
            id: userDoc.id,
            displayName: userData.displayName || 'İsimsiz Okul',
            email: userData.email || '',
            ...userData
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Okul bilgileri yüklenirken hata:', err);
        setError('Okul bilgileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchSchoolInfo();
  }, [currentUser]);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!schoolInfo?.id) return;

      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('schoolId', '==', schoolInfo.id));
        const querySnapshot = await getDocs(q);

        const coursesData: Course[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          coursesData.push({
            id: doc.id,
            name: data.name,
            schedule: data.schedule || []
          });
        });

        setCourses(coursesData);
      } catch (err) {
        console.error('Kurslar yüklenirken hata:', err);
        setError('Kurslar yüklenirken bir hata oluştu.');
      }
    };

    if (activeTab === 'schedule') {
      fetchCourses();
    }
  }, [activeTab, schoolInfo?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-school"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Hata</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={schoolTheme}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 inline-block relative bg-gradient-to-r from-school to-school-light bg-clip-text text-transparent">
            Dans Okulu Yönetim Paneli
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kurslarınızı, öğrencilerinizi, eğitmenlerinizi ve ders programınızı profesyonelce yönetin.
          </p>
        </motion.div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Navigation - Mobile */}
          <div className="md:hidden border-b overflow-x-auto">
            <div className="flex whitespace-nowrap">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'profile'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Okul Profili
              </button>
              <button
                onClick={() => setActiveTab('instructors')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'instructors'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Eğitmenler
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'courses'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Kurslar
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'students'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Öğrenciler
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'schedule'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Program
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'attendance'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Yoklama
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'progress'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                İlerleme
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'badges'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Rozetler
              </button>
            </div>
          </div>

          {/* Tab Navigation - Desktop */}
          <div className="hidden md:block border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'profile'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Okul Profili
              </button>
              <button
                onClick={() => setActiveTab('instructors')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'instructors'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Eğitmenler
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'courses'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Kurslar
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'students'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Öğrenciler
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'schedule'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Program
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'attendance'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Yoklama
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'progress'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                İlerleme Takibi
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'badges'
                  ? 'border-school text-school'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Rozetler
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'profile' && schoolInfo && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Okul Profili</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Dans okulunuzun temel bilgilerini görüntüleyin ve düzenleyin
                    </p>
                  </div>
                </div>

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                  <SchoolProfile
                    school={schoolInfo}
                    variant="card"
                    onUpdate={async (updatedSchool) => {
                      try {
                        const schoolRef = doc(db, 'schools', schoolInfo.id);
                        await updateDoc(schoolRef, {
                          ...updatedSchool,
                          updatedAt: serverTimestamp()
                        });

                        // Refresh school info
                        const updatedDoc = await getDoc(schoolRef);
                        if (updatedDoc.exists()) {
                          const updatedData = updatedDoc.data();
                          setSchoolInfo({
                            id: updatedDoc.id,
                            displayName: updatedData.displayName || 'İsimsiz Okul',
                            email: updatedData.email || '',
                            ...updatedData
                          });
                        }
                      } catch (error) {
                        console.error('Error updating school:', error);
                        throw error;
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'instructors' && schoolInfo && (
              <InstructorManagement schoolInfo={schoolInfo} />
            )}

            {activeTab === 'courses' && schoolInfo && (
              <CourseManagement
                schoolId={schoolInfo.id}
                isAdmin={false}
                colorVariant="school"
              />
            )}

            {activeTab === 'students' && schoolInfo && (
              <div>
                <StudentManagement
                  isAdmin={false}
                  colorVariant="school"
                />
              </div>
            )}

            {activeTab === 'attendance' && schoolInfo && (
              <AttendanceManagement
                schoolInfo={schoolInfo}
                isAdmin={true}
              />
            )}

            {activeTab === 'progress' && schoolInfo && (
              <ProgressTracking
                schoolInfo={schoolInfo}
                isAdmin={true}
              />
            )}

            {activeTab === 'badges' && schoolInfo && (
              <BadgeSystem
                schoolInfo={schoolInfo}
                isAdmin={true}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleManagement
                courses={courses}
                onAddCourse={() => setActiveTab('courses')}
                isAdmin={true}
              />
            )}
          </div>
        </div>

        <div className="mt-8 bg-school-bg rounded-lg p-4 border border-school-lighter">
          <h2 className="font-semibold text-school-dark">Dans Okulu İpuçları</h2>
          <ul className="mt-2 space-y-2 text-sm text-school">
            <li className="flex items-start">
              <span className="mr-2 text-school-light">•</span>
              <span>Eğitmenlerinizin ve öğrencilerinizin profillerini düzenli olarak güncelleyin.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-school-light">•</span>
              <span>Kurs programını öğrenci ve eğitmen uygunluğuna göre optimize edin.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-school-light">•</span>
              <span>Öğrenci ve eğitmen geri bildirimlerini düzenli olarak takip edin.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-school-light">•</span>
              <span>Dans etkinliklerini ve özel dersleri önceden planlayın.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-school-light">•</span>
              <span>Okulunuzun sosyal medya ve tanıtım faaliyetlerini güncel tutun.</span>
            </li>
          </ul>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default SchoolAdmin; 