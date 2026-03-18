import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { signUp, getAuthErrorMessage } from '../../../pages/auth/services/authService';
import Button from '../../../common/components/ui/Button';
import PasswordInput from '../../../common/components/ui/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { createSchoolRequestForNewUser } from '../../../api/services/schoolService';

// Google Logo SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

interface BecomeSchoolProps {
  onMount?: () => void;
}

function BecomeSchool({ onMount }: BecomeSchoolProps) {
  const navigate = useNavigate();
  const { signInWithGoogle, currentUser, pendingRedirectResult, clearPendingRedirect } = useAuth();

  const [formData, setFormData] = useState({
    email: currentUser?.email || '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAlreadySchool, setIsAlreadySchool] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const roles = userData.role || [];

            if (Array.isArray(roles) ? roles.includes('school') : roles === 'school') {
              setIsAlreadySchool(true);
            }
          }
        }
      } catch (err) {
        console.error('❌ Kullanıcı durumu kontrol hatası:', err);
      } finally {
        setInitializing(false);
      }
    };

    checkUserStatus();
  }, [currentUser]);

  // Handle mobile Google redirect result explicitly for this page
  useEffect(() => {
    if (pendingRedirectResult) {
      const handleGoogleRedirect = async () => {
        setGoogleLoading(true);
        try {
          const { credential } = pendingRedirectResult;
          const userId = credential.user.uid;
          const userEmail = credential.user.email || '';
          const displayName = credential.user.displayName || 'İsimsiz';

          await createSchoolRequestForNewUser(userId, userEmail, displayName);
          clearPendingRedirect();
          navigate('/school-admin');
        } catch (err) {
          setError(getAuthErrorMessage(err as AuthError));
        } finally {
          setGoogleLoading(false);
        }
      };
      // We only execute this if we haven't already completed registration
      if (!isAlreadySchool && !initializing) {
         handleGoogleRedirect();
      }
    }
  }, [pendingRedirectResult, isAlreadySchool, initializing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
      setError('Lütfen tüm alanları doldurun.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Normal signup logic first, but pass 'school' optionally or let default be 'student'
      // It handles Auth + User Doc creation
      const user = await signUp(formData.email, formData.password, formData.displayName, 'school');
      
      // We do the custom school request creation and user tagging
      await createSchoolRequestForNewUser(user.id, user.email, formData.displayName);
      
      navigate('/school-admin');
    } catch (err) {
      setError(getAuthErrorMessage(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      // On mobile standard redirect happens and this code isn't reached immediately.
      // On desktop:
      const { credential } = result;
      const userId = credential.user.uid;
      const userEmail = credential.user.email || '';
      const displayName = credential.user.displayName || 'İsimsiz';

      await createSchoolRequestForNewUser(userId, userEmail, displayName);
      navigate('/school-admin');
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setError(getAuthErrorMessage(err as AuthError));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-school"></div>
        <span className="ml-3 text-gray-700 dark:text-gray-300">Yükleniyor...</span>
      </div>
    );
  }

  if (isAlreadySchool) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Zaten bir dans okulu yöneticisisiniz!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Dans okulu panelinize giderek okulunuzu yönetebilirsiniz.</p>
          <Button onClick={() => navigate('/school-admin')} variant="school">
            Dans Okulu Paneline Git
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white border-b-2 border-school pb-4">Dans Okulu Aç</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Google Sign-Up ── */}
        <button
          id="google-signup-btn"
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 mb-5
            border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-700
            text-gray-700 dark:text-gray-200
            rounded-md font-medium text-sm
            hover:bg-gray-50 dark:hover:bg-slate-600
            transition-colors duration-150
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-school"
        >
          {googleLoading ? (
            <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <GoogleIcon />
          )}
          Google ile Kayıt Ol
        </button>

        {/* ── Divider ── */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-800 px-2 text-gray-400">veya e-posta ile</span>
          </div>
        </div>

        {/* ── Email / Password Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="displayName">
              Ad Soyad
            </label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-school"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-school"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Şifre
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Şifre Tekrar
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" variant="school" fullWidth disabled={loading}>
            {loading ? 'İşleniyor...' : 'Kayıt Ol'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Zaten hesabınız var mı?{' '}
            <a
              href="/signin"
              className="text-school hover:underline"
              onClick={(e) => { e.preventDefault(); navigate('/signin'); }}
            >
              Giriş Yap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default BecomeSchool;
