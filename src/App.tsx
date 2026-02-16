import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FirebaseApp } from 'firebase/app';
import { Toaster } from 'react-hot-toast';
import PartnerSearchPage from './pages/partners/PartnerSearchPage';
import ProgressPage from './pages/progress/ProgressPage';
import AdminPanel from './features/admin/pages/AdminPanel';
import InstructorPanel from './features/instructor/pages/InstructorPanel';
import BecomeInstructor from './features/instructor/pages/BecomeInstructor';
import BecomeSchool from './features/school/pages/BecomeSchool';
import Navbar from './common/components/layout/Navbar';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ProfilePage from './pages/profile/ProfilePage';
import HomePage from './pages/home/HomePage';
import CourseSearchPage from './pages/courses/CourseSearchPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import InstructorDetailPage from './pages/instructors/InstructorDetailPage';
import InstructorsListPage from './pages/instructors/InstructorsListPage';
import SchoolsListPage from './pages/schools/SchoolsListPage';
import SchoolDetailPage from './pages/schools/SchoolDetailPage';
import Festivals from './pages/festivals/Festivals';
import Nights from './pages/nights/Nights';
import useAuth from './common/hooks/useAuth';
import { auth } from './api/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthProvider } from './contexts/AuthContext';
import SchoolAdmin from './features/school/pages/SchoolAdmin';
import NotificationsCenter from './common/components/badges/NotificationsCenter';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import { collection, query, where, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { db } from './api/firebase/firebase';
import { ChatDialog } from './features/chat/components/ChatDialog';
import { ChatList } from './features/chat/components/ChatList';
import { eventBus, EVENTS } from './common/utils/eventBus';
import { User } from './types';

console.log('🔍 App bileşeni yükleniyor');
console.log('🔍 Firebase auth durumu:', auth ? 'Tanımlı' : 'Tanımsız', auth);

// Instructor redirect component
const InstructorRedirect: React.FC<{ user: any }> = ({ user }) => {
  const location = useLocation();

  // Eğer kullanıcı eğitmen değilse, hiçbir şey yapma
  if (user?.role !== 'instructor') {
    return null;
  }

  // Eğitmenlerin erişemeyeceği sayfalar
  const restrictedPaths = [
    '/progress',
    '/admin',
    '/school-admin'
  ];

  // Eğer kısıtlı bir sayfadaysa eğitmen paneline yönlendir
  if (restrictedPaths.includes(location.pathname)) {
    return <Navigate to="/instructor" replace />;
  }

  return null;
};

function App(): JSX.Element {
  console.log('🔍 App bileşeni render ediliyor');

  const { user, loading, error, isOffline } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  console.log('🔍 useAuth hook sonuçları:', { user: !!user, loading, error, isOffline });

  const isAuthenticated = !!user;
  const [firebaseInitError, setFirebaseInitError] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatList, setShowChatList] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = (updatedUser: User) => {
      console.log('Profile updated:', updatedUser);
      setCurrentUser(updatedUser);
    };

    const handleProfilePhotoUpdate = () => {
      console.log('Profile photo updated');
      if (user) {
        setCurrentUser({ ...user });
      }
    };

    eventBus.on(EVENTS.PROFILE_UPDATED, handleProfileUpdate);
    eventBus.on(EVENTS.PROFILE_PHOTO_UPDATED, handleProfilePhotoUpdate);

    return () => {
      eventBus.off(EVENTS.PROFILE_UPDATED, handleProfileUpdate);
      eventBus.off(EVENTS.PROFILE_PHOTO_UPDATED, handleProfilePhotoUpdate);
    };
  }, [user]);

  // Profil fotoğrafının güncellendiğini log'la (debug için)
  useEffect(() => {
    if (user) {
      console.log('👤 Kullanıcı güncellendi:', {
        photoURL: user.photoURL?.substring(0, 30) + '...',
        displayName: user.displayName
      });

      // Firebase Auth güncellemelerini dinle
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          console.log('🔄 Firebase Auth kullanıcı değişimi algılandı');
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Firebase hatalarını resetleme fonksiyonu
  const resetFirebaseErrors = useCallback(() => {
    console.log('🔄 Firebase hataları resetleniyor...');
    setFirebaseInitError(null);
    setResetTrigger(prev => prev + 1);
    window.location.reload();
  }, []);

  // Firebase hata mesajını daha kullanıcı dostu hale getir
  const getUserFriendlyErrorMessage = (errorMessage: string) => {
    console.log('🔍 Hata mesajı işleniyor:', errorMessage);

    if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
      return 'İnternet bağlantınızı kontrol edin ve sayfayı yenileyin. Sunucuya bağlanılamıyor.';
    }

    if (errorMessage.includes('configuration-not-found')) {
      return 'Firebase yapılandırma hatası. Bu uygulama için Firebase projesi doğru şekilde yapılandırılmamış olabilir.';
    }

    if (errorMessage.includes('not initialized')) {
      return 'Firebase başlatılamadı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.';
    }

    if (errorMessage.includes('Kullanıcı profili henüz oluşturulmamış')) {
      return errorMessage;
    }

    // Firebase servislerine bağlanılamama durumları için daha spesifik mesajlar
    if (errorMessage.includes('permission-denied')) {
      return 'Yetkilendirme hatası. Bu işlemi yapmak için gerekli yetkiye sahip değilsiniz.';
    }

    if (errorMessage.includes('PERMISSION_DENIED')) {
      return 'Erişim engellendi. Bu içeriğe erişmek için daha yüksek yetki gerekebilir.';
    }

    if (errorMessage.includes('quota-exceeded')) {
      return 'Firebase kota sınırı aşıldı. Kısa bir süre sonra tekrar deneyin.';
    }

    if (errorMessage.includes('network-request-failed')) {
      return 'Ağ isteği başarısız oldu. İnternet bağlantınızı kontrol edin.';
    }

    // Storage bucket ile ilgili hatalar için
    if (errorMessage.includes('storage/invalid-argument') || errorMessage.includes('storage/invalid-bucket')) {
      return 'Storage yapılandırma hatası. Uygulama yöneticisiyle iletişime geçin.';
    }

    console.error('⚠️ Bilinmeyen hata:', errorMessage);
    return 'Firebase servislerine bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
  };

  // Uygulama sıkışmasını önlemek için timeout
  useEffect(() => {
    // 30 saniye sonra hala loading ise, zorla resetle
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Uygulama 30 saniyedir yükleniyor, zorla resetleniyor...');
        window.location.reload();
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }, [loading, resetTrigger]);

  // Firebase hazır olduğunda tetiklenen olayı dinle
  useEffect(() => {
    console.log('🔍 firebaseReady event listener useEffect çalıştı');

    const handleFirebaseReady = (e: Event) => {
      const customEvent = e as CustomEvent<{ success: boolean, error?: string }>;
      console.log('🔍 Firebase ready event alındı:', customEvent.detail);

      if (!customEvent.detail.success && customEvent.detail.error) {
        console.error('❌ Firebase başlatma hatası:', customEvent.detail.error);
        setFirebaseInitError(customEvent.detail.error);
      } else {
        console.log('✅ Firebase başarıyla başlatıldı');
        // Firebase başarıyla başlatıldı, hata varsa temizle
        setFirebaseInitError(null);
      }
    };

    // Olay dinleyicisini ekle
    document.addEventListener('firebaseReady', handleFirebaseReady);

    return () => {
      console.log('🔍 firebaseReady event listener temizleniyor');
      // Temizleme
      document.removeEventListener('firebaseReady', handleFirebaseReady);
    };
  }, []);

  useEffect(() => {
    console.log('🔍 Firebase başlatma kontrol useEffect çalıştı');

    // Firebase başlatma hatalarını yakalamak için
    try {
      console.log('🔍 Firebase auth nesnesini kontrol ediliyor...');
      // Auth nesnesinin hazır olup olmadığını kontrol et
      if (!auth) {
        console.error('❌ Firebase auth nesnesi tanımlanmamış');
        throw new Error('Firebase auth is not initialized');
      }

      console.log('🔍 Firebase auth.app özelliği kontrol ediliyor...', auth);

      // app özelliğinin ve name özelliğinin varlığını kontrol et
      if (auth.app && typeof auth.app.name === 'string') {
        console.log('✅ Firebase auth başarıyla başlatıldı:', auth.app.name);
      } else {
        console.warn('⚠️ Firebase auth başlatıldı, ancak app.name mevcut değil');
      }

      // Firebase config'i kontrol et
      console.log('🔍 Firebase config modülü import ediliyor...');
      import('./api/firebase/firebase').then((module: { default: FirebaseApp }) => {
        const app: FirebaseApp = module.default;
        console.log('🔍 Firebase app modülü yüklendi:', app);

        if (!app || Object.keys(app).length === 0) {
          console.error('❌ Firebase app nesnesi boş veya düzgün başlatılmamış');
          setFirebaseInitError('Firebase uygulaması başlatılamadı. Lütfen yapılandırmayı kontrol edin.');
        } else {
          console.log('✅ Firebase app tam olarak başlatıldı');
          // Hata varsa temizle
          setFirebaseInitError(null);
        }
      }).catch(err => {
        console.error('❌ Firebase config importu hatası:', err);
        console.error('Hata stack:', err.stack);
        setFirebaseInitError('Firebase yapılandırması yüklenemedi: ' + err.message);
      });
    } catch (err: any) {
      console.error('❌ Firebase başlatma hatası:', err);
      console.error('Hata stack:', err.stack);
      setFirebaseInitError(err instanceof Error ? err.message : 'Firebase başlatılamadı');
    }
  }, [resetTrigger]);

  useEffect(() => {
    console.log('SchoolAdmin component mounted');
    return () => {
      console.log('SchoolAdmin component unmounted');
    };
  }, []);

  // Okunmamış mesajları takip et
  useEffect(() => {
    if (!user?.id) return;

    console.log('Mesaj dinleyicisi başlatılıyor...');

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', user.id),
      where('viewed', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unviewedCount = snapshot.docs.length;
      console.log('Okunmamış mesaj sayısı güncellendi:', unviewedCount);
      setUnreadCount(unviewedCount);
    }, (error) => {
      console.error('Mesaj dinleyici hatası:', error);
    });

    return () => {
      console.log('Mesaj dinleyicisi temizleniyor...');
      unsubscribe();
    };
  }, [user?.id]); // Sadece user.id değiştiğinde yeniden bağlan

  // Tüm mesajları görüntülendi olarak işaretle
  const markAllMessagesAsViewed = async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, 'messages'),
        where('receiverId', '==', user.id),
        where('viewed', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { viewed: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all messages as viewed:', error);
    }
  };

  // Chat listesi kapatılırken mesajları görüntülendi olarak işaretle
  const handleCloseChatList = () => {
    setShowChatList(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  // Ciddi hata durumunda göster
  if (firebaseInitError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Firebase Bağlantı Hatası</h2>
          <p className="text-gray-700 mb-4">
            {getUserFriendlyErrorMessage(firebaseInitError)}
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto">
            {firebaseInitError}
          </div>
          <div className="mt-6 flex flex-col space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-pink text-white py-2 px-4 rounded hover:bg-rose-600 transition-colors duration-200"
            >
              Sayfayı Yenile
            </button>
            <button
              onClick={resetFirebaseErrors}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Firebase Bağlantısını Sıfırla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <NotificationsCenter />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '16px',
                padding: '12px 24px',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <div className="min-h-screen bg-gray-50">
            {isAuthenticated && <InstructorRedirect user={user} />}
            {isOffline && (
              <div className="bg-yellow-500 text-white text-center py-2 px-4 fixed top-0 left-0 w-full z-50">
                ⚠️ Çevrimdışı moddasınız. İnternet bağlantınızı kontrol edin.
              </div>
            )}

            {error && !isOffline && (
              <div className="bg-orange-500 text-white text-center py-2 px-4 fixed top-0 left-0 w-full z-50">
                ⚠️ {getUserFriendlyErrorMessage(error)}
              </div>
            )}

            <Navbar isAuthenticated={!!currentUser} user={currentUser} />
            <div className="pt-16">
              <Routes>
                <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} user={currentUser} />} />
                <Route path="/partners" element={<PartnerSearchPage />} />
                <Route path="/courses" element={<CourseSearchPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/instructors" element={<InstructorsListPage />} />
                <Route path="/instructors/:id" element={<InstructorDetailPage />} />
                <Route path="/schools" element={<SchoolsListPage />} />
                <Route path="/schools/:id" element={<SchoolDetailPage />} />
                <Route path="/festivals" element={<Festivals />} />
                <Route path="/nights" element={<Nights />} />
                <Route
                  path="/progress"
                  element={
                    isAuthenticated ? <ProgressPage /> : <Navigate to="/signin" />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    isAuthenticated ? <AdminPanel user={currentUser} /> : <Navigate to="/signin" />
                  }
                />

                <Route
                  path="/instructor"
                  element={
                    isAuthenticated && currentUser?.role?.includes('instructor') ?
                      <InstructorPanel user={currentUser} /> : <Navigate to="/signin" />
                  }
                />
                <Route
                  path="/school-admin"
                  element={
                    isAuthenticated && currentUser?.role?.includes('school') ?
                      <SchoolAdmin /> : <Navigate to="/signin" />
                  }
                />
                <Route
                  path="/become-instructor"
                  element={<BecomeInstructor />}
                />
                <Route
                  path="/become-school"
                  element={
                    <BecomeSchool
                      onMount={() => {
                        console.log('🎯 /become-school route render:', {
                          isAuthenticated,
                          user: {
                            id: currentUser?.id,
                            email: currentUser?.email,
                            role: currentUser?.role
                          },
                          timestamp: new Date().toISOString()
                        });
                      }}
                    />
                  }
                />
                <Route
                  path="/profile"
                  element={
                    isAuthenticated ? (
                      <ProfilePage
                        user={currentUser}
                        onUpdate={(updatedUser) => {
                          console.log('Profil güncellendi:', updatedUser);
                          // Profil güncellendiğinde yapılacak işlemler
                        }}
                      />
                    ) : (
                      <Navigate to="/signin" />
                    )
                  }
                />
                <Route path="/signin" element={isAuthenticated ? <Navigate to="/" /> : <SignIn />} />
                <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <SignUp />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>

            <footer className="bg-gray-800 text-white py-8">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-6 md:mb-0">
                    <h2 className="text-xl font-bold mb-4">Feriha</h2>
                    <p className="text-gray-300 max-w-md">
                      Türkiye'nin en kapsamlı dans platformu. Dans kursları, eğitmenler ve dans partnerleri için tek adres.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Bağlantılar</h3>
                    <ul className="space-y-2">
                      <li><a href="/courses" className="text-gray-300 hover:text-white">Kurs Bul</a></li>
                      <li><a href="/partners" className="text-gray-300 hover:text-white">Partner Bul</a></li>
                      <li><a href="/festivals" className="text-gray-300 hover:text-white">Festivaller</a></li>
                      <li><a href="/nights" className="text-gray-300 hover:text-white">Geceler</a></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">İletişim</h3>
                    <p className="text-gray-300">
                      <a href="mailto:info@venturessoftworks.com" className="hover:text-white flex items-center group">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        info@venturessoftworks.com
                      </a>
                    </p>
                    <p className="text-gray-300">
                      <a href="mailto:cnrsbtogll@gmail.com" className="hover:text-white flex items-center group">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        cnrsbtogll@gmail.com
                      </a>
                    </p>
                    <p className="text-gray-300">
                      <a href="https://wa.me/905550059876" className="hover:text-white flex items-center group">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#25D366] mr-2 transition-transform group-hover:scale-110" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        +90 555 005 9876
                      </a>
                    </p>
                    <div className="flex space-x-4 mt-4">
                      <a href="#" className="text-gray-300 hover:text-white">
                        <span className="sr-only">Facebook</span>
                        <i className="fab fa-facebook-f"></i>
                      </a>
                      <a href="#" className="text-gray-300 hover:text-white">
                        <span className="sr-only">Instagram</span>
                        <i className="fab fa-instagram"></i>
                      </a>
                      <a href="#" className="text-gray-300 hover:text-white">
                        <span className="sr-only">Twitter</span>
                        <i className="fab fa-twitter"></i>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700 text-gray-400 text-sm text-center">
                  &copy; {new Date().getFullYear()} Feriha. Tüm hakları saklıdır.
                </div>
              </div>
            </footer>

            {/* Floating Chat Button */}
            {currentUser && (
              <>
                <button
                  onClick={() => setShowChatList(true)}
                  className="fixed bottom-6 right-6 bg-gradient-to-r from-brand-pink to-rose-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                  <span className="absolute right-full mr-2 bg-gray-900 text-white text-sm py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Mesajlarım {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </span>
                </button>

                {/* Chat List Dialog */}
                {showChatList && (
                  <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                      onClick={handleCloseChatList}
                    />
                    <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
                      <div className="h-full flex flex-col">
                        <div className="px-4 py-6 bg-gradient-to-r from-brand-pink to-rose-600">
                          <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                              Mesajlarım {unreadCount > 0 && <span className="text-sm ml-2">({unreadCount} okunmamış)</span>}
                            </h2>
                            <button
                              onClick={handleCloseChatList}
                              className="text-white hover:text-gray-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <ChatList onClose={handleCloseChatList} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;