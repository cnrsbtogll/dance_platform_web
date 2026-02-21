import React, { useState, useEffect, ChangeEvent } from 'react';
import { School } from '../../../../types';
import { Button } from '@mui/material';
import CustomInput from '../../../../common/components/ui/CustomInput';

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
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {!isEditing ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsEditing(true)}
          >
            Düzenle
          </Button>
        ) : (
          <div className="space-x-2">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setIsEditing(false);
                setEditedSchool(school);
                setError(null);
                setSuccess(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
            >
              Kaydet
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <CustomInput
              label="Okul Adı"
              name="displayName"
              value={isEditing ? editedSchool.displayName : school.displayName}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
              fullWidth
              colorVariant="school"
            />
          </div>
          <div>
            <CustomInput
              label="E-posta"
              name="email"
              type="email"
              value={school.email}
              onChange={() => { }}
              disabled={true}
              required
              fullWidth
              colorVariant="school"
            />
          </div>
          <div>
            <CustomInput
              label="Telefon"
              name="phoneNumber"
              value={isEditing ? editedSchool.phoneNumber || '' : school.phoneNumber || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
              colorVariant="school"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <CustomInput
              label="Adres"
              name="address"
              value={isEditing ? editedSchool.address || '' : school.address || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
              colorVariant="school"
            />
          </div>
          <div>
            <CustomInput
              label="Şehir"
              name="city"
              value={isEditing ? editedSchool.city || '' : school.city || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
              colorVariant="school"
            />
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <div>
            <CustomInput
              label="IBAN"
              name="iban"
              value={isEditing ? editedSchool.iban || '' : school.iban || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
              colorVariant="school"
            />
          </div>
          <div>
            <CustomInput
              label="Alıcı Ad Soyad"
              name="recipientName"
              value={isEditing ? editedSchool.recipientName || '' : school.recipientName || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
              colorVariant="school"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolProfile; 