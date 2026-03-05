import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import CustomInput from '../../../common/components/ui/CustomInput';
import CustomPhoneInput from '../../../common/components/ui/CustomPhoneInput';
import FileUploader from '../../../common/components/ui/FileUploader';
import Button from '../../../common/components/ui/Button';
import ImageUploader from '../../../common/components/ui/ImageUploader';

interface SchoolInfo {
    id: string;
    displayName?: string;
    name?: string;
    email?: string;
    photoURL?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    description?: string;
    userId?: string;
    [key: string]: any;
}

interface Props {
    schoolInfo: SchoolInfo;
    onClose: () => void;
    onActivationRequested: () => void;
}

interface WizardData {
    // Adım 1 – Profil Tamamlama
    schoolName: string;
    description: string;
    contactPerson: string;
    contactPhone: string;
    address: string;
    photoURL: string;
    // Adım 2 – Belge Yükleme
    schoolDocument: string;
    schoolDocumentName: string;
}

const STEPS = [
    { id: 1, title: 'Profil Bilgileri', icon: '🏫' },
    { id: 2, title: 'Resmi Belge', icon: '📄' },
    { id: 3, title: 'Gönder', icon: '✅' }
];

export function SchoolActivationWizard({ schoolInfo, onClose, onActivationRequested }: Props) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof WizardData, string>>>({});
    const [data, setData] = useState<WizardData>({
        schoolName: schoolInfo.displayName || schoolInfo.name || '',
        description: schoolInfo.description || '',
        contactPerson: schoolInfo.contactPerson || '',
        contactPhone: schoolInfo.contactPhone || '',
        address: schoolInfo.address || '',
        photoURL: schoolInfo.photoURL || '',
        schoolDocument: '',
        schoolDocumentName: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof WizardData]) {
            setErrors(prev => { const u = { ...prev }; delete u[name as keyof WizardData]; return u; });
        }
    };

    const validateStep1 = (): boolean => {
        const e: Partial<Record<keyof WizardData, string>> = {};
        if (!data.schoolName.trim()) e.schoolName = 'Okul adı zorunlu';
        if (!data.contactPerson.trim()) e.contactPerson = 'Yetkili kişi adı zorunlu';
        const phone = data.contactPhone.replace(/\s/g, '');
        if (!phone) e.contactPhone = 'Telefon zorunlu';
        else if (phone.length !== 10) e.contactPhone = '10 rakam giriniz';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = (): boolean => {
        const e: Partial<Record<keyof WizardData, string>> = {};
        if (!data.schoolDocument) e.schoolDocument = 'Lütfen resmi belgenizi yükleyin';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const goNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(s => s + 1);
    };

    const goPrev = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // schoolRequests üzerindeki mevcut kaydı güncelle (yeni yazmıyoruz)
            // BecomeSchool kayıt sırasında zaten schoolRequests'e draft olarak eklendi
            const reqRef = doc(db, 'schoolRequests', schoolInfo.id);
            await updateDoc(reqRef, {
                schoolName: data.schoolName,
                schoolDescription: data.description,
                contactPerson: data.contactPerson,
                contactEmail: schoolInfo.contactEmail || schoolInfo.email || '',
                contactPhone: data.contactPhone,
                address: data.address,
                photoURL: data.photoURL || null,
                schoolDocument: data.schoolDocument,
                schoolDocumentName: data.schoolDocumentName,
                document_url: data.schoolDocument,
                document_name: data.schoolDocumentName,
                documentStatus: 'pending',   // Yönetici onayı bekliyor
                status: 'pending',           // draft → pending
                activationRequestedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            onActivationRequested();
        } catch (err) {
            console.error('Aktivasyon hatası:', err);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-school to-school-dark p-6 text-white shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Okulu Aktifleştir</h2>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Step Progress */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={`flex items-center gap-2 ${step >= s.id ? 'text-white' : 'text-white/40'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${step > s.id ? 'bg-white text-school border-white' :
                                            step === s.id ? 'bg-white/20 border-white' :
                                                'bg-transparent border-white/30'}`}>
                                        {step > s.id ? '✓' : s.id}
                                    </div>
                                    <span className="text-xs font-medium hidden sm:inline">{s.title}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 ${step > s.id ? 'bg-white' : 'bg-white/20'} transition-all`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {/* Adım 1: Profil Bilgileri */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Okul Profilini Tamamla</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Bu bilgiler okulunuzun herkese açık profilinde görünecektir.</p>
                                </div>

                                <CustomInput
                                    name="schoolName"
                                    label="Dans Okulu Adı"
                                    value={data.schoolName}
                                    onChange={handleChange}
                                    error={!!errors.schoolName}
                                    helperText={errors.schoolName}
                                    required
                                />

                                <CustomInput
                                    name="description"
                                    label="Okul Tanımı"
                                    value={data.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    placeholder="Okulunuz hakkında kısa bir açıklama..."
                                />

                                <CustomInput
                                    name="contactPerson"
                                    label="Yetkili Kişi"
                                    value={data.contactPerson}
                                    onChange={handleChange}
                                    error={!!errors.contactPerson}
                                    helperText={errors.contactPerson}
                                    required
                                />

                                <CustomPhoneInput
                                    name="contactPhone"
                                    label="İletişim Telefonu"
                                    countryCode="+90"
                                    phoneNumber={data.contactPhone}
                                    onCountryCodeChange={() => { }}
                                    onPhoneNumberChange={(value) => handleChange({ target: { name: 'contactPhone', value } })}
                                    error={!!errors.contactPhone}
                                    helperText={errors.contactPhone}
                                    required
                                />

                                <CustomInput
                                    name="address"
                                    label="Adres"
                                    value={data.address}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                    placeholder="Okul adresi..."
                                />

                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Okul Fotoğrafı (İsteğe bağlı)</p>
                                    <ImageUploader
                                        currentPhotoURL={data.photoURL}
                                        onImageChange={(base64) => setData(prev => ({ ...prev, photoURL: base64 || '' }))}
                                        displayName={data.schoolName || '?'}
                                        userType="school"
                                        shape="square"
                                        width={240}
                                        height={160}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Adım 2: Belge Yükleme */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Resmi Belge Yükle</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Dans okulu ruhsatınızı veya resmi evraklarınızı yükleyin. Yönetici onayından sonra okulunuz aktif hale gelir.
                                    </p>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-amber-500 text-xl">📋</span>
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Kabul edilen belgeler:</p>
                                            <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-0.5 list-disc list-inside">
                                                <li>Faaliyet belgesi / Ruhsat</li>
                                                <li>Vergi levhası</li>
                                                <li>Ticaret sicil gazetesi</li>
                                                <li>Okul tescil belgesi</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <FileUploader
                                    label="Okul Belgesi"
                                    helperText="PDF veya görsel formatında yükleyin (maks. 10MB)"
                                    onFileChange={(base64, fileName) => {
                                        setData(prev => ({
                                            ...prev,
                                            schoolDocument: base64 || '',
                                            schoolDocumentName: fileName || ''
                                        }));
                                        if (errors.schoolDocument && base64) {
                                            setErrors(prev => { const u = { ...prev }; delete u.schoolDocument; return u; });
                                        }
                                    }}
                                    accept="application/pdf,image/*"
                                    maxSizeMB={10}
                                />
                                {errors.schoolDocument && (
                                    <p className="text-red-500 text-sm">{errors.schoolDocument}</p>
                                )}

                                {data.schoolDocument && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Belge yüklendi</p>
                                            <p className="text-xs text-green-600 dark:text-green-400">{data.schoolDocumentName}</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Adım 3: Özet & Gönder */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Her Şey Hazır!</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Aktivasyon talebinizi göndermeden önce bilgilerinizi gözden geçirin.
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        {data.photoURL ? (
                                            <img src={data.photoURL} alt={data.schoolName} className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-school/10 flex items-center justify-center text-school text-lg font-bold">
                                                {data.schoolName?.[0] || 'O'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{data.schoolName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{data.contactPerson}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Telefon</p>
                                            <p className="text-gray-700 dark:text-gray-300">{data.contactPhone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Belge</p>
                                            <p className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                {data.schoolDocument ? (
                                                    <><span className="text-green-500">✓</span> Yüklendi</>
                                                ) : (
                                                    <><span className="text-red-500">✗</span> Yok</>
                                                )}
                                            </p>
                                        </div>
                                        {data.address && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-400 mb-0.5">Adres</p>
                                                <p className="text-gray-700 dark:text-gray-300">{data.address}</p>
                                            </div>
                                        )}
                                        {data.description && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-400 mb-0.5">Açıklama</p>
                                                <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">{data.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Talebiniz yöneticiye iletilecektir. Onay sonrasında okulunuz aktif hale gelecek ve platformda listelenecektir.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center gap-3 bg-gray-50 dark:bg-slate-900">
                    <Button
                        variant="school"
                        onClick={step === 1 ? onClose : goPrev}
                        disabled={isSubmitting}
                        className="border border-gray-200 dark:border-slate-600 !bg-white dark:!bg-slate-800 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-50"
                    >
                        {step === 1 ? 'İptal' : '← Geri'}
                    </Button>

                    {step < 3 ? (
                        <Button variant="school" onClick={goNext}>
                            İleri →
                        </Button>
                    ) : (
                        <Button
                            variant="school"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Gönderiliyor...' : '🚀 Aktivasyon Talebini Gönder'}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default SchoolActivationWizard;
