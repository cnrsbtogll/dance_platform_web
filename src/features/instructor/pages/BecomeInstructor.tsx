import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import CustomInput from '../../../common/components/ui/CustomInput';
import CustomPhoneInput from '../../../common/components/ui/CustomPhoneInput';
import Button from '../../../common/components/ui/Button';
import ImageUploader from '../../../common/components/ui/ImageUploader';
import { motion } from 'framer-motion';

// Dans stilleri interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  danceStyles: string[];
  experience: string;
  bio: string;
  photoURL?: string | null;
  password?: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  contactNumber: '',
  danceStyles: [],
  experience: '',
  bio: '',
  photoURL: null,
  password: ''
};

function BecomeInstructor() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [isAlreadyInstructor, setIsAlreadyInstructor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const q = query(danceStylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);

        const styles: DanceStyle[] = [];
        querySnapshot.forEach((doc) => {
          styles.push({
            id: doc.id,
            ...doc.data()
          } as DanceStyle);
        });

        if (styles.length === 0) {
          // If no styles in Firestore, use default styles
          setDanceStyles([
            { id: 'default-1', label: 'Salsa', value: 'salsa' },
            { id: 'default-2', label: 'Bachata', value: 'bachata' },
            { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
            { id: 'default-4', label: 'Tango', value: 'tango' },
            { id: 'default-5', label: 'Vals', value: 'vals' }
          ]);
        } else {
          setDanceStyles(styles);
        }
      } catch (err) {
        console.error('Error fetching dance styles:', err);
        // Fallback to default styles on error
        setDanceStyles([
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Vals', value: 'vals' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || null
      }));
    }

    const checkUserStatus = async () => {
      try {
        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const roles = userData.role || [];

          if (Array.isArray(roles) && roles.includes('instructor')) {
            setIsAlreadyInstructor(true);
            setIsLoading(false);
            return;
          }

          if (userData.displayName) {
            setFormData(prev => ({
              ...prev,
              firstName: userData.displayName.split(' ')[0],
              lastName: userData.displayName.split(' ')[1] || '',
              photoURL: userData.photoURL || currentUser.photoURL || null
            }));
          }
          if (userData.phoneNumber) {
            setFormData(prev => ({
              ...prev,
              contactNumber: userData.phoneNumber
            }));
          }
        }

        const requestsRef = collection(db, 'instructorRequests');
        const q = query(
          requestsRef,
          where('userId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setHasExistingApplication(true);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error checking user status:', err);
        setGeneralError('Kullanıcı durumu kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin.');
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof FormData];
        return updated;
      });
    }
  };

  const handleDanceStyleChange = (value: string | string[]) => {
    const danceStylesArray = Array.isArray(value) ? value : [value];
    const filteredStyles = value === '' ? [] : danceStylesArray.filter(style => style !== '');

    setSelectedDanceStyles(filteredStyles);
    setFormData(prev => ({
      ...prev,
      danceStyles: filteredStyles
    }));

    if (formErrors.danceStyles) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated.danceStyles;
        return updated;
      });
    }
  };

  const handlePhotoChange = (base64Image: string | null) => {
    console.log('🖼️ Fotoğraf değişikliği:', base64Image ? 'Fotoğraf seçildi' : 'Fotoğraf seçilmedi');
    if (base64Image) {
      setFormData(prev => {
        console.log('📸 Fotoğraf formData\'ya ekleniyor');
        return {
          ...prev,
          photoURL: base64Image
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);
    setFormErrors({});

    console.log('🔵 Form gönderme işlemi başlatıldı:', formData);

    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Bu alan zorunlu';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Bu alan zorunlu';
    }

    if (!formData.danceStyles || formData.danceStyles.length === 0) {
      errors.danceStyles = 'En az bir dans stili seçmelisiniz';
    }

    const cleanPhone = formData.contactNumber.replace(/\s/g, '');

    if (!cleanPhone) {
      errors.contactNumber = 'Bu alan zorunlu';
    } else if (cleanPhone.length !== 10) {
      errors.contactNumber = '10 rakam girmelisiniz';
    }

    if (!currentUser) {
      if (!formData.email) {
        errors.email = 'Bu alan zorunlu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Geçerli bir email adresi girin';
      }
    }

    console.log('✅ Form validasyonu tamamlandı. Hatalar:', errors);

    if (Object.keys(errors).length > 0) {
      console.log('❌ Form validasyonu başarısız');
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      let userId = currentUser?.uid;
      let userEmail = currentUser?.email;

      if (!currentUser && formData.email) {
        console.log('🔵 Yeni kullanıcı oluşturuluyor...');
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password || ''
          );

          await updateProfile(userCredential.user, {
            displayName: `${formData.firstName} ${formData.lastName}`,
            photoURL: formData.photoURL
          });

          userId = userCredential.user.uid;
          userEmail = userCredential.user.email;

          // Users koleksiyonuna yeni kullanıcı verisi ekleniyor
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, {
            id: userId,
            email: userEmail,
            displayName: `${formData.firstName} ${formData.lastName}`,
            photoURL: formData.photoURL,
            phoneNumber: formData.contactNumber,
            role: 'student', // Başlangıçta student olarak ayarlanıyor, onay sonrası instructor olacak
            danceStyles: formData.danceStyles,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active'
          });

          console.log('✅ Yeni kullanıcı oluşturuldu:', userId);
        } catch (authError) {
          console.error('❌ Kullanıcı oluşturma hatası:', authError);
          setGeneralError('Hesap oluşturulurken bir hata oluştu. Lütfen farklı bir e-posta adresi deneyin.');
          setIsSubmitting(false);
          return;
        }
      }

      if (!userId || !userEmail) {
        throw new Error('Kullanıcı bilgileri eksik');
      }

      console.log('🔵 Eğitmen başvurusu oluşturuluyor...');
      const instructorRequestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        experience: formData.experience,
        danceStyles: formData.danceStyles,
        contactNumber: formData.contactNumber,
        bio: formData.bio,
        userId: userId,
        userEmail: userEmail,
        photoURL: formData.photoURL,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      console.log('📝 Gönderilecek veri:', instructorRequestData);

      await addDoc(collection(db, 'instructorRequests'), instructorRequestData);
      console.log('✅ Başvuru başarıyla gönderildi');

      setSuccess(true);
      setFormData(initialFormData);
      setSelectedDanceStyles([]);

    } catch (err) {
      console.error('❌ Başvuru gönderilirken hata oluştu:', err);
      setGeneralError(`Başvuru gönderilirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (isAlreadyInstructor) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Zaten bir eğitmensiniz!</h2>
          <p className="text-gray-600 mb-6">Eğitmen panelinize giderek derslerinizi yönetebilirsiniz.</p>
          <Button
            onClick={() => navigate('/instructor')}
            variant="primary"
          >
            Eğitmen Paneline Git
          </Button>
        </div>
      </div>
    );
  }

  if (hasExistingApplication) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-yellow-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Başvurunuz İnceleniyor</h2>
          <p className="text-gray-600 mb-6">Eğitmen başvurunuz halihazırda inceleniyor. Başvurunuz onaylandığında size e-posta ile bilgilendirme yapılacaktır.</p>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 mb-6">Eğitmen başvurunuz başarıyla alındı. Başvurunuz incelendikten sonra size e-posta ile bilgilendirme yapılacaktır.</p>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  const danceStyleOptions = danceStyles.map(style => ({
    label: style.label,
    value: style.value
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 relative bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight inline-block py-2">
          Eğitmen Olarak Başvurun
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Dans tutkunuzu profesyonel bir kariyere dönüştürün ve platformumuzda yeni öğrencilerle buluşun.
        </p>
      </motion.div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {generalError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <CustomInput
                name="firstName"
                label="Ad"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
              />
            </div>

            <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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
                </div>

                <div className="md:col-span-2">
                  <CustomInput
                    name="password"
                    label="Şifre"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    required
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <CustomPhoneInput
                name="contactNumber"
                label="Telefon"
                countryCode="+90"
                phoneNumber={formData.contactNumber || ''}
                onCountryCodeChange={() => { }}
                onPhoneNumberChange={(value) => handleInputChange({ target: { name: 'contactNumber', value } })}
                error={!!formErrors.contactNumber}
                helperText={formErrors.contactNumber}
                required
              />
            </div>

            <div className="md:col-span-2">
              {loadingStyles ? (
                <div className="bg-gray-100 p-2 rounded-md flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-pink mr-2"></div>
                  <span className="text-gray-600">Dans stilleri yükleniyor...</span>
                </div>
              ) : (
                <CustomSelect
                  name="danceStyles"
                  label="Uzmanlık Alanlarınız (Dans Stilleri)"
                  value={selectedDanceStyles}
                  onChange={handleDanceStyleChange}
                  options={danceStyleOptions}
                  error={formErrors.danceStyles}
                  multiple={true}
                  required
                />
              )}
            </div>

            <div className="md:col-span-2">
              <CustomInput
                name="experience"
                label="Deneyim"
                value={formData.experience || ''}
                onChange={handleInputChange}
                placeholder="Örn: 5 yıl"
              />
            </div>

            <div className="md:col-span-2">
              <CustomInput
                name="bio"
                label="Özgeçmiş / Biyografi"
                value={formData.bio || ''}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Kendiniz hakkında kısa bir bilgi..."
              />
            </div>

            <div className="md:col-span-2">
              <ImageUploader
                currentPhotoURL={currentUser ? (formData.photoURL || currentUser.photoURL || '') : (formData.photoURL || '')}
                onImageChange={handlePhotoChange}
                displayName={`${formData.firstName} ${formData.lastName}`}
                userType="instructor"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h3 className="text-blue-800 font-semibold">Bilgi</h3>
        <p className="text-blue-700 text-sm mt-1">
          Eğitmen başvurunuz, yönetici onayından sonra aktif olacaktır. Onay sürecinde ek bilgiler istenebilir.
          Onay sonrası eğitmen panelinize erişim sağlayabileceksiniz.
        </p>
      </div>
    </div>
  );
}

export default BecomeInstructor; 