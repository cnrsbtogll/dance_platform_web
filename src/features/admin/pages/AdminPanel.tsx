import React, { useState, useEffect } from 'react';
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { User } from '../../../types';
import { motion } from 'framer-motion';
import CustomSelect from '../../../common/components/ui/CustomSelect';

type TabType = 'kullanicilar' | 'kurslar' | 'ornek-veri' | 'talepler';
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
  const [activeTab, setActiveTab] = useState<TabType>('kullanicilar');
  const [activeRequestType, setActiveRequestType] = useState<RequestType>('egitmen-talepleri');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 sm:mb-10"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 inline-block relative bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent">
          Yönetim Paneli
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
          Dans okulları, eğitmenler ve dans stilleri gibi sistem genelindeki içerikleri yönetin ve platformu kontrol edin.
        </p>
      </motion.div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="md:hidden border-b border-gray-200 dark:border-slate-700 p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span>{
              activeTab === 'kullanicilar' ? 'Tüm Kullanıcılar' :
                activeTab === 'kurslar' ? 'Kurslar' :
                  activeTab === 'talepler' ? 'Talepler' :
                    'Örnek Veri'
            }</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`border-b border-gray-200 dark:border-slate-700 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block overflow-x-auto scrollbar-hide`}>
          <nav className="flex flex-col md:flex-row -mb-px whitespace-nowrap">
            <button
              onClick={() => {
                setActiveTab('kullanicilar');
                setIsMobileMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${activeTab === 'kullanicilar'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50 md:bg-transparent'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
                }`}
            >
              Tüm Kullanıcılar
            </button>
            <button
              onClick={() => {
                setActiveTab('kurslar');
                setIsMobileMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${activeTab === 'kurslar'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50 md:bg-transparent'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
                }`}
            >
              Kurslar
            </button>
            <button
              onClick={() => {
                setActiveTab('talepler');
                setIsMobileMenuOpen(false);
              }}
              className={`py-3 md:py-4 px-4 md:px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${activeTab === 'talepler'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50 md:bg-transparent'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
                }`}
            >
              Talepler
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setActiveTab('ornek-veri');
                  setIsMobileMenuOpen(false);
                }}
                className={`py-3 md:py-4 px-4 md:px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${activeTab === 'ornek-veri'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 md:bg-transparent'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
                  }`}
              >
                Örnek Veri
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'kullanicilar' && <UserManagement />}
          {activeTab === 'kurslar' && <CourseManagement isAdmin={true} />}
          {activeTab === 'talepler' && (
            <div>
              <div className="mb-6">
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
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Dans Stilleri Yönetimi</h2>
                <p className="mb-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Dans stillerini ekleyebilir, düzenleyebilir ve silebilirsiniz. Eklenen dans stilleri, kurs oluşturma ve eğitmen profillerinde kullanılabilir.
                </p>
                <DanceStyleManagement />
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Örnek Veri Ekleme</h2>
                <p className="mb-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Bu panel ile veritabanına örnek kullanıcılar ekleyebilirsiniz. Eklenen kullanıcılar dans partneri eşleştirme
                  sistemi için kullanılabilir. Her bir örnek kullanıcı çeşitli dans stilleri, seviyeler, boy, kilo ve konum
                  bilgileri içerir.
                </p>
                <div className="flex flex-wrap gap-4">
                  <SeedUsersButton />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Örnek Dans Kursları</h2>
                <p className="mb-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Bu bölümde veritabanına örnek dans kursları ekleyebilirsiniz. Oluşturulan kurslar, mevcut dans okulları ve eğitmenlerle ilişkilendirilecektir.
                </p>
                <div className="flex flex-wrap gap-4">
                  <SeedCoursesButton courseCount={25} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">İlerleme Durumu Koleksiyonları</h2>
                <p className="mb-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Bu bölümde İlerleme Durumu sayfası için gerekli Firebase koleksiyonlarını oluşturabilirsiniz. Bu koleksiyonlar, kullanıcıların dans kurslarındaki ilerlemelerini, başarı rozetlerini ve katılım durumlarını takip etmek için kullanılır.
                </p>
                <div className="flex flex-wrap gap-4">
                  <CreateProgressCollectionsButton />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Veri Migrasyon Araçları</h2>
                <p className="mb-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Bu bölümde veritabanındaki koleksiyonlar arasında veri taşıma işlemleri yapabilirsiniz.
                </p>
                <div className="flex flex-wrap gap-4">
                  <MigrateSchoolsButton />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mt-6 sm:mt-8 bg-indigo-50 rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-indigo-800">Süper Admin Yetkileri</h2>
          <p className="mt-2 text-sm sm:text-base text-indigo-700">
            Süper admin olarak, tüm dans okullarını, eğitmenleri, kursları ve kullanıcıları yönetebilirsiniz.
            Eğitmen başvurularını onaylayabilir veya reddedebilirsiniz. Dans stillerini de yönetebilirsiniz.
          </p>
        </div>
      )}

      <div className="mt-4 sm:mt-6 bg-blue-50 rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-blue-800">Yönetici İpuçları</h2>
        <ul className="mt-2 space-y-2 text-sm sm:text-base text-blue-700">
          <li>• Dans okulu ve eğitmen bilgilerinizi güncel tutmak müşteri güvenini artırır.</li>
          <li>• Kurs programınızı düzenli olarak güncelleyerek yeni öğrencilerin ilgisini çekin.</li>
          <li>• Eğitmenlerin profillerinde detaylı bilgiler sunarak deneyimlerini vurgulayın.</li>
          <li>• Kurslarınıza yüksek kaliteli fotoğraflar eklemek kayıt oranlarını artırabilir.</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminPanel; 