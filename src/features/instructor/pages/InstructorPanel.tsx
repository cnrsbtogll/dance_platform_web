import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { motion } from 'framer-motion';
import { ThemeProvider } from '@mui/material/styles';
import instructorTheme from '../../../styles/instructorTheme';
import InstructorProfileForm from '../components/InstructorProfileForm';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import { query, where, orderBy, collection, getDocs } from 'firebase/firestore';
import { StudentManagement } from '../../../features/shared/components/students/StudentManagement';
import { db } from '../../../api/firebase/firebase';
import ScheduleManagement from '../../../features/shared/components/schedule/ScheduleManagement';
import AttendanceManagement from '../../../features/shared/components/attendance/AttendanceManagement';
import ProgressTracking from '../../../features/shared/components/progress/ProgressTracking';
import BadgeSystem from '../../../features/shared/components/badges/BadgeSystem';
import CustomSelect from '../../../common/components/ui/CustomSelect';

interface InstructorPanelProps {
  user: any; // TODO: Add proper type
}

interface Course {
  id: string;
  name: string;
  schedule: {
    day: string;
    time: string;
  }[];
}

function InstructorPanel({ user }: InstructorPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'students' | 'schedule' | 'attendance' | 'progress' | 'badges'>('profile');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Kullanıcı bilgilerini logla
  console.log('InstructorPanel - user:', user);

  // Kursları getir
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;

      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('instructorId', '==', user.id));
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
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'schedule') {
      fetchCourses();
    }
  }, [activeTab, user?.id]);

  if (!user) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <ThemeProvider theme={instructorTheme}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 inline-block relative bg-gradient-to-r from-instructor to-instructor-light bg-clip-text text-transparent">
            Eğitmen Yönetim Paneli
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kurslarınızı, öğrencilerinizi ve ders programınızı profesyonelce yönetin ve dans eğitimi deneyiminizi en üst düzeye çıkarın.
          </p>
        </motion.div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Navigation - Mobile */}
          <div className="md:hidden border-b overflow-x-auto">
            <div className="flex whitespace-nowrap">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'profile'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'courses'
                  ? 'border-instructor text-instructor'
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
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Öğrenciler
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${activeTab === 'schedule'
                  ? 'border-instructor text-instructor'
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
                  ? 'border-instructor text-instructor'
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
                  ? 'border-instructor text-instructor'
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
                  ? 'border-instructor text-instructor'
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
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Profilim
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'courses'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Kurslarım
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'students'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Öğrencilerim
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'schedule'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Ders Programım
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'attendance'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Yoklama
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'progress'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                İlerleme Takibi
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${activeTab === 'badges'
                  ? 'border-instructor text-instructor'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Rozetler
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'profile' && (
              <InstructorProfileForm user={user} />
            )}

            {activeTab === 'courses' && (
              <CourseManagement instructorId={user.id} />
            )}

            {activeTab === 'students' && (
              <StudentManagement isAdmin={false} />
            )}

            {activeTab === 'schedule' && (
              <ScheduleManagement
                courses={courses}
                onAddCourse={() => setActiveTab('courses')}
                isAdmin={false}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceManagement
                instructorId={user.id}
                isAdmin={false}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTracking
                instructorId={user.id}
                isAdmin={false}
              />
            )}

            {activeTab === 'badges' && (
              <BadgeSystem
                instructorId={user.id}
                isAdmin={false}
              />
            )}
          </div>
        </div>

        <div className="mt-8 bg-instructor-bg rounded-lg p-4 border border-instructor-lighter">
          <h2 className="font-semibold text-instructor-dark">Eğitmen İpuçları</h2>
          <ul className="mt-2 space-y-2 text-sm text-instructor">
            <li className="flex items-start">
              <span className="mr-2 text-instructor-light">•</span>
              <span>Düzenli olarak kurs içeriğinizi güncelleyerek öğrencilerinizin ilgisini canlı tutun.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-instructor-light">•</span>
              <span>Öğrencilerinizin ilerleme durumlarını takip ederek kişisel leştirilmiş geri bildirimler verin.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-instructor-light">•</span>
              <span>Ders programınızı önceden planlayarak öğrencilerinize duyurun.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-instructor-light">•</span>
              <span>Dans videolarınızı paylaşarak öğrencilerinizin ders dışında da çalışmalarını sağlayın.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-instructor-light">•</span>
              <span>Öğrencilerinizle düzenli iletişim kurarak motivasyonlarını yüksek tutun.</span>
            </li>
          </ul>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default InstructorPanel; 