import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import createAdminTheme from '../../../styles/adminTheme';
import { useTheme } from '../../../contexts/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { User } from '../../../types';

// Icons
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import {
  InstructorRequests,
  DanceStyleManagement,
  ContactRequests,
  SchoolRequests,
  UserManagement
} from '../components';
import CourseManagement from '../../shared/components/courses/CourseManagement';
import { StudentManagement } from '../../shared/components/students/StudentManagement';
import SeedUsersButton from '../../../scripts/SeedUsersButton';
import MigrateSchoolsButton from '../../../scripts/MigrateSchoolsButton';
import SeedCoursesButton from '../../../scripts/SeedCoursesButton';
import CreateProgressCollectionsButton from '../../../scripts/CreateProgressCollectionsButton';
import CustomSelect from '../../../common/components/ui/CustomSelect';


type TabType = 'kullanicilar' | 'kurslar' | 'ornek-veri' | 'talepler' | 'dashboard';
type RequestType = 'egitmen-talepleri' | 'okul-basvurulari' | 'iletisim-talepleri';

const requestTypeOptions = [
  { label: 'Eğitmenlik Başvuruları', value: 'egitmen-talepleri' },
  { label: 'Okul Başvuruları', value: 'okul-basvurulari' },
  { label: 'İletişim Talepleri', value: 'iletisim-talepleri' }
];

interface AdminPanelProps {
  user?: User | null;
}

function AdminPanel({ user }: AdminPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeRequestType, setActiveRequestType] = useState<RequestType>('egitmen-talepleri');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  // We can reuse or create a similar theme for admin
  const adminTheme = createAdminTheme(isDark ? 'dark' : 'light');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('admin_sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('admin_sidebar_collapsed', String(next)); } catch { }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  // Check if the current user should be promoted to super admin
  useEffect(() => {
    const checkAndUpdateSuperAdmin = async () => {
      if (user?.id === 'HyH991wAtrU2E6JlTt711A6zHoL2' && user.email === 'super@admin.com') {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          let roles = userData.role || [];

          if (!Array.isArray(roles)) {
            roles = [roles];
          }

          if (!roles.includes('admin')) {
            roles.push('admin');
            await updateDoc(userRef, { role: roles });
            console.log('Super admin role added to user');
          }

          setIsSuperAdmin(true);
        }
      } else if (user?.role?.includes('admin')) {
        setIsSuperAdmin(true);
      }
    };

    if (user) {
      checkAndUpdateSuperAdmin();
    }
  }, [user]);

  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: <DashboardRoundedIcon fontSize="small" /> },
    { id: 'kullanicilar', label: 'Tüm Kullanıcılar', icon: <GroupsRoundedIcon fontSize="small" /> },
    { id: 'kurslar', label: 'Kurslar', icon: <MenuBookRoundedIcon fontSize="small" /> },
    { id: 'talepler', label: 'Talepler', icon: <ChatBubbleOutlineRoundedIcon fontSize="small" /> },
    ...(isSuperAdmin ? [{ id: 'ornek-veri', label: 'Gelişmiş Araçlar', icon: <BuildRoundedIcon fontSize="small" /> }] : []),
  ];

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-10"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Hoş Geldiniz, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Sistem Yöneticisi</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Platform üzerindeki okulları, eğitmenleri ve tüm etkinlikleri buradan yönetebilirsiniz.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Placeholder stats */}
        <div
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full group hover:border-indigo-500/30 transition-all cursor-pointer"
          onClick={() => setActiveTab('kullanicilar')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <GroupsRoundedIcon />
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Kullanıcı Yönetimi</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tüm Kullanıcılar</h3>
          </div>
        </div>

        <div
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full group hover:border-indigo-500/30 transition-all cursor-pointer"
          onClick={() => setActiveTab('kurslar')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <MenuBookRoundedIcon />
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Sistem Genelinde</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Kurslar</h3>
          </div>
        </div>

        <div
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full group hover:border-indigo-500/30 transition-all cursor-pointer"
          onClick={() => { setActiveTab('talepler'); setActiveRequestType('okul-basvurulari'); }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-600 dark:text-pink-400">
              <ChatBubbleOutlineRoundedIcon />
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Onay Bekleyen</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Talepler</h3>
          </div>
        </div>

        {isSuperAdmin && (
          <div
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full group hover:border-indigo-500/30 transition-all cursor-pointer"
            onClick={() => setActiveTab('ornek-veri')}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <BuildRoundedIcon />
              </div>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Super Admin</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Araçlar</h3>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {isSuperAdmin && (
          <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm p-6">
            <h2 className="text-base sm:text-lg font-bold text-indigo-800 dark:text-indigo-300">Süper Admin Yetkileri</h2>
            <p className="mt-2 text-sm sm:text-base text-indigo-700 dark:text-indigo-400">
              Süper admin olarak, tüm dans okullarını, eğitmenleri, kursları ve kullanıcıları yönetebilirsiniz.
              Eğitmen başvurularını onaylayabilir veya reddedebilirsiniz. Dans stillerini de yönetebilirsiniz.
            </p>
          </div>
        )}

        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 shadow-sm p-6">
          <h2 className="text-base sm:text-lg font-bold text-purple-800 dark:text-purple-300">Yönetici İpuçları</h2>
          <ul className="mt-2 space-y-2 text-sm sm:text-base text-purple-700 dark:text-purple-400">
            <li>• Sistemi düzenli olarak denetleyin ve bekleyen taleplere hızlı yanıt verin.</li>
            <li>• Tüm okullar için platformda yayınlanacak genel duyuruları gözden geçirin.</li>
            <li>• Gerektiğinde gelişmiş veri taşıma araçlarını dikkatli bir şekilde kullanın.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <ThemeProvider theme={adminTheme}>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 antialiased">

        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col h-screen z-20 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky top-0 transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-72'
            }`}
        >
          {/* Header */}
          <div className={`flex items-center border-b border-slate-100 dark:border-slate-700 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-3 py-6 justify-center' : 'px-6 py-6 gap-3'
            }`}>
            <div
              className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg size-10 flex shrink-0 items-center justify-center cursor-pointer shadow-sm"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Genişlet' : 'Admin'}
            >
              <span className="font-bold text-lg">A</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight line-clamp-1">Admin Paneli</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-normal">Sistem Yönetimi</p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`shrink-0 rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'hidden' : ''
                }`}
              title="Daralt"
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col flex-1 px-2 py-4 gap-1 overflow-y-auto overflow-x-hidden">
            {isSidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center w-full p-2.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mb-2"
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
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300'
                    }`}
                >
                  {item.icon}
                  {!isSidebarCollapsed && <span className="text-sm leading-normal">{item.label}</span>}
                </button>
                {/* Tooltip when collapsed */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className={`py-4 border-t border-slate-100 dark:border-slate-700 shrink-0 ${isSidebarCollapsed ? 'px-2' : 'px-4'
            }`}>
            {isSidebarCollapsed ? (
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all"
                  title="Çıkış Yap"
                >
                  <LogoutRoundedIcon fontSize="small" />
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  Çıkış Yap
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/50 text-sm font-medium shadow-sm transition-all"
              >
                <LogoutRoundedIcon fontSize="small" />
                <span>Çıkış Yap</span>
              </button>
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
                className="fixed inset-y-0 left-0 w-72 h-full bg-white dark:bg-slate-800 z-50 flex flex-col shadow-xl"
              >
                <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg size-10 flex shrink-0 items-center justify-center shadow-sm">
                      <span className="font-bold text-lg">A</span>
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Admin Paneli</h1>
                    </div>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 dark:text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
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
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-300'
                        }`}
                    >
                      {item.icon}
                      <span className="text-sm leading-normal">{item.label}</span>
                    </button>
                  ))}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/50 text-sm font-medium shadow-sm transition-all"
                    >
                      <LogoutRoundedIcon fontSize="small" />
                      <span>Çıkış Yap</span>
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
          <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Menüyü Aç"
              >
                <MenuRoundedIcon />
              </button>
              <div className="flex flex-col">
                <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
                  {navItems.find(item => item.id === activeTab)?.label || 'Admin Paneli'}
                </h2>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && renderDashboardOverview()}
              {activeTab === 'kullanicilar' && <UserManagement />}
              {activeTab === 'kurslar' && <CourseManagement isAdmin={true} />}
              {activeTab === 'talepler' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="mb-6 max-w-sm">
                    <CustomSelect
                      label="Talep Türü"
                      name="requestType"
                      options={requestTypeOptions}
                      value={activeRequestType}
                      onChange={(value) => setActiveRequestType(value as RequestType)}
                      placeholder="Talep türü seçin"
                    />
                  </div>
                  {activeRequestType === 'egitmen-talepleri' && <InstructorRequests />}
                  {activeRequestType === 'okul-basvurulari' && <SchoolRequests />}
                  {activeRequestType === 'iletisim-talepleri' && <ContactRequests />}
                </div>
              )}
              {activeTab === 'ornek-veri' && isSuperAdmin && (
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-2">Dans Stilleri Yönetimi</h2>
                    <p className="mb-6 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Dans stillerini ekleyebilir, düzenleyebilir ve silebilirsiniz. Eklenen dans stilleri, kurs oluşturma ve eğitmen profillerinde kullanılabilir.
                    </p>
                    <DanceStyleManagement />
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-2">Örnek Veri Ekleme</h2>
                    <p className="mb-6 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Bu panel ile veritabanına örnek kullanıcılar ekleyebilirsiniz. Eklenen kullanıcılar dans partneri eşleştirme
                      sistemi için kullanılabilir.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <SeedUsersButton />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-2">Örnek Dans Kursları</h2>
                    <p className="mb-6 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Bu bölümde veritabanına örnek dans kursları ekleyebilirsiniz. Oluşturulan kurslar, mevcut dans okulları ve eğitmenlerle ilişkilendirilecektir.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <SeedCoursesButton courseCount={25} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-2">İlerleme Durumu Koleksiyonları</h2>
                    <p className="mb-6 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Bu bölümde İlerleme Durumu sayfası için gerekli Firebase koleksiyonlarını oluşturabilirsiniz.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <CreateProgressCollectionsButton />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-2">Veri Migrasyon Araçları</h2>
                    <p className="mb-6 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Bu bölümde veritabanındaki koleksiyonlar arasında veri taşıma işlemleri yapabilirsiniz.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <MigrateSchoolsButton />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default AdminPanel; 