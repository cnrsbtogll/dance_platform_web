import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import createSchoolTheme from '../../../styles/schoolTheme';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// Icons
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PaymentsIcon from '@mui/icons-material/Payments';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

// Components
import { StudentManagement } from '../../../features/shared/components/students/StudentManagement';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import AttendanceManagement from '../../../features/shared/components/attendance/AttendanceManagement';
import ProgressTracking from '../../../features/shared/components/progress/ProgressTracking';
import BadgeSystem from '../../../features/shared/components/badges/BadgeSystem';
import ScheduleManagement from '../../../features/shared/components/schedule/ScheduleManagement';
import InstructorManagement from '../components/InstructorManagement/InstructorManagement';
import { SchoolProfile } from '../components/SchoolProfile/SchoolProfile';
import EarningsManagement from '../../../features/shared/components/earnings/EarningsManagement';
import DeleteAccountModal from '../../../features/shared/components/profile/DeleteAccountModal';


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

type TabType = 'dashboard' | 'profile' | 'instructors' | 'courses' | 'students' | 'schedule' | 'attendance' | 'progress' | 'badges' | 'earnings';


const SchoolAdmin: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const schoolTheme = createSchoolTheme(isDark ? 'dark' : 'light');

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('school_sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('school_sidebar_collapsed', String(next)); } catch { }
      return next;
    });
  };

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [earningsSummary, setEarningsSummary] = useState<{ totalGross: number, monthlyGross: number, pendingAmount: number } | null>(null);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [instructorCount, setInstructorCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);




  useEffect(() => {
    if (schoolInfo && activeTab === 'students') {
      console.log('SchoolAdmin - Using school info:', {
        schoolInfoId: schoolInfo.id,
        currentUserId: currentUser?.uid,
        schoolInfo: schoolInfo
      });
    }
  }, [schoolInfo, activeTab, currentUser?.uid]);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setError('Kullanıcı bilgileri bulunamadı.');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const userRole = userData.role;

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

    if (activeTab === 'schedule' || activeTab === 'dashboard') {
      fetchCourses();
    }
  }, [activeTab, schoolInfo?.id]);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!schoolInfo?.id) return;
      try {
        const { summary } = await import('../../../api/services/earningsService').then(m => m.getSchoolEarnings(schoolInfo.id));
        setEarningsSummary(summary);
      } catch (err) {
        console.error('Error fetching earnings summary:', err);
      }
    };

    if (activeTab === 'dashboard') {
      fetchEarnings();
    }
  }, [activeTab, schoolInfo?.id]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!schoolInfo?.id) return;
      try {
        const usersRef = collection(db, 'users');

        // Note: Firestore doesn't support mixing array-contains and string equality in a simple way for the same field.
        // We will fetch based on schoolId and filter in memory if necessary, or use multiple queries.
        // For efficiency, since schoolId is already a strong filter, we'll fetch then filter or use logic that supports existing data.

        // Revised approach: Fetch all school users once to avoid multiple narrow queries
        // Fetch all potential users (Students and Instructors)
        // We use two queries to be sure we get both legacy and new array-based school associations
        const q1 = query(usersRef, where('schoolId', '==', schoolInfo.id));
        const q2 = query(usersRef, where('schoolIds', 'array-contains', schoolInfo.id));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        // Merge unique docs
        const uniqueDocs = new Map();
        snap1.forEach(doc => uniqueDocs.set(doc.id, doc.data()));
        snap2.forEach(doc => uniqueDocs.set(doc.id, doc.data()));

        let sCount = 0;
        let iCount = 0;
        const schoolUsersData: any[] = [];

        console.log('[DEBUG-DASHBOARD] Fetched unique docs:', uniqueDocs.size);

        uniqueDocs.forEach((data, id) => {
          const roles = Array.isArray(data.role) ? data.role : [data.role];
          const isStudent = roles.includes('student');
          const isInstructor = roles.includes('instructor') || roles.includes('draft-instructor');

          if (isStudent) sCount++;
          if (isInstructor) {
            iCount++;
            console.log(`[DEBUG-DASHBOARD] Counted as Instructor:`, data.displayName, data.email, roles);
          }

          schoolUsersData.push({ id, ...data, roles });
        });

        console.log('[DEBUG-DASHBOARD] Final Totals -> Students:', sCount, 'Instructors:', iCount);

        setStudentCount(sCount);
        setInstructorCount(iCount);

        // Fetch Recent Activities
        const activities: any[] = [];

        // Latest 3 Students (from the fetched data)
        const latestStudents = schoolUsersData
          .filter(u => u.roles.includes('student'))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 3);

        latestStudents.forEach(data => {
          activities.push({
            id: data.id,
            type: 'student',
            icon: <GroupsRoundedIcon />,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/30",
            title: "Yeni Öğrenci Kaydı",
            desc: `Öğrenci: ${data.displayName}`,
            date: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
          });
        });

        // Latest 3 Transactions
        try {
          const earningsData = await import('../../../api/services/earningsService').then(m => m.getEarningsData(schoolInfo.id, 'school'));
          earningsData.transactions.slice(0, 3).forEach(tx => {
            activities.push({
              id: tx.id,
              type: 'payment',
              icon: <PaymentsIcon />,
              color: "text-green-600",
              bg: "bg-green-100 dark:bg-green-900/30",
              title: tx.status === 'confirmed' ? "Ödeme Onaylandı" : "Yeni İşlem",
              desc: `${tx.studentName} - ${tx.itemName}`,
              date: new Date(tx.date),
            });
          });
        } catch (e) {
          console.error('Activities fetch error (earnings):', e);
        }

        // Sort and Set
        const sortedActivities = activities
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5)
          .map(act => {
            const diff = Math.floor((new Date().getTime() - act.date.getTime()) / 60000);
            let timeStr = 'Yeni';
            if (diff > 0) {
              if (diff < 60) timeStr = `${diff} dk önce`;
              else if (diff < 1440) timeStr = `${Math.floor(diff / 60)} saat önce`;
              else timeStr = `${Math.floor(diff / 1440)} gün önce`;
            }
            return { ...act, time: timeStr };
          });

        setRecentActivities(sortedActivities);
      } catch (err) {
        console.error('Error fetching dashboard counts:', err);
      }
    };

    if (activeTab === 'dashboard') {
      fetchCounts();
    }
  }, [activeTab, schoolInfo?.id]);




  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: <DashboardRoundedIcon fontSize="small" /> },
    { id: 'profile', label: 'Okul Profili', icon: <StorefrontRoundedIcon fontSize="small" /> },
    { id: 'earnings', label: 'Kazançlar', icon: <PaymentsIcon fontSize="small" /> },
    { id: 'courses', label: 'Kurslar', icon: <MenuBookRoundedIcon fontSize="small" /> },
    { id: 'students', label: 'Öğrenciler', icon: <GroupsRoundedIcon fontSize="small" /> },
    { id: 'instructors', label: 'Eğitmenler', icon: <PersonRoundedIcon fontSize="small" /> },
    { id: 'schedule', label: 'Program', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
    { id: 'attendance', label: 'Yoklama', icon: <FactCheckRoundedIcon fontSize="small" /> },
    { id: 'progress', label: 'İlerleme', icon: <TrendingUpRoundedIcon fontSize="small" /> },
    { id: 'badges', label: 'Rozetler', icon: <EmojiEventsRoundedIcon fontSize="small" /> },
  ];



  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-school mb-4"></div>
        <span className="text-gray-700 dark:text-gray-300">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mx-auto mb-4">
            <CloseRoundedIcon sx={{ fontSize: 64 }} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Hata</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="bg-white dark:bg-[#231810] rounded-xl p-5 border border-slate-200 dark:border-[#493322] shadow-sm flex flex-col justify-between h-full group hover:border-school/30 transition-all cursor-pointer"
          onClick={() => setActiveTab('students')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <GroupsRoundedIcon />
            </div>
            <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
              +5.2% <TrendingUpIcon fontSize="small" className="ml-1" />
            </span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-[#cba990] text-sm font-medium mb-1">Toplam Öğrenci</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{studentCount.toLocaleString('tr-TR')}</h3>
          </div>
        </div>

        <div
          className="bg-white dark:bg-[#231810] rounded-xl p-5 border border-slate-200 dark:border-[#493322] shadow-sm flex flex-col justify-between h-full group hover:border-school/30 transition-all cursor-pointer"
          onClick={() => setActiveTab('instructors')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
              <PersonRoundedIcon />
            </div>
            <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
              +2.1% <TrendingUpIcon fontSize="small" className="ml-1" />
            </span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-[#cba990] text-sm font-medium mb-1">Toplam Eğitmen</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{instructorCount.toLocaleString('tr-TR')}</h3>
          </div>
        </div>

        <div
          className="bg-white dark:bg-[#231810] rounded-xl p-5 border border-slate-200 dark:border-[#493322] shadow-sm flex flex-col justify-between h-full group hover:border-school/30 transition-all cursor-pointer"
          onClick={() => setActiveTab('courses')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <MenuBookRoundedIcon />
            </div>
            <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-full">
              {courses.length > 0 ? 'Aktif' : 'Yok'}
            </span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-[#cba990] text-sm font-medium mb-1">Aktif Kurslar</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{courses.length || 0}</h3>
          </div>
        </div>

        <div
          className="bg-white dark:bg-[#231810] rounded-xl p-5 border border-slate-200 dark:border-[#493322] shadow-sm flex flex-col justify-between h-full group hover:border-school/30 transition-all cursor-pointer"
          onClick={() => setActiveTab('earnings')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <PaymentsIcon />
            </div>
            <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
              +12% <TrendingUpIcon fontSize="small" className="ml-1" />
            </span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-[#cba990] text-sm font-medium mb-1">Aylık Gelir</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              ₺{earningsSummary ? earningsSummary.monthlyGross.toLocaleString('tr-TR') : '...'}
            </h3>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#231810] p-6 rounded-xl border border-slate-200 dark:border-[#493322] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Kayıt Trendleri</h3>
                <p className="text-sm text-slate-500 dark:text-[#cba990]">Aylık yeni öğrenci sayısı</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-[#493322] text-slate-600 dark:text-white rounded-md hover:bg-slate-200 dark:hover:bg-[#493322]/80 transition">Haftalık</button>
                <button className="px-3 py-1 text-xs font-medium bg-school text-white rounded-md shadow-sm">Aylık</button>
              </div>
            </div>
            <div className="relative h-64 w-full">
              <div className="absolute inset-0 flex items-end justify-between px-2 pb-6 gap-2">
                {[40, 55, 35, 65, 50, 85].map((val, i) => (
                  <div key={i} className={`w-full ${i === 5 ? 'bg-school' : 'bg-school/40'} rounded-t-sm group relative transition-all`} style={{ height: `${val}%` }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{val}</div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 text-xs text-slate-400 font-medium">
                <span>Oca</span><span>Şub</span><span>Mar</span><span>Nis</span><span>May</span><span>Haz</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#231810] rounded-xl border border-slate-200 dark:border-[#493322] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#493322]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Son Etkinlikler</h3>
              <button
                onClick={() => setActiveTab('students')}
                className="text-sm font-medium text-school hover:text-school/80"
              >
                Tümünü Gör
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#493322]">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-[#493322]/30 transition-colors cursor-pointer"
                    onClick={() => act.type === 'student' ? setActiveTab('students') : setActiveTab('earnings')}
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${act.bg} ${act.color}`}>
                      {act.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{act.title}</p>
                      <p className="text-xs text-slate-500 dark:text-[#cba990]">{act.desc}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{act.time}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Henüz bir etkinlik bulunmuyor.
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-[#231810] rounded-xl border border-slate-200 dark:border-[#493322] shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Bildirimler & İpuçları</h3>
            <div className="space-y-4">
              <div
                className="flex gap-3 group cursor-pointer"
                onClick={() => setActiveTab('profile')}
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-school/10 text-school shrink-0 border border-school/20">
                  <StorefrontRoundedIcon />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-school transition-colors">Okul Profili</p>
                  <p className="text-xs text-slate-500 dark:text-[#cba990]">Profil ve IBAN bilgilerinizi güncel tutun.</p>
                </div>
              </div>
              <div
                className="flex gap-3 group cursor-pointer"
                onClick={() => setActiveTab('students')}
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#493322] text-slate-600 dark:text-white shrink-0 group-hover:bg-school-lighter transition-colors border border-transparent group-hover:border-school/20">
                  <GroupsRoundedIcon />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white transition-colors group-hover:text-school">Yıl Sonu Gösterisi</p>
                  <p className="text-xs text-slate-500 dark:text-[#cba990]">Hazırlıklar devam ediyor, öğrencileri kontrol edin.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-school to-school-dark rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <EmojiEventsRoundedIcon sx={{ fontSize: 120 }} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Okul Duyurusu</h3>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">Yeni sezon kayıtlarımız açıldı, tüm sınıfları ve eğitmen saatlerini panele yüklemeyi unutmayın.</p>
              <button
                onClick={() => setActiveTab('courses')}
                className="px-4 py-2 bg-white text-school text-sm font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                Kurslara Git
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ThemeProvider theme={schoolTheme}>
        <div className="flex min-h-screen w-full bg-school-bg dark:bg-[#1a120b] overflow-hidden font-sans text-slate-900 dark:text-slate-100 antialiased">

          {/* Desktop Sidebar */}
          <aside
            className={`hidden lg:flex flex-col h-screen z-20 bg-white dark:bg-[#231810] border-r border-slate-200 dark:border-[#493322] sticky top-0 transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-72'
              }`}
          >
            {/* Header */}
            <div className={`flex items-center border-b border-slate-100 dark:border-[#493322] shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-3 py-6 justify-center' : 'px-6 py-6 gap-3'
              }`}>
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                style={{ backgroundImage: `url(${schoolInfo?.photoURL || 'https://ui-avatars.com/api/?name=S&background=b45309&color=fff'})` }}
                onClick={toggleSidebar}
                title={isSidebarCollapsed ? 'Genişlet' : schoolInfo?.displayName}
              />
              {!isSidebarCollapsed && (
                <div className="flex flex-col flex-1 min-w-0">
                  <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight line-clamp-1">{schoolInfo?.displayName || 'Yükleniyor...'}</h1>
                  <p className="text-slate-500 dark:text-[#cba990] text-xs font-normal">Okul Yönetim Paneli</p>
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className={`shrink-0 rounded-lg p-1 text-slate-400 hover:text-school hover:bg-slate-100 dark:hover:bg-[#493322] transition-colors ${isSidebarCollapsed ? 'hidden' : ''
                  }`}
                title="Daralt"
              >
                <ChevronLeftRoundedIcon fontSize="small" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col flex-1 px-2 py-4 gap-1 overflow-y-auto overflow-x-hidden">
              {/* Collapsed toggle at top */}
              {isSidebarCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-full p-2.5 rounded-lg text-slate-400 hover:text-school hover:bg-slate-100 dark:hover:bg-[#493322]/50 transition-colors mb-2"
                  title="Genişlet"
                >
                  <ChevronRightRoundedIcon fontSize="small" />
                </button>
              )}

              {navItems.map((item) => (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`flex items-center w-full rounded-lg transition-colors text-left ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                      } ${activeTab === item.id
                        ? 'bg-school/10 text-school dark:bg-[#493322] dark:text-white font-medium'
                        : 'text-slate-600 dark:text-[#cba990] hover:bg-slate-50 dark:hover:bg-[#493322]/50 hover:text-school dark:hover:text-white'
                      }`}
                  >
                    {item.icon}
                    {!isSidebarCollapsed && <span className="text-sm leading-normal">{item.label}</span>}
                  </button>
                  {/* Tooltip when collapsed */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Logout + Delete */}
            <div className={`py-4 border-t border-slate-100 dark:border-[#493322] shrink-0 ${isSidebarCollapsed ? 'px-2' : 'px-4'
              }`}>
              {isSidebarCollapsed ? (
                <div className="space-y-1">
                  <div className="relative group">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center p-2.5 rounded-lg bg-school/10 hover:bg-school/20 text-school transition-all cursor-pointer"
                      title="Çıkış Yap"
                    >
                      <LogoutRoundedIcon fontSize="small" />
                    </button>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                      Çıkış Yap
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                    </div>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex w-full items-center justify-center p-2.5 rounded-lg hover:bg-[#493322]/40 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                      title="Hesabı Sil"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                      Hesabı Sil
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-school hover:bg-school-light text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <LogoutRoundedIcon fontSize="small" />
                    <span>Çıkış Yap</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg h-9 text-slate-400 dark:text-[#cba990]/60 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-medium transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hesabı Sil</span>
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                  className="fixed inset-y-0 left-0 w-72 h-full bg-white dark:bg-[#231810] z-50 flex flex-col shadow-xl"
                >
                  <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-[#493322]">
                    <div className="flex items-center gap-3">
                      <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0 border border-slate-200 dark:border-slate-700"
                        style={{ backgroundImage: `url(${schoolInfo?.photoURL || 'https://ui-avatars.com/api/?name=S&background=b45309&color=fff'})` }}
                      />
                      <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Yönetim</h1>
                      </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 dark:text-white p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      <CloseRoundedIcon />
                    </button>
                  </div>
                  <nav className="flex flex-col flex-1 px-4 py-6 gap-2 overflow-y-auto">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as TabType);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${activeTab === item.id
                          ? 'bg-school/10 text-school dark:bg-[#493322] dark:text-white font-medium'
                          : 'text-slate-600 dark:text-[#cba990] hover:bg-slate-50 dark:hover:bg-[#493322]/50 hover:text-school dark:hover:text-white'
                          }`}
                      >
                        {item.icon}
                        <span className="text-sm leading-normal">{item.label}</span>
                      </button>
                    ))}

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#493322]">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-school hover:bg-school-light text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <LogoutRoundedIcon fontSize="small" />
                        <span>Çıkış Yap</span>
                      </button>
                      <button
                        onClick={() => { setShowDeleteModal(true); setIsMobileMenuOpen(false); }}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg h-9 text-slate-400 dark:text-[#cba990]/60 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-medium transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Hesabı Sil</span>
                      </button>
                    </div>
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#231810] border-b border-slate-200 dark:border-[#493322] shrink-0 sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 -ml-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#493322]/50 rounded-lg transition-colors"
                  aria-label="Menüyü Aç"
                >
                  <MenuRoundedIcon />
                </button>
                <div className="flex flex-col">
                  <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
                    {navItems.find(item => item.id === activeTab)?.label || 'Yönetim'}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-8 border border-slate-200 dark:border-slate-700"
                  style={{ backgroundImage: `url(${schoolInfo?.photoURL || 'https://ui-avatars.com/api/?name=S&background=b45309&color=fff'})` }}
                />
              </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'dashboard' && renderDashboardOverview()}

                {activeTab === 'profile' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
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
                )}

                {activeTab === 'instructors' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <InstructorManagement schoolInfo={schoolInfo} />
                  </div>
                )}

                {activeTab === 'courses' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <CourseManagement
                      schoolId={schoolInfo.id}
                      isAdmin={false}
                      colorVariant="school"
                    />
                  </div>
                )}

                {activeTab === 'students' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <StudentManagement
                      schoolId={schoolInfo.id}
                      isAdmin={false}
                      colorVariant="school"
                    />
                  </div>
                )}

                {activeTab === 'attendance' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <AttendanceManagement
                      schoolInfo={schoolInfo}
                      isAdmin={true}
                      colorVariant="school"
                    />
                  </div>
                )}

                {activeTab === 'progress' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <ProgressTracking
                      schoolInfo={schoolInfo}
                      isAdmin={true}
                      colorVariant="school"
                    />
                  </div>
                )}

                {activeTab === 'badges' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <BadgeSystem
                      schoolInfo={schoolInfo}
                      isAdmin={true}
                      colorVariant="school"
                    />
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <ScheduleManagement
                      courses={courses}
                      onAddCourse={() => setActiveTab('courses')}
                      isAdmin={true}
                      colorVariant="school"
                    />
                  </div>
                )}

                {activeTab === 'earnings' && schoolInfo && (
                  <div className="bg-white dark:bg-[#231810] shadow-sm border border-slate-200 dark:border-[#493322] rounded-xl p-6">
                    <EarningsManagement
                      userId={schoolInfo.id}
                      role="school"
                      colorVariant="school"
                    />
                  </div>
                )}


              </motion.div>
            </div>
          </main>
        </div>
      </ThemeProvider>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        role="school"
        colorVariant="school"
        schoolId={schoolInfo?.id}
      />
    </>
  );
};

export default SchoolAdmin;