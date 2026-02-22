import React, { useState } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { PriceInput } from '../../../common/components/ui/PriceInput';
import CustomPhoneInput from '../../../common/components/ui/CustomPhoneInput';
import CitySelect from '../../../common/components/ui/CitySelect';
import Button from '../../../common/components/ui/Button';
import { toast } from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';


interface TicketFormData {
  festivalName: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  countryCode: string;
  phoneNumber: string;
  instagramHandle: string;
}

interface FormErrors {
  festivalName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
  originalPrice?: string;
  discountedPrice?: string;
  contact?: string;
}

export const TicketSaleForm: React.FC = () => {
  const [formData, setFormData] = useState<TicketFormData>({
    festivalName: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    originalPrice: '',
    discountedPrice: '',
    countryCode: '+90', // Varsayılan olarak Türkiye
    phoneNumber: '',
    instagramHandle: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const navigate = useNavigate();
  const { currentUser } = useAuth();


  const calculateDiscount = () => {
    if (formData.originalPrice && formData.discountedPrice) {
      const original = parseFloat(formData.originalPrice);
      const discounted = parseFloat(formData.discountedPrice);
      if (original > 0) {
        return ((original - discounted) / original * 100).toFixed(1);
      }
    }
    return null;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.festivalName) {
      newErrors.festivalName = 'Festival adı zorunludur';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Başlangıç tarihi zorunludur';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Bitiş tarihi zorunludur';
    }

    if (!formData.location) {
      newErrors.location = 'Konum zorunludur';
    }

    if (!formData.originalPrice) {
      newErrors.originalPrice = 'Orijinal fiyat zorunludur';
    }

    if (!formData.discountedPrice) {
      newErrors.discountedPrice = 'İndirimli fiyat zorunludur';
    } else if (parseFloat(formData.discountedPrice) >= parseFloat(formData.originalPrice)) {
      newErrors.discountedPrice = 'İndirimli fiyat orijinal fiyattan düşük olmalıdır';
    }

    if (!formData.phoneNumber && !formData.instagramHandle) {
      newErrors.contact = 'Telefon numarası veya Instagram hesabı girilmelidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const ticketData = {
        festivalBilgileri: {
          festivalAdi: formData.festivalName,
          baslangicTarihi: formData.startDate,
          bitisTarihi: formData.endDate,
          konum: formData.location,
          aciklama: formData.description || 'Açıklama girilmedi'
        },
        fiyatBilgileri: {
          orijinalFiyat: formData.originalPrice + ' TL',
          indirimliFiyat: formData.discountedPrice + ' TL',
          indirimOrani: calculateDiscount() ? `%${calculateDiscount()}` : 'Hesaplanamadı'
        },
        iletisimBilgileri: {
          telefon: formData.phoneNumber ? `${formData.countryCode} ${formData.phoneNumber}` : 'Belirtilmedi',
          instagram: formData.instagramHandle ? `@${formData.instagramHandle.replace('@', '')}` : 'Belirtilmedi'
        },
        olusturulmaTarihi: serverTimestamp(),
        durum: 'aktif',
        sellerId: currentUser?.uid || 'unknown'
      };


      // Firebase'e kaydet
      await addDoc(collection(db, 'tickets'), ticketData);

      // Başarı mesajı göster
      toast.success('Bilet satış ilanınız başarıyla oluşturuldu!', {
        duration: 3000,
        position: 'top-center',
        icon: '🎫'
      });

      // Formu sıfırla
      setFormData({
        festivalName: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        originalPrice: '',
        discountedPrice: '',
        countryCode: '+90',
        phoneNumber: '',
        instagramHandle: '',
      });

      // Biletlerin listelendiği alana yönlendir
      setTimeout(() => {
        navigate('/festivals', { state: { showTickets: true } });
      }, 1000);

    } catch (error) {
      console.error('Form gönderimi sırasında hata:', error);
      toast.error('Bilet satış ilanı oluşturulurken bir hata oluştu.', {
        duration: 4000,
        position: 'top-center',
        icon: '❌'
      });
    }
  };

  const discount = calculateDiscount();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bilet Satış İlanı</h2>

      <div className="space-y-4">
        <TextField
          label="Festival Adı"
          value={formData.festivalName}
          onChange={(e) => setFormData({ ...formData, festivalName: e.target.value })}
          error={!!errors.festivalName}
          helperText={errors.festivalName}
          required
          fullWidth
          size="small"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            type="date"
            label="Başlangıç Tarihi"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            error={!!errors.startDate}
            helperText={errors.startDate}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            label="Bitiş Tarihi"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            error={!!errors.endDate}
            helperText={errors.endDate}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <CitySelect
          value={formData.location}
          onChange={(value: string) => setFormData({ ...formData, location: value })}
          error={!!errors.location}
          helperText={errors.location}
          required
        />

        <TextField
          label="Festival Açıklaması"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          multiline
          rows={3}
          fullWidth
          size="small"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PriceInput
            label="Orijinal Fiyat"
            value={formData.originalPrice}
            onChange={(value: string) => setFormData({ ...formData, originalPrice: value })}
            error={errors.originalPrice}
            required
          />

          <PriceInput
            label="İndirimli Fiyat"
            value={formData.discountedPrice}
            onChange={(value: string) => setFormData({ ...formData, discountedPrice: value })}
            error={errors.discountedPrice}
            required
          />
        </div>

        {discount && (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            İndirim Oranı: %{discount}
          </div>
        )}

        <div className="space-y-4">
          <CustomPhoneInput
            name="phone"
            label="Telefon Numarası"
            countryCode={formData.countryCode}
            phoneNumber={formData.phoneNumber}
            onCountryCodeChange={(value) => setFormData({ ...formData, countryCode: value })}
            onPhoneNumberChange={(value) => setFormData({ ...formData, phoneNumber: value })}
            error={!!errors.contact}
            helperText={errors.contact}
          />

          <TextField
            label="Instagram Kullanıcı Adı"
            value={formData.instagramHandle}
            onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
            placeholder="kullaniciadi"
            error={!!errors.contact}
            helperText={errors.contact}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">@</InputAdornment>
              ),
            }}
          />
        </div>
      </div>

      <Button type="submit" variant="primary" fullWidth>
        İlanı Yayınla
      </Button>
    </form>
  );
}; 