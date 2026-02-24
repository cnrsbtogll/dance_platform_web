import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, getAuthErrorMessage, resetPassword } from './services/authService';
import Button from '../../common/components/ui/Button';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { AuthError, UserCredential } from 'firebase/auth';
import PasswordInput from '../../common/components/ui/PasswordInput';

interface LocationState {
  from?: string;
}

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.from) {
      setError(`Bu sayfayı görüntülemek için giriş yapmalısınız.`);
    }
  }, [location.state]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    if (!email) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err) {
      setError(getAuthErrorMessage(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting to sign in...');
      const { user: firebaseUser } = await signIn(email, password);
      console.log('✅ Sign in successful, fetching user data...', firebaseUser);

      if (!firebaseUser) {
        throw new Error('No user data returned from sign in');
      }

      // Kullanıcı verilerini Firestore'dan al
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('👤 User data:', userData);
        console.log('🎭 User roles:', userData.role);

        // Rol bazlı yönlendirme
        if (userData.role?.includes('instructor')) {
          console.log('👨‍🏫 Redirecting instructor to management panel...');
          navigate('/instructor/management');
        } else if (userData.role?.includes('school')) {
          navigate('/school/dashboard');
        } else if (userData.role?.includes('admin')) {
          navigate('/admin/dashboard');
        } else {
          navigate('/profile');
        }
      } else {
        console.log('❌ No user document found in Firestore');
        navigate('/profile');
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setError(getAuthErrorMessage(err as AuthError));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        {isForgotPassword ? 'Şifremi Unuttum' : 'Giriş Yap'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {resetMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
          {resetMessage}
        </div>
      )}

      {isForgotPassword ? (
        <form onSubmit={handleResetPassword}>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="reset-email">
              E-posta
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-pink"
              required
            />
          </div>

          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
          </Button>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm font-medium text-brand-pink hover:text-indigo-800 dark:hover:text-indigo-400 focus:outline-none transition-colors"
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setResetMessage('');
              }}
            >
              Giriş ekranına dön
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-pink"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold" htmlFor="password">
                Şifre
              </label>
              <button
                type="button"
                className="text-sm font-medium text-brand-pink hover:text-indigo-800 dark:hover:text-indigo-400 focus:outline-none transition-colors"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                }}
              >
                Şifremi unuttum?
              </button>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      )}

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Hesabınız yok mu?{' '}
          <a
            href="/signup"
            className="text-brand-pink hover:text-indigo-800"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signup');
            }}
          >
            Hesap Oluştur
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignIn; 