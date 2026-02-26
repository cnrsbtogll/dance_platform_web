import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Google Logo SVG
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

const DANCE_STYLES = [
    'Salsa', 'Bachata', 'Kizomba', 'Zouk', 'Tango', 'Dans', 'Diğer',
];

const GENDER_OPTIONS = [
    { value: 'male', label: 'Erkek' },
    { value: 'female', label: 'Kadın' },
    { value: 'other', label: 'Belirtmek istemiyorum' },
];

const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, clearPendingRedirect } = useAuth();

    const [form, setForm] = useState({
        displayName: currentUser?.displayName ?? '',
        gender: '',
        phoneNumber: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.displayName.trim()) {
            setError('Ad Soyad alanı zorunludur.');
            return;
        }
        if (!currentUser) {
            setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: form.displayName.trim(),
                ...(form.gender && { gender: form.gender }),
                ...(form.phoneNumber && { phoneNumber: form.phoneNumber }),
                updatedAt: serverTimestamp(),
            });

            clearPendingRedirect();
            toast.success('Profiliniz oluşturuldu! Hoş geldiniz 🎉');
            navigate('/profile');
        } catch (err) {
            console.error(err);
            setError('Profil kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        clearPendingRedirect();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50 dark:from-gray-900 dark:via-slate-900 dark:to-rose-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                {/* Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">

                    {/* Top gradient bar */}
                    <div className="h-2 bg-gradient-to-r from-brand-pink via-rose-500 to-orange-400" />

                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/30 mb-4">
                                <svg className="w-8 h-8 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>

                            {/* Google badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 mb-4">
                                <GoogleIcon />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    Google ile giriş yapıldı
                                </span>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Profilinizi Tamamlayın
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Dans platformumuzu daha iyi kullanabilmek için birkaç bilgi daha alalım.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800/30 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Ad Soyad */}
                            <div>
                                <label
                                    htmlFor="cp-displayName"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    Ad Soyad <span className="text-brand-pink">*</span>
                                </label>
                                <input
                                    id="cp-displayName"
                                    type="text"
                                    name="displayName"
                                    value={form.displayName}
                                    onChange={handleChange}
                                    placeholder="Örn: Ayşe Kara"
                                    autoComplete="name"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            {/* Cinsiyet */}
                            <div>
                                <label
                                    htmlFor="cp-gender"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    Cinsiyet{' '}
                                    <span className="text-xs font-normal text-gray-400">(İsteğe bağlı)</span>
                                </label>
                                <select
                                    id="cp-gender"
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="">Seçiniz...</option>
                                    {GENDER_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Telefon */}
                            <div>
                                <label
                                    htmlFor="cp-phone"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    Telefon{' '}
                                    <span className="text-xs font-normal text-gray-400">(İsteğe bağlı)</span>
                                </label>
                                <input
                                    id="cp-phone"
                                    type="tel"
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="05xx xxx xx xx"
                                    autoComplete="tel"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Info note */}
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1.5">
                                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Bu bilgileri daha sonra profilinizden güncelleyebilirsiniz.
                            </p>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    id="cp-submit-btn"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm
                    bg-brand-pink hover:opacity-90 active:scale-[0.98]
                    transition-all duration-150 shadow-md hover:shadow-lg
                    disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        'Profili Tamamla ve Devam Et'
                                    )}
                                </button>

                                <button
                                    id="cp-skip-btn"
                                    type="button"
                                    onClick={handleSkip}
                                    disabled={loading}
                                    className="w-full py-2.5 px-6 rounded-xl text-sm font-medium
                    text-gray-500 dark:text-gray-400
                    hover:bg-gray-100 dark:hover:bg-slate-700
                    transition-colors duration-150 disabled:opacity-50"
                                >
                                    Şimdilik geç, daha sonra tamamla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bottom hint */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
                    Profilinizi doldurarak partner eşleştirme ve kurs önerilerinden yararlanabilirsiniz.
                </p>
            </div>
        </div>
    );
};

export default CompleteProfile;
