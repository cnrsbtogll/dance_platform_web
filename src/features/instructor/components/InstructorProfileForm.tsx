import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { doc, updateDoc, getDoc, setDoc, writeBatch, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth, storage } from '../../../api/firebase/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { User, DanceLevel, DanceStyle as DanceStyleType } from '../../../types';
import ImageUploader from '../../../common/components/ui/ImageUploader';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../common/components/ui/CustomPhoneInput';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import CustomInput from '../../../common/components/ui/CustomInput';
import ChangePasswordForm from '../../shared/components/profile/ChangePasswordForm';

interface InstructorProfileFormProps {
  user: User;
}

interface DanceStyleOption {
  id: string;
  label: string;
  value: string;
}

interface InstructorProfileFormData {
  displayName: string;
  bio: string;
  specialties: string[];
  experience: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  photoURL: string;
  gender: string;
  age: number | undefined;
  level: DanceLevel;
  city: string;
  height?: number;
  weight?: number;
  danceStyles: string[];
  availableTimes: string[];
  instagram?: string;
  youtube?: string;
  twitter?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  isPartnerSearchActive?: boolean;
  role?: string;
  userId?: string;
}

const InstructorProfileForm: React.FC<InstructorProfileFormProps> = ({ user }) => {
  const navigate = useNavigate();
  const [danceStyles, setDanceStyles] = useState<DanceStyleOption[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>(user.photoURL || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, getValues, formState: { isDirty } } = useForm<InstructorProfileFormData>({
    defaultValues: {
      displayName: '',
      bio: '',
      specialties: [],
      experience: '',
      phoneNumber: '',
      countryCode: '+90',
      location: '',
      photoURL: '',
      gender: '',
      age: undefined,
      level: 'beginner',
      city: '',
      height: undefined,
      weight: undefined,
      danceStyles: [],
      availableTimes: [],
      instagram: '',
      youtube: '',
      twitter: '',
      isPartnerSearchActive: false
    }
  });

  const watchDisplayName = watch('displayName');
  const watchRole = watch('specialties');

  useEffect(() => {
    if (!user?.id) {
      toast.error('Geçersiz kullanıcı bilgisi');
      navigate('/');
    }
  }, [user, navigate]);

  const fetchDanceStyles = useCallback(async () => {
    if (danceStyles.length > 0) return;
    try {
      setLoadingStyles(true);
      const stylesRef = collection(db, 'danceStyles');
      const q = query(stylesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const stylesData: DanceStyleOption[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stylesData.push({
          id: doc.id,
          label: data.name,
          value: doc.id
        });
      });
      setDanceStyles(stylesData.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (error) {
      console.error('Dance styles fetch error fallback to defaults', error);
      const defaultStyles = [
        { id: 'salsa', label: 'Salsa', value: 'salsa' },
        { id: 'bachata', label: 'Bachata', value: 'bachata' },
        { id: 'kizomba', label: 'Kizomba', value: 'kizomba' },
        { id: 'tango', label: 'Tango', value: 'tango' },
        { id: 'hiphop', label: 'Hip Hop', value: 'hiphop' },
        { id: 'contemporary', label: 'Contemporary', value: 'contemporary' },
        { id: 'zumba', label: 'Zumba', value: 'zumba' },
        { id: 'heels', label: 'High Heels', value: 'heels' },
        { id: 'reggaeton', label: 'Reggaeton', value: 'reggaeton' },
        { id: 'afro', label: 'Afro Dance', value: 'afro' },
        { id: 'bellydance', label: 'Oryantal', value: 'bellydance' },
        { id: 'ballet', label: 'Bale', value: 'ballet' },
        { id: 'jazz', label: 'Jazz Dance', value: 'jazz' },
        { id: 'flamenco', label: 'Flamenko', value: 'flamenco' },
        { id: 'samba', label: 'Samba', value: 'samba' },
        { id: 'rumba', label: 'Rumba', value: 'rumba' },
        { id: 'cha-cha', label: 'Cha Cha', value: 'cha-cha' },
        { id: 'pasodoble', label: 'Paso Doble', value: 'pasodoble' },
        { id: 'jive', label: 'Jive', value: 'jive' },
        { id: 'swing', label: 'Swing', value: 'swing' },
        { id: 'lindyhop', label: 'Lindy Hop', value: 'lindyhop' },
        { id: 'breakdance', label: 'Breakdance', value: 'breakdance' },
        { id: 'popping', label: 'Popping', value: 'popping' },
        { id: 'locking', label: 'Locking', value: 'locking' },
        { id: 'krump', label: 'Krump', value: 'krump' },
        { id: 'dancehall', label: 'Dancehall', value: 'dancehall' },
        { id: 'vogue', label: 'Vogue', value: 'vogue' },
        { id: 'waacking', label: 'Waacking', value: 'waacking' },
        { id: 'commercial', label: 'Commercial Dance', value: 'commercial' },
        { id: 'kpop', label: 'K-Pop', value: 'kpop' },
        { id: 'bollywood', label: 'Bollywood', value: 'bollywood' },
        { id: 'folk', label: 'Halk Oyunları', value: 'folk' },
        { id: 'sirtaki', label: 'Sirtaki', value: 'sirtaki' },
        { id: 'zeybek', label: 'Zeybek', value: 'zeybek' },
        { id: 'horon', label: 'Horon', value: 'horon' },
        { id: 'halay', label: 'Halay', value: 'halay' },
        { id: 'roman', label: 'Roman Havası', value: 'roman' },
        { id: 'pole', label: 'Pole Dance', value: 'pole' },
        { id: 'aerial', label: 'Aerial Dance', value: 'aerial' },
        { id: 'tap', label: 'Tap Dance', value: 'tap' },
        { id: 'irish', label: 'Irish Dance', value: 'irish' },
        { id: 'flamenco', label: 'Flamenco', value: 'flamenco' },
        { id: 'vals', label: 'Vals', value: 'vals' }
      ];
      setDanceStyles(defaultStyles);
    } finally {
      setLoadingStyles(false);
    }
  }, [danceStyles.length]);

  useEffect(() => {
    fetchDanceStyles();
  }, [fetchDanceStyles]);

  useEffect(() => {
    const fetchInstructorProfile = async () => {
      if (!user?.id) {
        setInitialLoading(false);
        setFetchError('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        navigate('/');
        return;
      }

      try {
        setInitialLoading(true);
        setFetchError(null);

        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setFetchError('Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.');
          navigate('/');
          return;
        }

        const userData = userSnap.data();
        const instructorRef = doc(db, 'instructors', user.id);
        const instructorSnap = await getDoc(instructorRef);

        if (instructorSnap.exists()) {
          const instructorData = instructorSnap.data();
          const formData = {
            displayName: instructorData.displayName || userData.displayName || '',
            bio: instructorData.bio || '',
            specialties: instructorData.specialties || [],
            experience: instructorData.experience || '',
            phoneNumber: instructorData.phoneNumber || '',
            countryCode: instructorData.countryCode || '+90',
            location: instructorData.location || '',
            photoURL: instructorData.photoURL || userData.photoURL || '',
            gender: userData.gender || '',
            age: userData.age,
            level: userData.level || 'beginner',
            city: userData.city || '',
            height: userData.height,
            weight: userData.weight,
            danceStyles: userData.danceStyles || [],
            availableTimes: userData.availableTimes || [],
            instagram: instructorData.instagram || '',
            youtube: instructorData.youtube || '',
            twitter: instructorData.twitter || '',
            isPartnerSearchActive: userData.isPartnerSearchActive === true,
            createdAt: instructorData.createdAt || '',
            updatedAt: instructorData.updatedAt || '',
            isActive: instructorData.isActive || true,
            role: userData.role || 'instructor',
            userId: user.id
          };

          reset(formData);
          setSelectedSpecialties(formData.specialties);
          setProfilePhotoURL(formData.photoURL);
        } else {
          const newInstructorData: Partial<InstructorProfileFormData> = {
            displayName: userData.displayName || '',
            bio: '',
            specialties: [],
            experience: '',
            phoneNumber: '',
            countryCode: '+90',
            location: '',
            photoURL: userData.photoURL || '',
            gender: userData.gender || '',
            age: userData.age || undefined,
            level: userData.level || 'beginner' as DanceLevel,
            city: userData.city || '',
            height: userData.height || undefined,
            weight: userData.weight || undefined,
            danceStyles: userData.danceStyles || [],
            availableTimes: userData.availableTimes || [],
            instagram: '',
            youtube: '',
            twitter: '',
            isPartnerSearchActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            role: 'instructor',
            userId: user.id
          };

          try {
            await setDoc(instructorRef, newInstructorData);
            reset(newInstructorData as InstructorProfileFormData);
            setSelectedSpecialties([]);
            setProfilePhotoURL(userData.photoURL || '');
            await updateDoc(userRef, {
              role: 'instructor',
              updatedAt: new Date().toISOString()
            });
          } catch (error) {
            toast.error('Eğitmen profili oluşturulurken bir hata oluştu');
            throw error;
          }
        }
      } catch (error) {
        setFetchError('Profil bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        toast.error('Profil bilgileri yüklenirken bir hata oluştu');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInstructorProfile();
  }, [user, reset, setValue, navigate]);

  const onSubmit = async (data: InstructorProfileFormData) => {
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    setLoading(true);
    setSaveSuccess(false);

    try {
      const updateTimestamp = new Date().toISOString();

      const instructorUpdates = {
        displayName: data.displayName.trim(),
        bio: data.bio.trim(),
        specialties: data.danceStyles || [],
        experience: data.experience.trim(),
        phoneNumber: data.phoneNumber.replace(/\s/g, ''),
        countryCode: data.countryCode,
        location: data.location.trim(),
        instagram: data.instagram?.trim() || '',
        youtube: data.youtube?.trim() || '',
        twitter: data.twitter?.trim() || '',
        updatedAt: updateTimestamp,
        isActive: true,
        role: 'instructor'
      };

      const userUpdates = {
        displayName: data.displayName.trim(),
        gender: data.gender || 'Belirtilmemiş',
        age: typeof data.age === 'number' ? data.age : 0,
        level: data.level || 'beginner',
        city: data.city || 'Belirtilmemiş',
        height: typeof data.height === 'number' ? data.height : 0,
        weight: typeof data.weight === 'number' ? data.weight : 0,
        danceStyles: data.danceStyles || [],
        availableTimes: data.availableTimes || [],
        isPartnerSearchActive: data.isPartnerSearchActive === true,
        role: 'instructor',
        updatedAt: updateTimestamp
      };

      const instructorRef = doc(db, 'instructors', user.id);
      const userRef = doc(db, 'users', user.id);

      const batch = writeBatch(db);
      batch.update(instructorRef, instructorUpdates);
      batch.update(userRef, userUpdates);

      await batch.commit();

      setSaveSuccess(true);
      toast.success('Profil başarıyla güncellendi');

      const [instructorSnap, userSnap] = await Promise.all([
        getDoc(instructorRef),
        getDoc(userRef)
      ]);

      if (instructorSnap.exists() && userSnap.exists()) {
        const updatedData = {
          ...instructorSnap.data(),
          ...userSnap.data()
        };
        reset({ ...data, ...updatedData });
      }

      setTimeout(() => setSaveSuccess(false), 2000);

    } catch (error: any) {
      if (error.code === 'permission-denied') {
        toast.error('Bu işlem için yetkiniz bulunmuyor');
      } else if (error.code === 'invalid-argument') {
        toast.error('Geçersiz veri formatı');
      } else if (error.code === 'not-found') {
        toast.error('Profil bulunamadı');
      } else {
        toast.error('Profil güncellenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadComplete = async (base64Image: string | null) => {
    if (!user?.id || !base64Image) return;

    try {
      setProfilePhotoURL(base64Image);
      setValue('photoURL', base64Image);

      const batch = writeBatch(db);
      const instructorRef = doc(db, 'instructors', user.id);
      const userRef = doc(db, 'users', user.id);

      const updateTimestamp = new Date().toISOString();
      const sharedUpdates = { photoURL: base64Image, updatedAt: updateTimestamp };

      batch.update(instructorRef, sharedUpdates);
      batch.update(userRef, sharedUpdates);
      await batch.commit();

      toast.success('Profil fotoğrafı güncellendi');
    } catch (error: any) {
      setProfilePhotoURL(user.photoURL || '');
      setValue('photoURL', user.photoURL || '');
      toast.error('Profil fotoğrafı güncellenirken bir hata oluştu');
    }
  };

  const handleDanceStylesChange = (value: string | string[]) => {
    const styles = Array.isArray(value) ? value : [value];
    const filteredStyles = value === '' ? [] : styles.filter(style => style !== '');
    setValue('danceStyles', filteredStyles);
    setSelectedSpecialties(filteredStyles);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-instructor"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 mb-4">⚠️</div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-md text-instructor border-instructor hover:bg-instructor/5">
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24">
      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Eğitmen Profili</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{isDirty ? 'Kaydedilmemiş değişiklikleriniz var.' : 'Tüm değişiklikler güncel.'}</p>
          </div>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading || !isDirty}
            className={`inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
              ${loading || !isDirty
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                : 'bg-instructor text-white hover:bg-instructor-dark hover:shadow-md active:scale-95'}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kaydediliyor...
              </>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-6">

            {/* Profile Avatar & Quick Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col items-center relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-instructor/20 to-instructor/5 dark:from-instructor/10 dark:to-transparent"></div>

              <div className="relative z-10 w-full flex flex-col items-center pt-4">
                <ImageUploader
                  currentPhotoURL={profilePhotoURL}
                  onImageChange={handleImageUploadComplete}
                  displayName={watchDisplayName || 'Eğitmen'}
                  userType="instructor"
                  shape="circle"
                  width={140}
                  height={140}
                />

                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {watchDisplayName || 'İsimsiz Eğitmen'}
                  </h2>
                  <p className="text-sm font-medium text-instructor mt-1">
                    Dans Eğitmeni
                  </p>
                </div>
              </div>
            </div>

            {/* Password Change Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6">
              <ChangePasswordForm colorVariant="instructor" />
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            <form className="space-y-6">

              {/* General Basics Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-instructor" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Genel Kimlik
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Kullanıcıların göreceği temel kişisel ve iletişim bilgileriniz.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <CustomInput
                      name="displayName"
                      label="Adınız Soyadınız"
                      value={watch('displayName')}
                      onChange={(e) => setValue('displayName', e.target.value)}
                      required
                      colorVariant="instructor"
                    />
                  </div>
                  <CustomSelect
                    name="gender"
                    label="Cinsiyet"
                    value={watch('gender')}
                    onChange={(value: string | string[]) => setValue('gender', value as string)}
                    options={[
                      { value: 'male', label: 'Erkek' },
                      { value: 'female', label: 'Kadın' },
                      { value: 'other', label: 'Diğer' }
                    ]}
                    required
                    colorVariant="instructor"
                  />
                  <CustomInput
                    type="number"
                    name="age"
                    label="Yaş"
                    value={watch('age')?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setValue('age', value);
                    }}
                    colorVariant="instructor"
                  />
                  <CustomInput
                    name="city"
                    label="Şehir"
                    value={watch('city')}
                    onChange={(e) => setValue('city', e.target.value)}
                    required
                    placeholder="Örn: İstanbul, Ankara"
                    colorVariant="instructor"
                  />
                  <CustomPhoneInput
                    name="phoneNumber"
                    label="Telefon Numarası"
                    countryCode={watch('countryCode')}
                    phoneNumber={watch('phoneNumber')}
                    onCountryCodeChange={(value) => setValue('countryCode', value)}
                    onPhoneNumberChange={(value) => setValue('phoneNumber', value)}
                  />
                </div>
              </div>

              {/* Instructor Career & Dance Info */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-instructor" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Eğitmen & Dans Bilgileri
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Branşınız, deneyiminiz ve dans pratiklerinizi tanıtan alan.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    {loadingStyles ? (
                      <div className="animate-pulse h-12 bg-gray-100 dark:bg-slate-700 rounded-xl"></div>
                    ) : (
                      <CustomSelect
                        name="danceStyles"
                        label="Dans Stilleri ve Uzmanlık Alanları"
                        value={watch('danceStyles')}
                        onChange={handleDanceStylesChange}
                        options={danceStyles}
                        multiple={true}
                        required
                        colorVariant="instructor"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomSelect
                      name="level"
                      label="Dans Seviyesi"
                      value={watch('level')}
                      onChange={(value: string | string[]) => setValue('level', value as DanceLevel)}
                      options={[
                        { value: 'beginner', label: 'Başlangıç' },
                        { value: 'intermediate', label: 'Orta Seviye' },
                        { value: 'advanced', label: 'İleri Seviye' },
                        { value: 'professional', label: 'Profesyonel' }
                      ]}
                      required
                      colorVariant="instructor"
                    />
                    <CustomInput
                      name="experience"
                      label="Beden Eğitimi / Dans Deneyimi"
                      value={watch('experience')}
                      onChange={(e) => setValue('experience', e.target.value)}
                      placeholder="Örn: 5 yıl profesyonel sahne"
                      colorVariant="instructor"
                    />
                  </div>

                  <CustomInput
                    name="bio"
                    label="Biyografi / Hakkında"
                    value={watch('bio')}
                    onChange={(e) => setValue('bio', e.target.value)}
                    multiline
                    rows={4}
                    placeholder="Öğrencileriniz için kısa bir tanıtım yazısı..."
                    colorVariant="instructor"
                  />

                  <CustomInput
                    name="location"
                    label="Ağırlıklı Ders Lokasyonu"
                    value={watch('location')}
                    onChange={(e) => setValue('location', e.target.value)}
                    placeholder="Örn: Mecidiyeköy Mah., Şişli"
                    colorVariant="instructor"
                  />

                </div>
              </div>

              {/* Social Media Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-instructor" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Sosyal Medya Bağlantıları
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Öğrencilerin daha fazla içerik ve referans görebilmesi için ağlarınızı paylaşın.
                  </p>
                </div>

                <div className="space-y-6">
                  <CustomInput
                    name="instagram"
                    label="Instagram Kullanıcı Adı"
                    value={watch('instagram') || ''}
                    onChange={(e) => setValue('instagram', e.target.value)}
                    placeholder="Örn: john_doe"
                    colorVariant="instructor"
                    startIcon={
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z" />
                      </svg>
                    }
                  />
                  <CustomInput
                    name="youtube"
                    label="YouTube Kanal Linki"
                    value={watch('youtube') || ''}
                    onChange={(e) => setValue('youtube', e.target.value)}
                    placeholder="https://youtube.com/@kanaliniz"
                    colorVariant="instructor"
                    startIcon={
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    }
                  />
                  <CustomInput
                    name="twitter"
                    label="Twitter / X Kullanıcı Adı"
                    value={watch('twitter') || ''}
                    onChange={(e) => setValue('twitter', e.target.value)}
                    placeholder="Örn: john_doe"
                    colorVariant="instructor"
                    startIcon={
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Partner Search Visibility Toggle */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-instructor" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Dans Partneri Arama
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Bu seçeneği açtığınızda, diğer eğitmenler sizi <strong>&ldquo;Partner Bul&rdquo;</strong> bölümünde partner adayı olarak görebilir.
                      Kapalıyken listelerden gizlenirsiniz.
                    </p>
                    {watch('isPartnerSearchActive') ? (
                      <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Partner listesinde görünüyorsunuz
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Partner listesinde gizlisiniz
                      </span>
                    )}
                  </div>

                  {/* Animated Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!watch('isPartnerSearchActive')}
                    onClick={() => setValue('isPartnerSearchActive', !watch('isPartnerSearchActive'), { shouldDirty: true })}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-instructor focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${watch('isPartnerSearchActive')
                        ? 'bg-instructor'
                        : 'bg-gray-200 dark:bg-slate-600'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${watch('isPartnerSearchActive') ? 'translate-x-7' : 'translate-x-0.5'
                        }`}
                    />
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileForm;
