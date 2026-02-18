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
import Button from '../ui/Button';

interface NavbarProps {
  isAuthenticated: boolean;
  user?: UserType | null;
}

function Navbar({ isAuthenticated, user }: NavbarProps) {
  const { logout: authLogout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>("");
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginModalMessage, setLoginModalMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  // Role checks
  const hasInstructorRole = user?.role === 'instructor';
  const hasSchoolAdminRole = user?.role === 'school_admin';
  const hasSchoolRole = user?.role === 'school';
  const hasSuperAdminRole = user?.role === 'admin';
  const hasStudentRole = !user?.role || (!hasInstructorRole && !hasSchoolAdminRole && !hasSchoolRole && !hasSuperAdminRole && isAuthenticated);

  const fetchProfilePhoto = useCallback(async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists() && userDoc.data().photoURL) {
        setProfilePhotoURL(userDoc.data().photoURL);
        return;
      }
      if (user.photoURL && !user.photoURL.startsWith('/assets/')) {
        setProfilePhotoURL(user.photoURL);
        return;
      }
      const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
      setProfilePhotoURL(generateInitialsAvatar(user.displayName || '?', userType));
    } catch (error) {
      console.error("⛔ Profil fotoğrafı getirme hatası:", error);
      const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
      setProfilePhotoURL(generateInitialsAvatar(user?.displayName || '?', userType));
    }
  }, [user, hasInstructorRole, hasSchoolRole]);

  useEffect(() => {
    fetchProfilePhoto();
    const handleEvents = () => fetchProfilePhoto();
    eventBus.on(EVENTS.PROFILE_PHOTO_UPDATED, handleEvents);
    eventBus.on(EVENTS.PROFILE_UPDATED, handleEvents);
    return () => {
      eventBus.off(EVENTS.PROFILE_PHOTO_UPDATED, handleEvents);
      eventBus.off(EVENTS.PROFILE_UPDATED, handleEvents);
    };
  }, [user?.id, fetchProfilePhoto]);

  const handleLogout = async (): Promise<void> => {
    try {
      localStorage.removeItem('contactStatus');
      localStorage.removeItem('lastEmailUsed');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const isActive = (path: string): boolean => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && path !== '') return location.pathname.startsWith(path);
    return false;
  };

  const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => (
    <Link
      to={to}
      className={`
        inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200
        ${isActive(to)
          ? 'border-brand-primary text-brand-primary'
          : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'}
      `}
    >
      {children}
    </Link>
  );

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md fixed w-full z-50 border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                <div className="relative h-10 w-10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                  <img src="/logo.png" alt="Feriha Logo" className="w-full h-full object-contain" />
                </div>
                <img src="/logoname.png" alt="Feriha" className="h-6 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              </Link>

              <div className="hidden lg:ml-10 md:ml-6 md:flex items-center space-x-8">
                {!hasSchoolRole && !hasInstructorRole && (
                  <>
                    <NavLink to="/partners">Partner Bul</NavLink>
                    <NavLink to="/courses">Kurs Bul</NavLink>
                    <NavLink to="/festivals">Festivaller</NavLink>
                    <NavLink to="/nights">Geceler</NavLink>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:ml-6 md:flex md:items-center space-x-4">
              {/* Action Buttons based on Role */}
              <div className="flex items-center space-x-3">
                {!hasInstructorRole && !hasSchoolRole && !hasSchoolAdminRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/become-instructor')}
                    className="!border-brand-secondary !text-brand-secondary hover:!bg-brand-secondary hover:!text-white"
                  >
                    Eğitmen Ol
                  </Button>
                )}

                {!hasSchoolRole && !hasSchoolAdminRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/become-school')}
                    className="!border-amber-600 !text-amber-600 hover:!bg-amber-600 hover:!text-white"
                  >
                    Okul Aç
                  </Button>
                )}

                {hasInstructorRole && (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/instructor')}>
                    Eğitmen Paneli
                  </Button>
                )}

                {isAuthenticated ? (
                  <>
                    {hasSuperAdminRole && (
                      <Button variant="primary" size="sm" onClick={() => navigate('/admin')}>
                        Admin
                      </Button>
                    )}
                    {hasSchoolRole && !hasSuperAdminRole && (
                      <Button variant="secondary" size="sm" onClick={() => navigate('/school-admin')}>
                        Okul Paneli
                      </Button>
                    )}

                    {/* User Profile Dropdown */}
                    <div className="ml-3 relative">
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary bg-gray-100 p-0.5"
                      >
                        <span className="sr-only">Profil menüsünü aç</span>
                        <img
                          className="h-9 w-9 rounded-full object-cover border-2 border-white"
                          src={profilePhotoURL}
                          alt={user?.displayName || 'User'}
                        />
                      </button>

                      {isProfileMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-premium bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden animate-fadeIn">
                          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          </div>

                          <div className="py-1">
                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-bg hover:text-brand-primary transition-colors">
                              Profilim
                            </Link>
                            {hasStudentRole && (
                              <Link to="/progress" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-bg hover:text-brand-primary transition-colors">
                                İlerleme Durumum
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-gray-50 py-1">
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsProfileMenuOpen(false);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Çıkış Yap
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/signin')}>
                      Giriş Yap
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                      Kayıt Ol
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-brand-primary hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Menüyü aç</span>
                {isMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="pt-2 pb-3 space-y-1 px-4">
              {!hasSchoolRole && !hasInstructorRole && (
                <>
                  <Link to="/partners" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Partner Bul</Link>
                  <Link to="/courses" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Kurs Bul</Link>
                  <Link to="/festivals" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Festivaller</Link>
                  <Link to="/nights" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Geceler</Link>
                </>
              )}
            </div>

            <div className="pt-4 pb-4 border-t border-gray-100 bg-gray-50/50 px-4 space-y-3">
              {!isAuthenticated ? (
                <>
                  <Button variant="ghost" fullWidth onClick={() => { navigate('/signin'); setIsMenuOpen(false); }}>Giriş Yap</Button>
                  <Button variant="primary" fullWidth onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}>Kayıt Ol</Button>
                </>
              ) : (
                <div className="flex items-center px-2 mb-3">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full object-cover" src={profilePhotoURL} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-gray-800">{user?.displayName}</div>
                    <div className="text-sm font-medium leading-none text-gray-500 mt-1">{user?.email}</div>
                  </div>
                </div>
              )}

              {/* Mobile Actions */}
              <div className="grid grid-cols-1 gap-2">
                {!hasInstructorRole && !hasSchoolRole && !hasSchoolAdminRole && (
                  <Button variant="outline" size="sm" fullWidth onClick={() => { navigate('/become-instructor'); setIsMenuOpen(false); }}>Eğitmen Ol</Button>
                )}
                {isAuthenticated && (
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" fullWidth onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Çıkış Yap</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      {showLoginModal && (
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          message={loginModalMessage}
        />
      )}
    </>
  );
}

export default Navbar;