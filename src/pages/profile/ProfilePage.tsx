import React, { useEffect, useState, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateUserProfile } from '../../api/services/userService';
import { DanceStyle, User, UserRole } from '../../types';
import { db } from '../../api/firebase/firebase';
import CustomInput from '../../common/components/ui/CustomInput';
import CustomSelect from '../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../common/components/ui/CustomPhoneInput';
import Button from '../../common/components/ui/Button';
import ImageUploader from '../../common/components/ui/ImageUploader';
import { writeBatch, doc } from 'firebase/firestore';
import { eventBus, EVENTS } from '../../common/utils/eventBus';
import AgeInput from '../../common/components/ui/AgeInput';
import CitySelect from '../../common/components/ui/CitySelect';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import DanceStyleSelect from '../../common/components/ui/DanceStyleSelect';
import AvailableTimesSelect from '../../common/components/ui/AvailableTimesSelect';

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
  role?: UserRole;
}

const ProfilePage: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserProfile: updateAuthProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    role: user?.role
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    setFormData(prev => ({
      ...prev,
      [(e as any).target.name]: (e as any).target.value
    }));
  };

  const handleDanceStyleChange = (selectedStyles: DanceStyle[]) => {
    setFormData(prev => ({
      ...prev,
      danceStyles: selectedStyles
    }));
  };

  const handleTimeChange = (selectedTimes: string[]) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: selectedTimes
    }));
  };

  const handlePhotoUploadSuccess = async (base64Image: string | null) => {
    if (!base64Image || !user) return;

    try {
      // UI state'ini güncelle
      setFormData(prev => ({
        ...prev,
        photoURL: base64Image
      }));

      // Firebase'e kaydet
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.id);

      const updateTimestamp = new Date();
      const updates = {
        photoURL: base64Image,
        updatedAt: updateTimestamp
      };

      batch.update(userRef, updates);
      await batch.commit();

      // Parent component'i bilgilendir
      onUpdate({
        ...user,
        ...updates
      });

      // Navbar'ı bilgilendir
      eventBus.emit(EVENTS.PROFILE_PHOTO_UPDATED);

      console.log('✅ Profil fotoğrafı güncellendi:', {
        firestore: 'Base64 image saved to Firestore'
      });

      // Show success toast
      toast.success('Profil fotoğrafı güncellendi!', {
        duration: 2000,
        position: 'top-center',
        icon: '✅',
      });
    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      // Hata durumunda UI'ı eski haline getir
      setFormData(prev => ({
        ...prev,
        photoURL: user.photoURL || ''
      }));

      // Show error toast
      toast.error('Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.', {
        duration: 3000,
        position: 'top-center',
        icon: '❌',
      });
    }
  };

  const handlePhotoUploadError = (error: Error) => {
    console.error('Photo upload failed:', error);
    // TODO: Show error message to user
  };

  const validateBasicInfo = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'İsim alanı zorunludur';
    }

    if (!formData.gender) {
      newErrors.gender = 'Cinsiyet seçimi zorunludur';
    }

    if (!formData.age) {
      newErrors.age = 'Yaş alanı zorunludur';
    }

    if (!formData.city) {
      newErrors.city = 'Şehir seçimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateBasicInfo()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateBasicInfo()) {
      setStep(1); // Eğer hatalar varsa ilk adıma dön
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare user data without photo URL for Firebase Auth
      const { photoURL, ...profileData } = formData;
      
      const updatedUserData: Partial<User> = {
        ...profileData,
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: new Date()
      };

      // Update user profile in Firestore
      const updatedUser = await updateUserProfile(user.id, updatedUserData);
      onUpdate(updatedUser);
      
      // Update auth context with only display name
      await updateAuthProfile(formData.displayName);
      
      // Başarılı mesajı göster
      toast.success('Profiliniz başarıyla güncellendi!', {
        duration: 3000,
        position: 'top-center',
        icon: '✅',
      });

      // Navbar'ı güncelle
      eventBus.emit(EVENTS.PROFILE_UPDATED, updatedUser);

      // 1 saniye bekleyip anasayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', {
        duration: 4000,
        position: 'top-center',
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Temel bilgiler formu
  const renderBasicInfoForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Temel Bilgiler (Zorunlu)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Bu bilgiler dans partnerinizle eşleşmeniz için gereklidir.
        </p>
      </div>
      
      <ImageUploader
        currentPhotoURL={formData.photoURL}
        onImageChange={handlePhotoUploadSuccess}
        displayName={user?.displayName || ''}
        userType="student"
        shape="circle"
        width={150}
        height={150}
      />
      
      <div>
        <CustomInput
          name="displayName"
          label="Adınız Soyadınız"
          value={formData.displayName}
          onChange={handleInputChange}
          required
          error={!!errors.displayName}
          helperText={errors.displayName}
        />
      </div>
      
      <div>
        <CustomSelect
          name="gender"
          label="Cinsiyet"
          value={formData.gender}
          onChange={(value: string | string[]) => handleInputChange({ target: { name: 'gender', value: value as string } })}
          options={[
            { value: 'male', label: 'Erkek' },
            { value: 'female', label: 'Kadın' },
            { value: 'other', label: 'Diğer' }
          ]}
          required
          error={errors.gender ? 'error' : ''}
        />
      </div>
      
      <div>
        <AgeInput
          value={formData.age}
          onChange={(value: number | undefined) => handleInputChange({ target: { name: 'age', value } })}
          required
          error={!!errors.age}
          helperText={errors.age}
        />
      </div>
      
      <div>
        <CitySelect
          value={formData.city}
          onChange={(value: string) => handleInputChange({ target: { name: 'city', value } })}
          required
          error={!!errors.city}
          helperText={errors.city}
        />
      </div>
      
      <div>
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon Numarası (İsteğe Bağlı)"
          countryCode="+90"
          phoneNumber={formData.phoneNumber}
          onPhoneNumberChange={(value: string) => handleInputChange({ target: { name: 'phoneNumber', value } })}
          onCountryCodeChange={() => {}}
        />
      </div>

      <div>
        <DanceStyleSelect
          value={formData.danceStyles}
          onChange={handleDanceStyleChange}
        />
      </div>

      <div>
        <AvailableTimesSelect
          value={formData.availableTimes}
          onChange={handleTimeChange}
        />
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          variant="primary"
        >
          İleri
        </Button>
      </div>
    </div>
  );

  // Fiziksel özellikler formu
  const renderPhysicalAttributesForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fiziksel Özellikler (İsteğe Bağlı)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Bu bilgileri paylaşmak isteğe bağlıdır, ancak daha uyumlu partner eşleştirmeleri yapılmasına yardımcı olur.
        </p>
      </div>
      
      <div>
        <CustomInput
          type="text"
          name="height"
          label="Boy (cm)"
          value={formData.height?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            handleInputChange({ target: { name: 'height', value } });
          }}
          placeholder="Örn: 175"
        />
      </div>
      
      <div>
        <CustomInput
          type="text"
          name="weight"
          label="Kilo (kg)"
          value={formData.weight?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            handleInputChange({ target: { name: 'weight', value } });
          }}
          placeholder="Örn: 70"
        />
      </div>
      
      <div className="flex justify-between">
        <Button
          onClick={prevStep}
          variant="secondary"
        >
          Geri
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
        {step === 1 ? renderBasicInfoForm() : renderPhysicalAttributesForm()}
      </form>
    </>
  );
};

export default ProfilePage; 