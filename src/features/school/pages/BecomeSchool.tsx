import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, AuthError } from 'firebase/auth';
import { db, auth } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import CustomInput from '../../../common/components/ui/CustomInput';
import Button from '../../../common/components/ui/Button';
import { motion } from 'framer-motion';
import { getAuthErrorMessage } from '../../../pages/auth/services/authService';
import { generateInitialsAvatar } from '../../../common/utils/imageUtils';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface BecomeSchoolProps {
  onMount?: () => void;
}

function BecomeSchool({ onMount }: BecomeSchoolProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: currentUser?.email || '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isAlreadySchool, setIsAlreadySchool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
              setIsLoading(false);
              return;
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Kullanıcı durumu kontrol hatası:', err);
        setError('Kullanıcı durumu kontrol edilirken bir hata oluştu.');
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name as keyof RegisterFormData]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof RegisterFormData];
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.firstName.trim()) errors.firstName = 'Bu alan zorunlu';
    if (!formData.lastName.trim()) errors.lastName = 'Bu alan zorunlu';

    if (!currentUser) {
      if (!formData.email.trim()) {
        errors.email = 'Bu alan zorunlu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Geçerli bir e-posta girin';
      }

      if (!formData.password) {
        errors.password = 'Bu alan zorunlu';
      } else if (formData.password.length < 6) {
        errors.password = 'En az 6 karakter giriniz';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let userId = currentUser?.uid;
      let userEmail = currentUser?.email || formData.email;
      const displayName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      // Yeni kullanıcı oluştur (giriş yapmamışsa)
      if (!currentUser) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );

          await updateProfile(userCredential.user, { displayName });

          userId = userCredential.user.uid;
          userEmail = userCredential.user.email || formData.email;
        } catch (authError) {
          throw new Error(getAuthErrorMessage(authError as AuthError));
        }
      }

      if (!userId) throw new Error('Kullanıcı bilgileri eksik');

      // Kullanıcı dökümanı oluştur / güncelle — role: 'school', is_school_pending: true
      const photoURL = generateInitialsAvatar(displayName, 'school');
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: userEmail,
        displayName,
        photoURL,
        role: 'school',
        is_school_pending: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Pasif okul oluştur (schools koleksiyonuna)
      const schoolRef = await addDoc(collection(db, 'schools'), {
        name: displayName + ' Dans Okulu',
        displayName: displayName + ' Dans Okulu',
        contactPerson: displayName,
        contactEmail: userEmail,
        userId,
        status: 'passive',          // pasif — henüz aktifleştirilmedi
        document_url: null,
        documentStatus: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Kullanıcıya schoolId bağla
      await setDoc(doc(db, 'users', userId), {
        schoolId: schoolRef.id,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Panele yönlendir
      navigate('/school-admin');

    } catch (err) {
      console.error('❌ Kayıt hatası:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Adım göstergesi */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-school text-white flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-sm font-medium text-school">Kayıt</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-sm text-gray-400">Aktifleştirme</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-school to-school-light bg-clip-text text-transparent leading-tight inline-block py-2">
            Dans Okulu Aç
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Hemen kayıt ol, okul panelinize erişin. Okulunuzu aktifleştirmek için belge yüklemeniz yeterli.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  name="firstName"
                  label="Ad"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                />
                <CustomInput
                  name="lastName"
                  label="Soyad"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                />
              </div>

              {!currentUser && (
                <>
                  <CustomInput
                    name="email"
                    label="E-posta"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    required
                  />
                  <CustomInput
                    name="password"
                    label="Şifre"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    required
                  />
                </>
              )}

              <Button
                type="submit"
                variant="school"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Hesap oluşturuluyor...' : 'Kayıt Ol & Panele Gir'}
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Zaten hesabınız var mı?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signin')}
                  className="text-school font-medium hover:underline"
                >
                  Giriş yapın
                </button>
              </p>
            </form>
          </div>

          {/* Bilgi Notu */}
          <div className="mt-6 bg-school-bg p-4 rounded-md border border-school-lighter">
            <h3 className="text-school-dark font-semibold text-sm">Nasıl Çalışır?</h3>
            <ul className="text-school text-sm mt-2 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-school font-bold mt-0.5">1.</span>
                <span>Kayıt ol → Okul paneline erişin (belgesiz, pasif okul).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-school font-bold mt-0.5">2.</span>
                <span>Panelden <strong>"Aktif Et"</strong> butonuna tıkla → okul belgesini yükle.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-school font-bold mt-0.5">3.</span>
                <span>Yönetici onayından sonra okulunuz platformda görünür hale gelir.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default BecomeSchool;