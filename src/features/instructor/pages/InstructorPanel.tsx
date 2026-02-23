import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@mui/material/styles';
import createInstructorTheme from '../../../styles/instructorTheme';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import InstructorProfileForm from '../components/InstructorProfileForm';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import { StudentManagement } from '../../../features/shared/components/students/StudentManagement';
import { query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import ScheduleManagement from '../../../features/shared/components/schedule/ScheduleManagement';
import AttendanceManagement from '../../../features/shared/components/attendance/AttendanceManagement';
import ProgressTracking from '../../../features/shared/components/progress/ProgressTracking';
import BadgeSystem from '../../../features/shared/components/badges/BadgeSystem';
import EarningsManagement from '../../../features/shared/components/earnings/EarningsManagement';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabType =
  | 'dashboard'
  | 'profile'
  | 'courses'
  | 'students'
  | 'schedule'
  | 'attendance'
  | 'progress'
  | 'badges'
  | 'earnings';

interface Course {
  id: string;
  name: string;
  schedule: { day: string; time: string }[];
  studentCount?: number;
  status?: string;
}

interface StatsState {
  courses: number;
  students: number;
  upcomingLessons: number;
  earnings: number;
}

interface InstructorPanelProps {
  user: any;
}

// ─── SVG Icons (no emoji, consistent 24×24 viewBox) ──────────────────────────
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Courses: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Students: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Schedule: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Attendance: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Progress: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Badges: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Earnings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ─── Navigation items ─────────────────────────────────────────────────────────
const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Özet', icon: <Icons.Dashboard /> },
  { id: 'profile', label: 'Profilim', icon: <Icons.Profile /> },
  { id: 'courses', label: 'Kurslarım', icon: <Icons.Courses /> },
  { id: 'students', label: 'Öğrencilerim', icon: <Icons.Students /> },
  { id: 'schedule', label: 'Ders Programım', icon: <Icons.Schedule /> },
  { id: 'attendance', label: 'Yoklama', icon: <Icons.Attendance /> },
  { id: 'progress', label: 'İlerleme Takibi', icon: <Icons.Progress /> },
  { id: 'badges', label: 'Rozetler', icon: <Icons.Badges /> },
  { id: 'earnings', label: 'Kazançlarım', icon: <Icons.Earnings /> },
];

// Day order for schedule display
const DAY_ORDER: Record<string, number> = {
  Pazartesi: 1, Salı: 2, Çarşamba: 3, Perşembe: 4, Cuma: 5, Cumartesi: 6, Pazar: 7,
};

// ─── Dashboard Overview ────────────────────────────────────────────────────────
interface DashboardProps {
  user: any;
  stats: StatsState;
  courses: Course[];
  loadingStats: boolean;
  onNavigate: (tab: TabType) => void;
}

function DashboardOverview({ user, stats, courses, loadingStats, onNavigate }: DashboardProps) {
  const statCards = [
    {
      title: 'Aktif Kurslar',
      value: stats.courses,
      sub: 'Yönettiğiniz aktif kurs',
      tab: 'courses' as TabType,
      color: 'teal',
      icon: <Icons.Courses />,
    },
    {
      title: 'Toplam Öğrenci',
      value: stats.students,
      sub: 'Kayıtlı öğrenci',
      tab: 'students' as TabType,
      color: 'blue',
      icon: <Icons.Students />,
    },
    {
      title: 'Yaklaşan Dersler',
      value: stats.upcomingLessons,
      sub: 'Bu hafta',
      tab: 'schedule' as TabType,
      color: 'emerald',
      icon: <Icons.Schedule />,
    },
    {
      title: 'Aylık Kazanç',
      value: `₺${stats.earnings.toLocaleString('tr-TR')}`,
      sub: 'Bu ay',
      tab: 'earnings' as TabType,
      color: 'amber',
      icon: <Icons.Earnings />,
    },
  ];

  // Color maps
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-instructor dark:text-teal-400 border-teal-200 dark:border-teal-800/30 hover:border-instructor/40',
    blue: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/30 hover:border-sky-500/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 hover:border-emerald-500/40',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 hover:border-amber-500/40',
  };
  const iconBgMap: Record<string, string> = {
    teal: 'bg-teal-100 dark:bg-teal-900/40 text-instructor dark:text-teal-400',
    blue: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  };

  // Build upcoming lessons from courses (flatten schedules, sort by day)
  const upcomingLessons = courses
    .flatMap(c =>
      (c.schedule || []).map(s => ({ courseName: c.name, day: s.day, time: s.time, courseId: c.id }))
    )
    .sort((a, b) => (DAY_ORDER[a.day] ?? 9) - (DAY_ORDER[b.day] ?? 9))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-instructor to-instructor-light flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user?.displayName?.[0]?.toUpperCase() ?? 'E'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Merhaba, <span className="text-instructor dark:text-teal-400">{user?.displayName ?? 'Eğitmen'}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Bugün harika bir gün — öğrencileriniz sizi bekliyor!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            onClick={() => onNavigate(card.tab)}
            className={`bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border cursor-pointer transition-all duration-200 group shadow-sm ${colorMap[card.color]}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBgMap[card.color]}`}>
              {card.icon}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5">{card.title}</p>
            <div className="flex items-end justify-between gap-1">
              {loadingStats ? (
                <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</span>
              )}
              <span className="text-slate-400 dark:text-slate-500 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.ArrowRight />
              </span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Lower grid: Upcoming lessons + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Upcoming lessons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Yaklaşan Dersler</h2>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs text-instructor dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Tümünü gör <Icons.ArrowRight />
            </button>
          </div>

          {loadingStats ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingLessons.length === 0 ? (
            <div className="p-8 text-center">
              <Icons.Schedule />
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-3">Henüz ders programı eklenmemiş.</p>
              <button
                onClick={() => onNavigate('schedule')}
                className="mt-4 px-4 py-2 text-xs font-medium bg-instructor text-white rounded-lg hover:bg-instructor-dark transition-colors cursor-pointer"
              >
                Program Ekle
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {upcomingLessons.map((lesson, idx) => (
                <li key={idx} className="flex items-center px-5 py-3 gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-instructor dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                    <Icons.Clock />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{lesson.courseName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{lesson.day}</p>
                  </div>
                  <span className="text-xs font-semibold text-instructor dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full flex-shrink-0">
                    {lesson.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Hızlı Erişim</h2>
          </div>
          <div className="p-4 space-y-2">
            {([
              { tab: 'courses', label: 'Kurslarımı Yönet', icon: <Icons.Courses /> },
              { tab: 'attendance', label: 'Yoklama Al', icon: <Icons.Attendance /> },
              { tab: 'progress', label: 'İlerleme Takip Et', icon: <Icons.Progress /> },
              { tab: 'earnings', label: 'Kazancımı Gör', icon: <Icons.Earnings /> },
              { tab: 'profile', label: 'Profilimi Düzenle', icon: <Icons.Profile /> },
            ] as { tab: TabType; label: string; icon: React.ReactNode }[]).map(item => (
              <button
                key={item.tab}
                onClick={() => onNavigate(item.tab)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-instructor dark:hover:text-teal-400 transition-all group cursor-pointer"
              >
                <span className="text-slate-400 dark:text-slate-500 group-hover:text-instructor dark:group-hover:text-teal-400 transition-colors">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-instructor dark:text-teal-400">
                  <Icons.ArrowRight />
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tips banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="bg-gradient-to-r from-instructor/5 to-instructor-light/10 dark:from-teal-900/10 dark:to-teal-800/10 rounded-xl border border-instructor/20 dark:border-teal-800/30 p-5"
      >
        <h3 className="font-semibold text-instructor dark:text-teal-400 text-sm mb-2">Eğitmen İpuçları</h3>
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-instructor-light mt-0.5">•</span>
            <span>Düzenli olarak kurs içeriğinizi güncelleyerek öğrencilerinizin ilgisini canlı tutun.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-instructor-light mt-0.5">•</span>
            <span>Öğrencilerinizin ilerleme durumlarını takip ederek kişiselleştirilmiş geri bildirimler verin.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-instructor-light mt-0.5">•</span>
            <span>Ders programınızı önceden planlayarak öğrencilerinize duyurun.</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function InstructorPanel({ user }: InstructorPanelProps) {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const instructorTheme = createInstructorTheme(isDark ? 'dark' : 'light');

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StatsState>({ courses: 0, students: 0, upcomingLessons: 0, earnings: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('instructor_sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('instructor_sidebar_collapsed', String(next)); } catch { }
      return next;
    });
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  // Fetch courses + stats (Realtime)
  useEffect(() => {
    if (!user?.id) return;
    setLoadingStats(true);

    const ref = collection(db, 'courses');
    const q = query(ref, where('instructorId', '==', user.id));

    import('firebase/firestore').then(({ onSnapshot }) => {
      const unsubscribe = onSnapshot(q, (snap) => {
        try {
          const coursesData: Course[] = snap.docs.map(d => ({
            id: d.id,
            name: d.data().name,
            schedule: d.data().schedule || [],
            studentCount: d.data().instructorIds
              ? (d.data().studentIds?.length || 0)
              : 0, // Fallback if missing
            status: d.data().status ?? 'active',
            ...d.data(), // get additional student count dynamically
          }));

          // Firestore'dan donen datada "currentParticipants" alanı da olabilir, bunu kontrol edelim
          const processedCoursesData = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              schedule: data.schedule || [],
              studentCount: data.currentParticipants || data.participantStats?.total || data.studentIds?.length || 0,
              status: data.status ?? 'active',
            };
          });

          setCourses(processedCoursesData);

          const activeCourses = processedCoursesData.filter(c => c.status !== 'inactive');
          const upcomingLessons = processedCoursesData.reduce((acc, c) => acc + (c.schedule?.length ?? 0), 0);

          setStats(prev => ({
            ...prev,
            courses: activeCourses.length,
            upcomingLessons,
          }));
        } catch (err) {
          console.error('Stats update error:', err);
        } finally {
          setLoadingStats(false);
        }
      }, (error) => {
        console.error('Realtime listener failed:', error);
        setLoadingStats(false);
      });

      // Öğrenciler için ikinci bir snapshot
      const studentsRef = collection(db, 'users');
      const studentsQ = query(studentsRef, where('instructorIds', 'array-contains', user.id));
      const unsubStudents = onSnapshot(studentsQ, (snap) => {
        const validStudentsCount = snap.docs.filter(doc => {
          const role = doc.data().role;
          return role === 'student' || (Array.isArray(role) && role.includes('student'));
        }).length;

        setStats(prev => ({
          ...prev,
          students: validStudentsCount,
        }));
      });

      return () => {
        unsubscribe();
        unsubStudents();
      };
    });
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <div className="w-5 h-5 border-2 border-instructor border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const currentLabel = navItems.find(n => n.id === activeTab)?.label ?? 'Eğitmen Paneli';

  // ── Sidebar nav item renderer ──
  const renderNavItem = (item: typeof navItems[number], onClick?: () => void) => {
    const isActive = activeTab === item.id;
    return (
      <div key={item.id} className="relative group">
        <button
          onClick={() => { setActiveTab(item.id); onClick?.(); }}
          className={`flex items-center w-full rounded-lg transition-colors text-left ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            } ${isActive
              ? 'bg-teal-50 text-instructor dark:bg-teal-900/30 dark:text-teal-400 font-medium'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-instructor dark:hover:text-teal-400'
            }`}
        >
          {item.icon}
          {!isSidebarCollapsed && <span className="text-sm leading-normal">{item.label}</span>}
        </button>

        {/* Collapsed tooltip */}
        {isSidebarCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800 dark:border-r-slate-700" />
          </div>
        )}
      </div>
    );
  };

  return (
    <ThemeProvider theme={instructorTheme}>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 antialiased">

        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside
          className={`hidden lg:flex flex-col h-screen z-20 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky top-0 transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-72'
            }`}
        >
          {/* Logo / brand */}
          <div className={`flex items-center border-b border-slate-100 dark:border-slate-700 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-3 py-6 justify-center' : 'px-6 py-6 gap-3'
            }`}>
            <div
              className="bg-gradient-to-br from-instructor to-instructor-light text-white rounded-lg size-10 flex shrink-0 items-center justify-center cursor-pointer shadow-sm font-bold text-lg"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Genişlet' : 'Eğitmen Paneli'}
            >
              {user?.displayName?.[0]?.toUpperCase() ?? 'E'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <h1 className="text-slate-900 dark:text-white text-sm font-bold leading-tight line-clamp-1">
                  {user?.displayName ?? 'Eğitmen'}
                </h1>
                <p className="text-instructor dark:text-teal-400 text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Eğitmen
                </p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`shrink-0 rounded-lg p-1 text-slate-400 hover:text-instructor hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'hidden' : ''
                }`}
              title="Daralt"
            >
              <Icons.ChevronLeft />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col flex-1 px-2 py-4 gap-1 overflow-y-auto overflow-x-hidden">
            {isSidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center w-full p-2.5 rounded-lg text-slate-400 hover:text-instructor hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mb-2"
                title="Genişlet"
              >
                <Icons.ChevronRight />
              </button>
            )}
            {navItems.map(item => renderNavItem(item))}
          </nav>

          {/* Logout */}
          <div className={`py-4 border-t border-slate-100 dark:border-slate-700 shrink-0 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {isSidebarCollapsed ? (
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                  title="Çıkış Yap"
                >
                  <Icons.Logout />
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  Çıkış Yap
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/50 text-sm font-medium shadow-sm transition-all cursor-pointer"
              >
                <Icons.Logout />
                <span>Çıkış Yap</span>
              </button>
            )}
          </div>
        </aside>

        {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
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
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-72 h-full bg-white dark:bg-slate-800 z-50 flex flex-col shadow-xl"
              >
                <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-instructor to-instructor-light text-white rounded-lg size-10 flex shrink-0 items-center justify-center font-bold text-lg shadow-sm">
                      {user?.displayName?.[0]?.toUpperCase() ?? 'E'}
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white text-sm font-bold">{user?.displayName ?? 'Eğitmen'}</p>
                      <p className="text-instructor dark:text-teal-400 text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Eğitmen
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-slate-500 dark:text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                  >
                    <Icons.Close />
                  </button>
                </div>

                <nav className="flex flex-col flex-1 px-4 py-6 gap-1 overflow-y-auto">
                  {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${isActive
                          ? 'bg-teal-50 text-instructor dark:bg-teal-900/30 dark:text-teal-400 font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-instructor dark:hover:text-teal-400'
                          }`}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/50 text-sm font-medium shadow-sm transition-all cursor-pointer"
                    >
                      <Icons.Logout />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
          {/* Mobile header */}
          <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                aria-label="Menüyü Aç"
              >
                <Icons.Menu />
              </button>
              <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
                {currentLabel}
              </h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-instructor to-instructor-light flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user?.displayName?.[0]?.toUpperCase() ?? 'E'}
            </div>
          </header>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardOverview
                    user={user}
                    stats={stats}
                    courses={courses}
                    loadingStats={loadingStats}
                    onNavigate={setActiveTab}
                  />
                )}
                {activeTab === 'profile' && <InstructorProfileForm user={user} />}
                {activeTab === 'courses' && <CourseManagement instructorId={user.id} />}
                {activeTab === 'students' && <StudentManagement isAdmin={false} />}
                {activeTab === 'schedule' && (
                  <ScheduleManagement
                    courses={courses}
                    onAddCourse={() => setActiveTab('courses')}
                    isAdmin={false}
                  />
                )}
                {activeTab === 'attendance' && (
                  <AttendanceManagement instructorId={user.id} isAdmin={false} />
                )}
                {activeTab === 'progress' && (
                  <ProgressTracking instructorId={user.id} isAdmin={false} />
                )}
                {activeTab === 'badges' && (
                  <BadgeSystem instructorId={user.id} isAdmin={false} />
                )}
                {activeTab === 'earnings' && (
                  <EarningsManagement userId={user.id} role="instructor" colorVariant="instructor" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default InstructorPanel;