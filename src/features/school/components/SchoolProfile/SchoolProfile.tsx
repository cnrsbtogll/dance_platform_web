import React, { useState, useEffect, ChangeEvent } from 'react';
import { School } from '../../../../types';
import Button from '../../../../common/components/ui/Button';
import CustomInput from '../../../../common/components/ui/CustomInput';
import SimpleModal from '../../../../common/components/ui/SimpleModal';
import ChangePasswordForm from '../../../shared/components/profile/ChangePasswordForm';

interface SchoolProfileProps {
  school: School;
  className?: string;
  variant?: 'row' | 'card';
  onUpdate?: (updatedSchool: Partial<School>) => Promise<void>;
}

export const SchoolProfile: React.FC<SchoolProfileProps> = ({
  school,
  className = '',
  variant = 'row',
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchool, setEditedSchool] = useState<School>(school);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditedSchool(school);
  }, [school]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
    setEditedSchool(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      console.log('Updated school:', updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onUpdate) {
        const updateData = {
          displayName: editedSchool.displayName || '',
          phoneNumber: editedSchool.phoneNumber || '',
          address: editedSchool.address || '',
          city: editedSchool.city || '',
          iban: editedSchool.iban || '',
          recipientName: editedSchool.recipientName || ''
        };
        await onUpdate(updateData);
        setSuccess('Okul bilgileri başarıyla güncellendi.');
        setIsEditing(false);
      }
    } catch (err) {
      setError('Güncelleme sırasında bir hata oluştu.');
      console.error('Error in handleSave:', err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'row') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="text-sm text-gray-900 dark:text-white">
          {school.displayName || '-'}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Okul Profili</h2>
        {!isEditing && (
          <Button
            variant="school"
            onClick={() => {
              setEditedSchool(school);
              setIsEditing(true);
            }}
          >
            Bilgileri Düzenle
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Read-only View */}
        <div className="bg-white dark:bg-[#231810] p-6 rounded-xl border border-gray-100 dark:border-[#493322] shadow-sm space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#493322] pb-2">Genel Bilgiler</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Okul Adı</label>
              <p className="text-gray-900 dark:text-white font-medium">{school.displayName || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">E-posta</label>
              <p className="text-gray-900 dark:text-white">{school.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Telefon</label>
              <p className="text-gray-900 dark:text-white">{school.phoneNumber || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#231810] p-6 rounded-xl border border-gray-100 dark:border-[#493322] shadow-sm space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#493322] pb-2">Konum ve Ödeme</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Şehir</label>
              <p className="text-gray-900 dark:text-white">{school.city || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Adres</label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{school.address || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Alıcı Ad Soyad</label>
              <p className="text-gray-900 dark:text-white">{school.recipientName || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">IBAN</label>
              <p className="text-gray-900 dark:text-white font-mono text-sm">{school.iban || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ChangePasswordForm colorVariant="school" />
      </div>

      {/* Edit Modal */}
      <SimpleModal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        title="Okul Bilgilerini Düzenle"
        colorVariant="school"
        bodyClassName="bg-orange-50/30 dark:bg-[#1a120b]"
        actions={
          <div className="flex justify-end space-x-3 w-full">
            <Button
              variant="outlined"
              onClick={() => {
                setIsEditing(false);
                setEditedSchool(school);
                setError(null);
              }}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              variant="school"
              onClick={handleSave}
              loading={loading}
            >
              Değişiklikleri Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-6 p-1">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="Okul Adı"
              name="displayName"
              value={editedSchool.displayName}
              onChange={handleInputChange}
              required
              colorVariant="school"
            />
            <CustomInput
              label="E-posta"
              name="email"
              type="email"
              value={school.email}
              onChange={() => { }}
              disabled={true}
              colorVariant="school"
            />
            <CustomInput
              label="Telefon"
              name="phoneNumber"
              value={editedSchool.phoneNumber || ''}
              onChange={handleInputChange}
              colorVariant="school"
            />
            <CustomInput
              label="Şehir"
              name="city"
              value={editedSchool.city || ''}
              onChange={handleInputChange}
              colorVariant="school"
            />
            <div className="md:col-span-2">
              <CustomInput
                label="Adres"
                name="address"
                value={editedSchool.address || ''}
                onChange={handleInputChange}
                multiline
                rows={2}
                colorVariant="school"
              />
            </div>
            <CustomInput
              label="Alıcı Ad Soyad"
              name="recipientName"
              value={editedSchool.recipientName || ''}
              onChange={handleInputChange}
              colorVariant="school"
            />
            <CustomInput
              label="IBAN"
              name="iban"
              value={editedSchool.iban || ''}
              onChange={handleInputChange}
              colorVariant="school"
            />
          </div>
        </div>
      </SimpleModal>
    </div>
  );
};

export default SchoolProfile;