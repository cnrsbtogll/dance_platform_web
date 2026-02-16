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
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, AuthError } from 'firebase/auth';
import { db, auth } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import CustomInput from '../../../common/components/ui/CustomInput';
import CustomPhoneInput from '../../../common/components/ui/CustomPhoneInput';
import Button from '../../../common/components/ui/Button';
import ImageUploader from '../../../common/components/ui/ImageUploader';
import { motion } from 'framer-motion';
import { getAuthErrorMessage } from '../../../pages/auth/services/authService';
import { generateInitialsAvatar } from '../../../common/utils/imageUtils';

interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

interface FormData {
  schoolName: string;
  schoolDescription: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  country: string;
  website: string;
  danceStyles: string[];
  establishedYear: string;
  password: string;
  facilities: string[];
  photoURL: string;
}

interface BecomeSchoolProps {
  onMount?: () => void;
}

function BecomeSchool({ onMount }: BecomeSchoolProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  console.log('🏫 BecomeSchool bileşeni başlatıldı:', {
    currentUser: {
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName
    },
    timestamp: new Date().toISOString()
  });

  const [formData, setFormData] = useState<FormData>({
    schoolName: '',
    schoolDescription: '',
    contactPerson: '',
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    address: '',
    city: '',
    district: '',
    zipCode: '',
    country: 'Türkiye',
    website: '',
    danceStyles: [],
    establishedYear: '',
    password: '',
    facilities: [],
    photoURL: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [success, setSuccess] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [isAlreadySchool, setIsAlreadySchool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const querySnapshot = await getDocs(danceStylesRef);

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
    const checkUserStatus = async () => {
      console.log('🔍 Kullanıcı durumu kontrolü başladı:', {
        currentUser: currentUser?.uid,
        timestamp: new Date().toISOString()
      });

      try {
        if (currentUser) {
          console.log('👤 Giriş yapmış kullanıcı kontrolü:', {
            uid: currentUser.uid,
            email: currentUser.email
          });

          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('📄 Kullanıcı dokümanı bulundu:', {
              userData: userData,
              roles: userData.role
            });

            const roles = userData.role || [];

            if (Array.isArray(roles) && roles.includes('school')) {
              console.log('⚠️ Kullanıcı zaten okul sahibi');
              setIsAlreadySchool(true);
              setIsLoading(false);
              return;
            }

            if (userData.displayName) {
              setFormData(prev => ({
                ...prev,
                contactPerson: userData.displayName
              }));
            }
            if (userData.phoneNumber) {
              setFormData(prev => ({
                ...prev,
                contactPhone: userData.phoneNumber
              }));
            }
          }

          const requestsRef = collection(db, 'schoolRequests');
          const q = query(
            requestsRef,
            where('userId', '==', currentUser.uid),
            where('status', '==', 'pending')
          );

          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            console.log('⏳ Kullanıcının bekleyen başvurusu var');
            setHasExistingApplication(true);
          }

          setFormData(prev => ({
            ...prev,
            contactEmail: currentUser.email || ''
          }));
        } else {
          console.log('⚠️ Giriş yapmamış kullanıcı');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('❌ Kullanıcı durumu kontrol hatası:', err);
        setError('Kullanıcı durumu kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin.');
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
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

  const handleFacilitiesChange = (value: string | string[]) => {
    const facilitiesArray = Array.isArray(value) ? value : [value];
    const filteredFacilities = value === '' ? [] : facilitiesArray.filter(facility => facility !== '');

    setFormData(prev => ({
      ...prev,
      facilities: filteredFacilities
    }));
  };

  const handleImageChange = (base64Image: string | null) => {
    setFormData(prev => ({
      ...prev,
      photoURL: base64Image || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFormErrors({});

    try {
      const errors: Partial<Record<keyof FormData, string>> = {};

      if (!formData.schoolName.trim()) {
        errors.schoolName = 'Bu alan zorunlu';
      }

      if (!formData.contactPerson.trim()) {
        errors.contactPerson = 'Bu alan zorunlu';
      }

      if (!formData.contactEmail.trim()) {
        errors.contactEmail = 'Bu alan zorunlu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        errors.contactEmail = 'Geçerli bir email adresi girin';
      }

      const cleanPhone = formData.contactPhone.replace(/\s/g, '');

      if (!cleanPhone) {
        errors.contactPhone = 'Bu alan zorunlu';
      } else if (cleanPhone.length !== 10) {
        errors.contactPhone = '10 rakam girmelisiniz';
      }

      if (formData.danceStyles.length === 0) {
        errors.danceStyles = 'En az bir dans stili seçmelisiniz';
      }

      if (!currentUser) {
        if (!formData.password) {
          errors.password = 'Bu alan zorunlu';
        } else if (formData.password.length < 6) {
          errors.password = 'En az 6 karakter girmelisiniz';
        }
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsSubmitting(false);
        return;
      }

      let userId = currentUser?.uid;
      let userEmail = currentUser?.email || formData.contactEmail;

      if (!currentUser) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.contactEmail,
            formData.password as string
          );

          await updateProfile(userCredential.user, { displayName: formData.contactPerson });

          userId = userCredential.user.uid;

          await setDoc(doc(db, 'users', userId), {
            id: userId,
            email: formData.contactEmail,
            displayName: formData.contactPerson,
            photoURL: formData.photoURL || generateInitialsAvatar(formData.contactPerson, 'school'),
            phoneNumber: formData.contactPhone,
            role: ['school_applicant'],
            createdAt: serverTimestamp()
          });

        } catch (authError) {
          const error = authError as AuthError;
          throw new Error(getAuthErrorMessage(error));
        }
      }

      await addDoc(collection(db, 'schoolRequests'), {
        schoolName: formData.schoolName,
        schoolDescription: formData.schoolDescription,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        zipCode: formData.zipCode,
        country: formData.country,
        website: formData.website,
        danceStyles: formData.danceStyles,
        establishedYear: formData.establishedYear,
        facilities: formData.facilities,
        photoURL: formData.photoURL,
        userId: userId,
        userEmail: userEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSuccess(true);

      setFormData({
        schoolName: '',
        schoolDescription: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        city: '',
        district: '',
        zipCode: '',
        country: 'Türkiye',
        website: '',
        danceStyles: [],
        establishedYear: '',
        password: '',
        facilities: [],
        photoURL: ''
      });

    } catch (err) {
      console.error('Error submitting school application:', err);
      setError(`Başvuru gönderilirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata'}`);
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

  if (isAlreadySchool) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Zaten bir dans okulu yöneticisisiniz!</h2>
          <p className="text-gray-600 mb-6">Dans okulu panelinize giderek okulunuzu yönetebilirsiniz.</p>
          <Button
            onClick={() => navigate('/school-admin')}
            variant="primary"
          >
            Dans Okulu Paneline Git
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
          <p className="text-gray-600 mb-6">Dans okulu başvurunuz halihazırda inceleniyor. Başvurunuz onaylandığında size e-posta ile bilgilendirme yapılacaktır.</p>
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
          <p className="text-gray-600 mb-6">
            {!currentUser ? "Hesabınız oluşturuldu ve " : ""}
            Dans okulu başvurunuz başarıyla alındı. Başvurunuz incelendikten sonra size e-posta ile bilgilendirme yapılacaktır.
          </p>
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
    value: style.value,
    label: style.label
  }));

  const facilitiesOptions = [
    { value: 'parking', label: 'Otopark' },
    { value: 'shower', label: 'Duş' },
    { value: 'locker', label: 'Soyunma Odası' },
    { value: 'cafe', label: 'Kafeterya' },
    { value: 'airCondition', label: 'Klima' },
    { value: 'wifi', label: 'Wifi' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 relative bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight inline-block py-2">
          Dans Okulu Başvurusu
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Dans okulunuzu platformumuza kaydedin ve binlerce dans öğrencisine ulaşın.
        </p>
      </motion.div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Okul Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <CustomInput
                  label="Dans Okulu Adı"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  error={!!formErrors.schoolName}
                  helperText={formErrors.schoolName}
                  required
                />
              </div>

              <div className="col-span-2">
                <CustomInput
                  label="Okul Tanımı"
                  name="schoolDescription"
                  value={formData.schoolDescription}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </div>

              <div>
                <CustomInput
                  label="Kuruluş Yılı"
                  name="establishedYear"
                  type="text"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  helperText={`${1900} - ${new Date().getFullYear()} arası bir yıl girin`}
                />
              </div>

              <div className="col-span-2">
                <CustomSelect
                  label="Dans Stilleri"
                  name="danceStyles"
                  value={formData.danceStyles}
                  options={danceStyleOptions}
                  onChange={handleDanceStyleChange}
                  error={formErrors.danceStyles}
                  multiple
                  required
                />
              </div>

              <div className="col-span-2">
                <CustomSelect
                  label="Olanaklar"
                  name="facilities"
                  value={formData.facilities}
                  options={facilitiesOptions}
                  onChange={handleFacilitiesChange}
                  multiple
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">İletişim Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <CustomInput
                  label="Yetkili Kişi Adı"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  error={!!formErrors.contactPerson}
                  helperText={formErrors.contactPerson}
                  required
                />
              </div>

              <div className="col-span-2">
                <CustomInput
                  label="İletişim E-posta"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  error={!!formErrors.contactEmail}
                  helperText={formErrors.contactEmail}
                  required
                  disabled={!!currentUser}
                />
              </div>

              <div className="col-span-2">
                <CustomPhoneInput
                  label="İletişim Telefonu"
                  name="contactPhone"
                  countryCode="+90"
                  phoneNumber={formData.contactPhone}
                  onPhoneNumberChange={(value: string) => handleInputChange({ target: { name: 'contactPhone', value } })}
                  onCountryCodeChange={() => { }}
                  error={!!formErrors.contactPhone}
                  helperText={formErrors.contactPhone}
                  required
                />
              </div>

              <div className="col-span-2">
                <CustomInput
                  label="Web Sitesi"
                  name="website"
                  type="text"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://www.dansokulum.com"
                />
              </div>

              {!currentUser && (
                <div className="col-span-2">
                  <CustomInput
                    label="Şifre"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Adres Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <CustomInput
                  label="Adres"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div>
                  <CustomInput
                    label="Şehir"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <CustomInput
                    label="İlçe"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div>
                  <CustomInput
                    label="Posta Kodu"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <CustomInput
                    label="Ülke"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Okul Fotoğrafı</h3>
            <ImageUploader
              currentPhotoURL={formData.photoURL}
              onImageChange={handleImageChange}
              displayName={formData.schoolName || '?'}
              userType="school"
              shape="square"
              width={300}
              height={200}
            />
          </div>

          <div className="flex justify-end">
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
          Dans okulu başvurunuz, platformumuz tarafından incelendikten sonra aktif hale gelecektir. Onay sürecinde ek bilgiler veya belge istemleri olabilir.
          Onay sonrası okul yönetici panelinize erişim sağlayabileceksiniz.
        </p>
      </div>
    </div>
  );
}

export default BecomeSchool;