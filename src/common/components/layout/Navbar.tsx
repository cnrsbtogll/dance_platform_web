import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../../../pages/auth/services/authService';
import { User as UserType } from '../../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import LoginRequiredModal from '../modals/LoginRequiredModal';
import { eventBus, EVENTS } from '../../utils/eventBus';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

// Navbar bileşeni için prop tipleri
interface NavbarProps {
  isAuthenticated: boolean;
  user?: UserType | null;
}

function Navbar({ isAuthenticated, user }: NavbarProps) {
  const { currentUser, logout: authLogout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<'tr' | 'en'>('tr');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginModalMessage, setLoginModalMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const customNavigate = (path: string) => {
    console.log('🧭 Yönlendirme başlatılıyor:', {
      hedefYol: path,
      mevcutYol: location.pathname,
      timestamp: new Date().toISOString()
    });

    try {
      navigate(path);
      console.log('✅ Yönlendirme başarılı:', {
        hedefYol: path,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Yönlendirme hatası:', {
        hedefYol: path,
        hata: error,
        timestamp: new Date().toISOString()
      });
    }
  };

  const hasInstructorRole = user?.role === 'instructor';
  const hasSchoolAdminRole = user?.role === 'school_admin';
  const hasSchoolRole = user?.role === 'school';
  const hasSuperAdminRole = user?.role === 'admin';
  const hasStudentRole = !user?.role || (!hasInstructorRole && !hasSchoolAdminRole && !hasSchoolRole && !hasSuperAdminRole && isAuthenticated);

  // Kullanıcı rollerini kontrol et ve logla
  useEffect(() => {
    console.log('👥 Kullanıcı Role Detaylı Bilgi:', {
      timestamp: new Date().toISOString(),
      role: user?.role,
      roleType: typeof user?.role,
      userObject: {
        id: user?.id,
        email: user?.email,
        displayName: user?.displayName,
        role: user?.role,
      },
      roleChecks: {
        hasInstructorRole,
        hasSchoolAdminRole,
        hasSchoolRole,
        hasSuperAdminRole,
        hasStudentRole
      }
    });

    // Firestore users tablosundan role bilgisini kontrol et
    const checkFirestoreRole = async () => {
      if (!user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          console.log('🔄 Firestore Users Role Detayları:', {
            timestamp: new Date().toISOString(),
            userId: user.id,
            firestoreRole: firestoreData.role,
            authRole: user.role,
            comparison: {
              hasRole: !!firestoreData.role,
              roleMatch: firestoreData.role === user.role
            }
          });
        } else {
          console.warn('⚠️ Firestore\'da kullanıcı dokümanı bulunamadı:', user.id);
        }
      } catch (error) {
        console.error('❌ Firestore role kontrolü hatası:', error);
      }
    };

    checkFirestoreRole();
  }, [user, hasInstructorRole, hasSchoolAdminRole, hasSchoolRole, hasSuperAdminRole, hasStudentRole]);

  // Kullanıcı rollerini kontrol et ve logla
  useEffect(() => {
    console.log('🔍 Kullanıcı rol bilgileri:', {
      rawRole: user?.role,
      isArray: Array.isArray(user?.role),
      user: user
    });
  }, [user]);

  // Firebase kullanıcı bilgilerini logla
  useEffect(() => {
    if (user) {
      console.log('🔥 Firebase Kullanıcı Bilgileri:', {
        timestamp: new Date().toISOString(),
        basicInfo: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        customData: {
          role: user.role,
          phoneNumber: user.phoneNumber
        },
        authState: {
          isAuthenticated
        }
      });

      // Firestore'dan ek kullanıcı bilgilerini getir
      const fetchUserDetails = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            console.log('📄 Firestore Kullanıcı Detayları:', {
              timestamp: new Date().toISOString(),
              exists: true,
              data: userDoc.data(),
              id: userDoc.id
            });
          } else {
            console.log('⚠️ Firestore\'da kullanıcı dokümanı bulunamadı');
          }
        } catch (error) {
          console.error('❌ Firestore kullanıcı bilgileri getirme hatası:', error);
        }
      };

      fetchUserDetails();
    }
  }, [user, isAuthenticated]);

  // Rol durumlarını logla
  useEffect(() => {
    console.log('👥 Kullanıcı rol durumları:', {
      hasInstructorRole,
      hasSchoolAdminRole,
      hasSchoolRole,
      hasSuperAdminRole,
      hasStudentRole,
      isAuthenticated
    });
  }, [hasInstructorRole, hasSchoolAdminRole, hasSchoolRole, hasSuperAdminRole, hasStudentRole, isAuthenticated]);

  // Kullanıcı rolünü detaylı logla
  useEffect(() => {
    console.log('👤 Kullanıcı Rol Detayları:', {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      email: user?.email,
      displayName: user?.displayName,
      role: user?.role,
      roleType: typeof user?.role,
      parsedRoles: {
        isInstructor: hasInstructorRole,
        isSchoolAdmin: hasSchoolAdminRole,
        isSchool: hasSchoolRole,
        isSuperAdmin: hasSuperAdminRole,
        isStudent: hasStudentRole
      },
      isAuthenticated
    });
  }, [user, hasInstructorRole, hasSchoolAdminRole, hasSchoolRole, hasSuperAdminRole, hasStudentRole, isAuthenticated]);

  // Profil fotoğrafını Firestore'dan getir
  const fetchProfilePhoto = useCallback(async () => {
    if (!user) return;

    try {
      // Önce Firestore'dan kontrol et
      const userDoc = await getDoc(doc(db, 'users', user.id));

      console.log('🔍 Firestore profil fotoğrafı kontrolü:', {
        userId: user.id,
        firestoreExists: userDoc.exists(),
        firestoreData: userDoc.exists() ? userDoc.data() : null,
        firestorePhotoURL: userDoc.exists() ? userDoc.data().photoURL : null,
        timestamp: new Date().toISOString()
      });

      // Firestore'da photoURL varsa kullan
      if (userDoc.exists() && userDoc.data().photoURL) {
        console.log('✅ Firestore profil fotoğrafı bulundu:', userDoc.data().photoURL);
        setProfilePhotoURL(userDoc.data().photoURL);
        return;
      }

      // Firestore'da yoksa Firebase Auth'dan gelen photoURL'i kontrol et
      console.log('🔄 Firebase Auth profil fotoğrafı kontrolü:', {
        authPhotoURL: user.photoURL,
        isAssetURL: user.photoURL?.startsWith('/assets/'),
        timestamp: new Date().toISOString()
      });

      if (user.photoURL && !user.photoURL.startsWith('/assets/')) {
        console.log('✅ Firebase Auth profil fotoğrafı kullanılıyor:', user.photoURL);
        setProfilePhotoURL(user.photoURL);
        return;
      }

      // Hiçbir yerde fotoğraf yoksa baş harf avatarı göster
      console.log('⚠️ Profil fotoğrafı bulunamadı, baş harf avatarı gösteriliyor');
      const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
      const initialsAvatar = generateInitialsAvatar(user.displayName || '?', userType);
      console.log('🎨 Oluşturulan baş harf avatarı:', initialsAvatar);
      setProfilePhotoURL(initialsAvatar);
    } catch (error) {
      console.error("⛔ Profil fotoğrafı getirme hatası:", error);
      const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
      setProfilePhotoURL(generateInitialsAvatar(user?.displayName || '?', userType));
    }
  }, [user, hasInstructorRole, hasSchoolRole]);

  // Event listener'ı ekle
  useEffect(() => {
    const handleProfilePhotoUpdate = () => {
      console.log('🔄 Profil fotoğrafı güncelleme eventi alındı, fotoğraf yenileniyor...');
      fetchProfilePhoto();
    };

    const handleProfileUpdate = (updatedUser: UserType) => {
      console.log('🔄 Profil güncelleme eventi alındı:', updatedUser);
      // Kullanıcı bilgilerini güncelle
      if (user && updatedUser) {
        const updatedUserInfo = { ...user, ...updatedUser };
        // Burada kendi state yönetiminize göre user'ı güncellemeniz gerekiyor
        // Örneğin: setUser(updatedUserInfo) veya dispatch(updateUser(updatedUserInfo))
        // Şu an için sadece fotoğrafı güncelliyoruz
        fetchProfilePhoto();
      }
    };

    eventBus.on(EVENTS.PROFILE_PHOTO_UPDATED, handleProfilePhotoUpdate);
    eventBus.on(EVENTS.PROFILE_UPDATED, handleProfileUpdate);

    // Component mount olduğunda fotoğrafı getir
    console.log('🔄 Component mount oldu, ilk fotoğraf yüklemesi başlatılıyor...');
    fetchProfilePhoto();

    return () => {
      eventBus.off(EVENTS.PROFILE_PHOTO_UPDATED, handleProfilePhotoUpdate);
      eventBus.off(EVENTS.PROFILE_UPDATED, handleProfileUpdate);
    };
  }, [user?.id, fetchProfilePhoto]);

  const handleLogout = async (): Promise<void> => {
    try {
      // Çıkış yapmadan önce iletişim bilgisini temizle
      localStorage.removeItem('contactStatus');

      // Diğer sayfalar arası paylaşılan verileri de temizle
      localStorage.removeItem('lastEmailUsed');

      await signOut();
      navigate('/'); // Ana sayfaya yönlendir
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = (): void => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'tr' ? 'en' : 'tr');
  };

  // Aktif sayfayı belirlemek için yardımcı fonksiyon
  const isActive = (path: string): boolean => {
    // Ana sayfa kontrolü - artık doğrudan '/' sayfası için kontrol ediyoruz
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    // Diğer sayfalar için normal kontrol - eğer ana sayfa değilse
    if (path !== '/' && path !== '') {
      return location.pathname.startsWith(path);
    }
    return false;
  };

  const handleProtectedFeatureClick = (feature: string) => {
    if (!isAuthenticated) {
      let message = "";
      switch (feature) {
        case "progress":
          message = "İlerleme durumunuzu görebilmek için giriş yapmanız gerekmektedir.";
          break;
        case "partner":
          message = "Partner ile iletişime geçebilmek için giriş yapmanız gerekmektedir.";
          break;
        default:
          message = "Bu özelliği kullanabilmek için giriş yapmanız gerekmektedir.";
      }
      setLoginModalMessage(message);
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  return (
    <>
      <nav className={`shadow-md fixed w-full z-50 backdrop-blur-sm transition-colors duration-300 ${hasSchoolRole && !hasInstructorRole ? 'bg-white/90 dark:bg-[#231810]/90' : 'bg-white/90 dark:bg-gray-900/90'} ${hasInstructorRole ? 'border-b-2 border-instructor' : hasSchoolRole ? 'border-b-2 border-school' : 'border-b border-gray-200 dark:border-gray-700'}`}>
        {/* Instructor mode banner */}
        {hasInstructorRole && (
          <div className="bg-gradient-to-r from-instructor-dark via-instructor to-instructor-light px-4 py-0.5 flex items-center justify-center gap-2">
            <svg className="w-3 h-3 text-instructor-lighter" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] font-semibold tracking-widest text-white uppercase">Eğitmen Modu</span>
            <svg className="w-3 h-3 text-instructor-lighter" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {/* School mode banner */}
        {hasSchoolRole && !hasInstructorRole && (
          <div className="bg-gradient-to-r from-school-dark via-school to-school-light px-4 py-0.5 flex items-center justify-center gap-2">
            <svg className="w-3 h-3 text-school-lighter" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] font-semibold tracking-widest text-white uppercase">Okul Yönetim Modu</span>
            <svg className="w-3 h-3 text-school-lighter" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center group transition-all duration-300 ease-in-out gap-3">
                  {/* Modern logo without background - enlarged */}
                  <div className="relative h-14 w-14 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                    <img
                      src="/logo.png"
                      alt="Feriha Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Logo Name Image */}
                  <img
                    src="/logoname.png"
                    alt="Feriha"
                    className="h-8 w-auto object-contain dark:hidden"
                  />
                  <img
                    src="/darklogoname.png"
                    alt="Feriha"
                    className="h-8 w-auto object-contain hidden dark:block"
                  />
                </Link>
              </div>
              <div className="hidden lg:ml-8 md:ml-4 md:flex items-center lg:space-x-4 md:space-x-1">
                <>
                  <Link
                    to="/partners"
                    className={`${isActive('/partners')
                      ? 'border-brand-pink text-brand-pink font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-pink hover:border-brand-pink'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                  >
                    Partner Bul
                  </Link>
                  <Link
                    to="/courses"
                    className={`${isActive('/courses')
                      ? 'border-brand-pink text-brand-pink font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-pink hover:border-brand-pink'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                  >
                    Kurs Bul
                  </Link>
                  <Link
                    to="/festivals"
                    className={`${isActive('/festivals')
                      ? 'border-brand-pink text-brand-pink font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-pink hover:border-brand-pink'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                  >
                    Festivaller
                  </Link>
                  <Link
                    to="/nights"
                    className={`${isActive('/nights')
                      ? 'border-brand-pink text-brand-pink font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-pink hover:border-brand-pink'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                  >
                    Geceler
                  </Link>
                </>
              </div>
            </div>
            <div className="hidden md:ml-4 md:flex md:items-center lg:space-x-2 md:space-x-1">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-pink"
                title={isDark ? 'Aydınlık Mod' : 'Karanlık Mod'}
                aria-label="Tema değiştir"
              >
                {isDark ? (
                  // Sun icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  // Moon icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {/* Kullanıcının rolüne göre butonları göster */}
              <div className="flex space-x-2">
                {/* 'Eğitmen Ol' butonu */}
                {!hasInstructorRole && !hasSchoolRole && !hasSchoolAdminRole && (
                  <Link
                    to="/become-instructor"
                    className="inline-flex items-center px-2 py-1.5 lg:px-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-teal-800 to-cyan-900 hover:from-teal-700 hover:to-cyan-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    title="Eğitmen Ol"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden lg:inline">Eğitmen Ol</span>
                  </Link>
                )}

                {/* Dans Okulu Aç butonu */}
                {!hasSchoolRole && !hasSchoolAdminRole && (
                  <Link
                    to="/become-school"
                    className="inline-flex items-center px-2 py-1.5 lg:px-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-700 to-yellow-900 hover:from-amber-600 hover:to-yellow-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    title="Dans Okulu Aç"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="hidden lg:inline">Dans Okulu Aç</span>
                  </Link>
                )}

                {/* Eğitim Paneli butonu */}
                {hasInstructorRole && (
                  <Link
                    to="/instructor"
                    className="inline-flex items-center px-2 py-1.5 lg:px-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-instructor to-instructor-light hover:from-instructor-dark hover:to-instructor focus:outline-none focus:ring-2 focus:ring-instructor focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    title="Eğitmen Paneli"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="hidden lg:inline">Eğitmen Paneli</span>
                  </Link>
                )}
              </div>

              {isAuthenticated ? (
                <>
                  {/* Admin Panel Butonu */}
                  {hasSuperAdminRole && (
                    <Link
                      to="/admin"
                      className="mr-1 lg:mr-3 inline-flex items-center px-2 py-1.5 lg:px-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                      title="Admin Panel"
                    >
                      <span className="hidden lg:inline">Admin Panel</span>
                      <span className="lg:hidden text-[10px] font-bold">ADM</span>
                    </Link>
                  )}
                  {/* Okul Yönetim Paneli */}
                  {hasSchoolRole && !hasSuperAdminRole && (
                    <Link
                      to="/school-admin"
                      className="mr-1 lg:mr-3 inline-flex items-center px-2 py-1.5 lg:px-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-700 to-yellow-900 hover:from-amber-600 hover:to-yellow-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                      title="Okul Yönetim Paneli"
                    >
                      <span className="hidden lg:inline">Okul Yönetim Paneli</span>
                      <span className="lg:hidden text-[10px] font-bold">OKUL</span>
                    </Link>
                  )}
                  <div className="ml-3 relative">
                    <div className="flex items-center">
                      {/* Kullanıcı Bilgileri - Masaüstü */}
                      <div className="hidden md:block mr-3 text-right">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.displayName || 'Kullanıcı'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{user?.email || ''}</div>
                      </div>
                      <button
                        onClick={toggleProfileMenu}
                        className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
                      >
                        <span className="sr-only">Profil menüsünü aç</span>
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={profilePhotoURL}
                          alt={user?.displayName || 'Profil'}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
                            target.src = generateInitialsAvatar(user?.displayName || '?', userType);
                          }}
                        />
                      </button>
                    </div>
                    {isProfileMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200"
                      >
                        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-xs py-1">
                          {/* Kullanıcı Bilgileri - Dropdown */}
                          <div className="block px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.displayName || 'Kullanıcı'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</div>
                          </div>
                          {/* Profil linki - rolüne göre farklı profil sayfasına yönlendirme */}
                          {hasSuperAdminRole ? (
                            <Link
                              to="/profile?type=admin"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 transition-colors duration-150"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              Admin Profilim
                            </Link>
                          ) : hasStudentRole ? (
                            <>
                              <Link
                                to="/profile"
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-brand-pink transition-colors duration-150"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                Profilim
                              </Link>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-brand-pink transition-colors duration-150"
                                onClick={() => {
                                  console.log('🎯 İlerleme Durumum butonuna tıklandı:', {
                                    isAuthenticated,
                                    user: {
                                      id: user?.id,
                                      email: user?.email,
                                      role: user?.role,
                                      displayName: user?.displayName
                                    },
                                    hasStudentRole,
                                    timestamp: new Date().toISOString()
                                  });

                                  const result = handleProtectedFeatureClick('progress');
                                  console.log('🔒 handleProtectedFeatureClick sonucu:', {
                                    result,
                                    timestamp: new Date().toISOString()
                                  });

                                  if (result) {
                                    console.log('🚀 /progress sayfasına yönlendiriliyor...');
                                    customNavigate('/progress');
                                    console.log('📱 Menü kapatılıyor...');
                                    setIsProfileMenuOpen(false);
                                  }
                                }}
                              >
                                İlerleme Durumum
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsProfileMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 transition-colors duration-150"
                          >
                            Çıkış Yap
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Giriş yapmamış kullanıcılar için butonlar */
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Link
                    to="/signin"
                    className="inline-flex items-center px-2 py-2 lg:px-4 lg:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    title="Giriş Yap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden lg:inline">Giriş Yap</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-2 py-2 lg:px-4 lg:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-brand-pink to-rose-600 hover:from-brand-pink hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    title="Kayıt Ol"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="hidden lg:inline">Kayıt Ol</span>
                  </Link>
                </div>
              )}
            </div>
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-brand-pink hover:bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-pink transition duration-150 ease-in-out"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobil için hamburger menüsü */}
        {isMenuOpen && (
          <div className={`md:hidden animate-fadeIn fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto transition-colors duration-300 ${hasInstructorRole ? 'border-t-2 border-instructor' : ''}`}>
            <div className={`pt-2 pb-3 border-t border-gray-200 dark:border-gray-700 ${hasInstructorRole ? 'bg-instructor-bg/40' : 'bg-gray-50 dark:bg-slate-900/80 dark:bg-gray-800/80'} backdrop-blur-sm`}>
              {/* Her durumda gösterilecek butonlar */}
              <div className="px-4 space-y-2">
                {!hasInstructorRole && !hasSchoolRole && !hasSchoolAdminRole && (
                  <Link
                    to="/become-instructor"
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-teal-800 to-cyan-900 hover:from-teal-700 hover:to-cyan-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Eğitmen Ol
                    </div>
                  </Link>
                )}

                {/* Dans Okulu Aç butonu - Mobil */}
                {!hasSchoolRole && !hasSchoolAdminRole && (
                  <Link
                    to="/become-school"
                    onClick={() => {
                      console.log('🎯 Dans Okulu Aç butonuna tıklandı (Mobil):', {
                        userId: user?.id,
                        userEmail: user?.email,
                        userRole: user?.role,
                        roleChecks: {
                          hasInstructorRole,
                          hasSchoolRole,
                          hasSchoolAdminRole,
                          hasSuperAdminRole
                        },
                        timestamp: new Date().toISOString(),
                        currentPath: location.pathname
                      });
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-700 to-yellow-900 hover:from-amber-600 hover:to-yellow-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Dans Okulu Aç
                    </div>
                  </Link>
                )}

                {/* Eğitmen Paneli butonu - Mobil */}
                {hasInstructorRole && (
                  <Link
                    to="/instructor"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-instructor to-instructor-light hover:from-instructor-dark hover:to-instructor focus:outline-none focus:ring-1 focus:ring-instructor focus:ring-offset-1 shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Eğitmen Paneli
                    </div>

                    {/* Eğitmen rozeti */}
                    <div className="mt-0.5 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-instructor-lighter uppercase">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Eğitmen Modu
                      </span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Ana Kategori Linkleri - Mobil (Herkese Açık) */}
              <div className="px-4 py-2 space-y-1 border-b border-gray-200 dark:border-gray-700">
                <Link
                  to="/partners"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Partner Bul
                </Link>
                <Link
                  to="/courses"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kurs Bul
                </Link>
                <Link
                  to="/festivals"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Festivaller
                </Link>
                <Link
                  to="/nights"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Geceler
                </Link>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-4 py-2">
                    <div className="flex-shrink-0">
                      <img
                        className="h-8 w-8 rounded-full object-cover shadow-sm"
                        src={profilePhotoURL}
                        alt={user?.displayName || 'Profil'}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
                          target.src = generateInitialsAvatar(user?.displayName || '?', userType);
                        }}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium leading-none text-gray-800 dark:text-gray-200">{user?.displayName || 'Kullanıcı'}</div>
                      <div className="text-xs font-medium leading-none text-gray-500 dark:text-gray-400 mt-1">{user?.email || ''}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Profil Menüsü
                    </div>

                    {/* Admin Panel Linkleri - Mobil */}
                    {hasSuperAdminRole && (
                      <Link
                        to="/admin"
                        className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    {hasSchoolRole && !hasSuperAdminRole && (
                      <Link
                        to="/school-admin"
                        className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-amber-700 to-yellow-900 hover:from-amber-600 hover:to-yellow-800 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Okul Yönetim Paneli
                      </Link>
                    )}

                    {/* Öğrenci Teşvik Butonları - Mobil */}
                    {/* Butonlar kaldırıldı ve her zaman gösterilecek şekilde taşındı */}

                    {/* Profil linki - Mobil versiyon */}
                    {hasSuperAdminRole ? (
                      <Link
                        to="/profile?type=admin"
                        className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Profilim
                      </Link>
                    ) : hasStudentRole ? (
                      <>
                        <Link
                          to="/profile"
                          className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profilim
                        </Link>
                        <button
                          className="block w-full text-left px-3 py-1 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-150"
                          onClick={() => {
                            console.log('🎯 İlerleme Durumum butonuna tıklandı:', {
                              isAuthenticated,
                              user: {
                                id: user?.id,
                                email: user?.email,
                                role: user?.role,
                                displayName: user?.displayName
                              },
                              hasStudentRole,
                              timestamp: new Date().toISOString()
                            });

                            const result = handleProtectedFeatureClick('progress');
                            console.log('🔒 handleProtectedFeatureClick sonucu:', {
                              result,
                              timestamp: new Date().toISOString()
                            });

                            if (result) {
                              console.log('🚀 /progress sayfasına yönlendiriliyor...');
                              customNavigate('/progress');
                              console.log('📱 Menü kapatılıyor...');
                              setIsMenuOpen(false);
                            }
                          }}
                        >
                          İlerleme Durumum
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-1 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      Çıkış Yap
                    </button>
                    {/* Dark mode toggle - Mobile */}
                    <div className="pt-3 mt-1 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={toggleTheme}
                        className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        {isDark ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Aydınlık Mod
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            Karanlık Mod
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Giriş yapmamış kullanıcılar için menü */
                <div className="pt-1 mt-1 border-t border-gray-200 dark:border-slate-700 space-y-2">
                  <Link
                    to="/signin"
                    className="block w-full px-3 py-1 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-pink focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Giriş Yap
                    </div>
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-brand-pink to-rose-600 hover:from-brand-pink hover:to-rose-700 focus:outline-none focus:ring-1 focus:ring-brand-pink focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Kayıt Ol
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message={loginModalMessage}
      />
    </>
  );
}

export default Navbar;