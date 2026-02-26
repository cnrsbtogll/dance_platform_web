import React, { useState, useEffect, useRef } from 'react';
import { deleteAccount, DeleteAccountRole } from '../../../../api/services/deleteAccountService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: DeleteAccountRole;
    colorVariant?: 'default' | 'school' | 'instructor';
    /** Required for school accounts to delete the schools/{schoolId} doc */
    schoolId?: string;
}

const ROLE_LABELS: Record<DeleteAccountRole, string> = {
    student: 'öğrenci',
    instructor: 'eğitmen',
    school: 'okul yönetici',
};

const ROLE_WARNINGS: Record<DeleteAccountRole, string[]> = {
    student: [
        'Kayıtlı olduğunuz tüm kurslardan çıkarılacaksınız.',
        'Dans geçmişiniz, rozetleriniz ve ilerleme verileriniz silinecek.',
        'Bu işlem geri alınamaz.',
    ],
    instructor: [
        'Eğitmen profiliniz ve tüm bağlı veriler kalıcı olarak silinecek.',
        'Yönettiğiniz kurslardan eğitmen olarak çıkarılacaksınız.',
        'Öğrencilerinizin verileri etkilenmez; ancak siz ilişkilendirilmekten kaldırılırsınız.',
        'Bu işlem geri alınamaz.',
    ],
    school: [
        'Okul profiliniz ve kayıtlı tüm bilgiler kalıcı olarak silinecek.',
        'Bu okul ile ilişkilendirilmiş kurs ve kullanıcı verileri etkilenebilir.',
        'IBAN ve ödeme bilgileri dahil tüm okul verileri silinecektir.',
        'Bu işlem geri alınamaz.',
    ],
};

const accentByVariant: Record<string, string> = {
    default: '#9f1239',
    school: '#b45309',
    instructor: '#0d9488',
};

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    isOpen,
    onClose,
    role,
    colorVariant = 'default',
    schoolId,
}) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const accent = accentByVariant[colorVariant] ?? accentByVariant.default;

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setLoading(false);
            setShowPassword(false);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !loading) onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (!password.trim()) {
            toast.error('Lütfen şifrenizi girin.');
            return;
        }
        setLoading(true);
        try {
            await deleteAccount(role, password, { schoolId });
            toast.success('Hesabınız başarıyla silindi.');
            navigate('/login', { replace: true });
        } catch (err: any) {
            if (
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-credential'
            ) {
                toast.error('Şifreniz yanlış. Lütfen tekrar deneyin.');
            } else if (err.code === 'auth/too-many-requests') {
                toast.error('Çok fazla hatalı deneme. Lütfen daha sonra tekrar deneyin.');
            } else {
                toast.error('Hesap silinirken bir hata oluştu: ' + (err.message ?? ''));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => !loading && onClose()}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div
                    className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-start gap-4">
                            {/* Warning icon */}
                            <div
                                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${accent}18` }}
                            >
                                <svg
                                    className="w-6 h-6"
                                    style={{ color: accent }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <div className="flex-1">
                                <h2
                                    id="delete-account-title"
                                    className="text-lg font-bold text-gray-900 dark:text-white"
                                >
                                    Hesabı Kalıcı Olarak Sil
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    <strong style={{ color: accent }}>
                                        {ROLE_LABELS[role]}
                                    </strong>{' '}
                                    hesabınızı silmek üzeresiniz.
                                </p>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                                aria-label="Kapat"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-5">
                        {/* Warning list */}
                        <div
                            className="rounded-xl p-4 border"
                            style={{
                                backgroundColor: `${accent}0a`,
                                borderColor: `${accent}30`,
                            }}
                        >
                            <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: accent }}>
                                Dikkat — Silinecek veriler
                            </p>
                            <ul className="space-y-1.5">
                                {ROLE_WARNINGS[role].map((w, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        <svg
                                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                                            style={{ color: accent }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Password confirmation */}
                        <div>
                            <label
                                htmlFor="delete-account-password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                            >
                                Devam etmek için şifrenizi girin
                            </label>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    id="delete-account-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleDelete()}
                                    disabled={loading}
                                    placeholder="Mevcut şifreniz"
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 disabled:opacity-60 transition-all"
                                    style={{
                                        // @ts-ignore
                                        '--tw-ring-color': accent,
                                        focusRingColor: accent,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                >
                                    {showPassword ? (
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || !password.trim()}
                            className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            style={{ backgroundColor: accent }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Siliniyor...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Hesabımı Kalıcı Olarak Sil
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeleteAccountModal;
