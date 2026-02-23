import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateUserProfile } from '../../api/services/userService';
import { DanceStyle, User, UserRole } from '../../types';
import { db } from '../../api/firebase/firebase';
import CustomInput from '../../common/components/ui/CustomInput';
import CustomSelect from '../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../common/components/ui/ImageUploader';
import { writeBatch, doc } from 'firebase/firestore';
import { eventBus, EVENTS } from '../../common/utils/eventBus';
import AgeInput from '../../common/components/ui/AgeInput';
import CitySelect from '../../common/components/ui/CitySelect';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import DanceStyleSelect from '../../common/components/ui/DanceStyleSelect';
import AvailableTimesSelect from '../../common/components/ui/AvailableTimesSelect';
import ChangePasswordForm from '../../features/shared/components/profile/ChangePasswordForm';

interface ProfileEditorProps {
  user: User | null;
  onUpdate: (updatedUser: User) => void;
}

interface FormData {
  displayName: string;
  gender: string;
  age: number | undefined;
  city: string;
  phoneNumber: string;
  height?: number;
  weight?: number;
  photoURL?: string;
  danceStyles: DanceStyle[];
  availableTimes: string[];
  isPartnerSearchActive?: boolean;
  role?: UserRole;
}

// Yeniden kullanılabilir şeffaflık tooltip bileşeni
const WhyTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="ml-1.5 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        aria-label="Neden soruyoruz?"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Neden soruyoruz?
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {text}
          <div className="absolute top-full left-4 -translate-y-px w-2 h-2 rotate-45 bg-white dark:bg-slate-800 border-r border-b border-gray-200 dark:border-slate-700" />
        </div>
      )}
    </div>
  );
};

const ProfilePage: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserProfile: updateAuthProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [formData, setFormData] = useState<FormData>({
    displayName: user?.displayName || '',
    gender: user?.gender || '',
    age: user?.age,
    city: user?.city || '',
    phoneNumber: user?.phoneNumber || '',
    height: user?.height,
    weight: user?.weight,
    photoURL: user?.photoURL,
    danceStyles: user?.danceStyles || [],
    availableTimes: user?.availableTimes || [],
    isPartnerSearchActive: (user as any)?.isPartnerSearchActive !== false,
    role: user?.role,
  });

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: location } });
  }, [user, navigate, location]);

  const markDirty = () => setIsDirty(true);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    setFormData(prev => ({ ...prev, [(e as any).target.name]: (e as any).target.value }));
    markDirty();
  };

  const handleDanceStyleChange = (selectedStyles: DanceStyle[]) => {
    setFormData(prev => ({ ...prev, danceStyles: selectedStyles }));
    markDirty();
  };

  const handleTimeChange = (selectedTimes: string[]) => {
    setFormData(prev => ({ ...prev, availableTimes: selectedTimes }));
    markDirty();
  };

  const handlePhotoUploadSuccess = async (base64Image: string | null) => {
    if (!base64Image || !user) return;
    try {
      setFormData(prev => ({ ...prev, photoURL: base64Image }));
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.id);
      const updates = { photoURL: base64Image, updatedAt: new Date() };
      batch.update(userRef, updates);
      await batch.commit();
      onUpdate({ ...user, ...updates });
      eventBus.emit(EVENTS.PROFILE_PHOTO_UPDATED);
      toast.success('Profil fotoğrafı güncellendi!');
    } catch {
      setFormData(prev => ({ ...prev, photoURL: user.photoURL || '' }));
      toast.error('Fotoğraf yüklenirken bir hata oluştu.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.displayName.trim()) newErrors.displayName = 'İsim alanı zorunludur';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const { photoURL, ...profileData } = formData;
      const updatedUserData: Partial<User> = {
        ...profileData,
        isPartnerSearchActive: formData.isPartnerSearchActive,
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: new Date(),
      } as any;
      const updatedUser = await updateUserProfile(user.id, updatedUserData);
      onUpdate(updatedUser);
      await updateAuthProfile(formData.displayName);
      setIsDirty(false);
      toast.success('Profiliniz başarıyla güncellendi!');
      eventBus.emit(EVENTS.PROFILE_UPDATED, updatedUser);
      setTimeout(() => navigate('/'), 1000);
    } catch {
      toast.error('Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const partnerActive = !!formData.isPartnerSearchActive;
  const studentColor = '#9f1239';
  const studentBg = 'rgba(159,18,57,0.1)';

  return (
    <div className="relative min-h-screen pb-28">

      {/* ── Sticky Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Öğrenci Profili</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDirty ? '⚠️ Kaydedilmemiş değişiklikleriniz var.' : 'Tüm değişiklikler güncel.'}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isDirty}
            className={`inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
              ${isSubmitting || !isDirty
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                : 'text-white hover:opacity-90 hover:shadow-md active:scale-95'}`}
            style={!isSubmitting && isDirty ? { backgroundColor: studentColor } : {}}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Kaydediliyor...
              </>
            ) : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Avatar Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[#9f1239]/15 to-[#9f1239]/5 dark:from-[#9f1239]/10 dark:to-transparent" />
              <div className="relative z-10 w-full flex flex-col items-center pt-4">
                <ImageUploader
                  currentPhotoURL={formData.photoURL}
                  onImageChange={handlePhotoUploadSuccess}
                  displayName={formData.displayName || user?.displayName || 'Öğrenci'}
                  userType="student"
                  shape="circle"
                  width={140}
                  height={140}
                />
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {formData.displayName || 'İsimsiz Öğrenci'}
                  </h2>
                  <p className="text-sm font-medium mt-1" style={{ color: studentColor }}>Dans Öğrencisi</p>
                  {formData.city && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {formData.city}
                    </p>
                  )}
                  {formData.danceStyles.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                      {formData.danceStyles.slice(0, 3).map(style => (
                        <span key={style} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: studentBg, color: studentColor }}>
                          {style}
                        </span>
                      ))}
                      {formData.danceStyles.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                          +{formData.danceStyles.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Partner durumu mini badge */}
                <div className={`mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${partnerActive
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                    : 'bg-gray-50 dark:bg-slate-700/50 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${partnerActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-slate-500'}`} />
                  {partnerActive ? 'Partner aramada görünüyor' : 'Partner aramada gizli'}
                </div>
              </div>
            </div>

            {/* Şifre Kartı */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6">
              <ChangePasswordForm colorVariant="default" />
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ────────────────── KART 1: Hesap & İletişim ────────────────── */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: studentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Hesap Bilgileri
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Adınız profilinizde ve kurslarda görünür.
                  </p>
                </div>
                <div className="space-y-5">
                  <CustomInput
                    name="displayName"
                    label="Adınız Soyadınız"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    error={!!errors.displayName}
                    helperText={errors.displayName}
                    colorVariant="student"
                  />
                  <CustomPhoneInput
                    name="phoneNumber"
                    label="Telefon Numarası (İsteğe Bağlı)"
                    countryCode="+90"
                    phoneNumber={formData.phoneNumber}
                    onPhoneNumberChange={(value: string) =>
                      handleInputChange({ target: { name: 'phoneNumber', value } })
                    }
                    onCountryCodeChange={() => { }}
                  />
                </div>
              </div>

              {/* ────────────────── KART 2: Dans Tercihlerim ────────────────── */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: studentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Dans Tercihlerim
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    İlgilendiğiniz stiller size özel kurs ve eğitmen önerilerinde kullanılır.
                  </p>
                </div>
                <div className="space-y-5">
                  <DanceStyleSelect value={formData.danceStyles} onChange={handleDanceStyleChange} />
                  <AvailableTimesSelect value={formData.availableTimes} onChange={handleTimeChange} />
                </div>
              </div>

              {/* ────────────────── KART 3: Eşleşme Profili ────────────────── */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">

                {/* Kart başlığı + toggle */}
                <div className="px-6 py-5 lg:px-8 border-b border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: studentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Eşleşme Profili
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Bu bilgiler hem kurs dengeleme hem de dans partneri eşleştirmesi için kullanılır.
                        Partner aramada görünmek istemiyorsanız kapatabilirsiniz.
                      </p>
                    </div>

                    {/* Toggle */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={partnerActive}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, isPartnerSearchActive: !prev.isPartnerSearchActive }));
                          markDirty();
                        }}
                        className={`relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${partnerActive ? '' : 'bg-gray-200 dark:bg-slate-600'
                          }`}
                        style={partnerActive ? { backgroundColor: studentColor } : {}}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${partnerActive ? 'translate-x-7' : 'translate-x-0.5'
                          }`} />
                      </button>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500">
                        Partner Arama
                      </span>
                    </div>
                  </div>

                  {/* Durum pill */}
                  {partnerActive ? (
                    <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Partner listesinde görünüyorsunuz
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Partner listesinde gizlisiniz · Kurs dengesi için bilgiler hâlâ kullanılır
                    </span>
                  )}
                </div>

                {/* Alanlar */}
                <div className={`px-6 py-6 lg:px-8 space-y-5 transition-opacity duration-200 ${partnerActive ? 'opacity-100' : 'opacity-50'}`}>

                  {/* Cinsiyet */}
                  <div>
                    <div className="flex items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cinsiyet</span>
                      <WhyTooltip text="Kurslarımızda kadın/erkek katılım dengesini korumak ve partner eşleştirmesini doğru yapmak için bu bilgiyi alıyoruz. Kursa ilk kaydolduğunuzda da sorulabilir." />
                    </div>
                    <CustomSelect
                      name="gender"
                      label="Cinsiyet"
                      value={formData.gender}
                      onChange={(value: string | string[]) =>
                        handleInputChange({ target: { name: 'gender', value: value as string } })
                      }
                      options={[
                        { value: 'male', label: 'Erkek' },
                        { value: 'female', label: 'Kadın' },
                        { value: 'other', label: 'Belirtmek istemiyorum' },
                      ]}
                      error={errors.gender ? 'error' : ''}
                      colorVariant="student"
                    />
                  </div>

                  {/* Yaş + Şehir yan yana */}
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-1.5">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Yaş</span>
                        <WhyTooltip text="Yaşınızı girdiğinizde dans deneyim seviyenize yakın partnerlerle eşleştirilebilirsiniz. Girmezseniz yaş filtresinden etkilenmezsiniz." />
                      </div>
                      <AgeInput
                        value={formData.age}
                        onChange={(value: number | undefined) =>
                          handleInputChange({ target: { name: 'age', value } })
                        }
                        error={!!errors.age}
                        helperText={errors.age}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1.5">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Şehir</span>
                        <WhyTooltip text="Yaşadığınız şehre göre yakın dans etkinlikleri ve partnerler önerilir. Girmezseniz şehir filtresinden etkilenmezsiniz." />
                      </div>
                      <CitySelect
                        value={formData.city}
                        onChange={(value: string) =>
                          handleInputChange({ target: { name: 'city', value } })
                        }
                        error={!!errors.city}
                        helperText={errors.city}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* ────────────────── KART 4: Fiziksel Özellikler ────────────────── */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 lg:p-8">
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: studentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Fiziksel Özellikler
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-xs font-normal">
                          İsteğe Bağlı
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Daha uyumlu partner eşleştirmeleri için kullanılır.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    type="number"
                    name="height"
                    label="Boy (cm)"
                    value={formData.height?.toString() || ''}
                    onChange={(e) => {
                      const value = (e as any).target.value ? parseInt((e as any).target.value) : undefined;
                      handleInputChange({ target: { name: 'height', value } });
                    }}
                    placeholder="Örn: 175"
                    colorVariant="student"
                  />
                  <CustomInput
                    type="number"
                    name="weight"
                    label="Kilo (kg)"
                    value={formData.weight?.toString() || ''}
                    onChange={(e) => {
                      const value = (e as any).target.value ? parseInt((e as any).target.value) : undefined;
                      handleInputChange({ target: { name: 'weight', value } });
                    }}
                    placeholder="Örn: 70"
                    colorVariant="student"
                  />
                </div>

                {/* KVKK güvence notu */}
                <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'rgba(159,18,57,0.04)', borderColor: 'rgba(159,18,57,0.15)' }}>
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: studentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: '#7f1d1d' }}>
                    Boy ve kilo bilgileri <strong>asla public profilinizde gösterilmez.</strong>{' '}
                    Yalnızca eşleşme algoritmasında kullanılır; eşleştirildiğiniz partner bunları görmez.
                  </p>
                </div>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;