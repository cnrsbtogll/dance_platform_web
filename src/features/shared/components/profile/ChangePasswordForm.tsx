import React, { useState } from 'react';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../../../api/firebase/firebase';
import { CustomInput } from '../../../../common/components/ui/CustomInput';
import Button from '../../../../common/components/ui/Button';
import toast from 'react-hot-toast';

interface ChangePasswordFormProps {
    colorVariant?: 'default' | 'school' | 'instructor';
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
    colorVariant = 'default'
}) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Oturum açmış olan kullanıcının Firebase objesi
    const currentUser = auth.currentUser;

    // Sign-in sağlayıcıya (provider) bakarak şifreye dayalı bir giriş olup olmadığını anla.
    const isPasswordUser = currentUser?.providerData?.some(
        (provider) => provider.providerId === 'password'
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !currentUser.email) {
            toast.error('Kullanıcı oturumu bulunamadı.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Yeni şifreniz en az 6 karakter olmalıdır.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);

        try {
            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // 2. Update Password
            await updatePassword(currentUser, newPassword);

            toast.success('Şifreniz başarıyla güncellendi!');

            // Formu temizle
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Şifre güncelleme hatası: ', error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error('Eski şifrenizi yanlış girdiniz.');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Çok fazla başarısız deneme yaptınız. Lütfen daha sonra tekrar deneyin.');
            } else {
                toast.error('Şifre güncellenirken bir hata oluştu: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!currentUser || !currentUser.email) return;

        setResetting(true);
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        } catch (error: any) {
            console.error('Sıfırlama e-postası hatası: ', error);
            toast.error('Sıfırlama e-postası gönderilirken bir hata oluştu.');
        } finally {
            setResetting(false);
        }
    };

    if (!currentUser) return null;

    if (!isPasswordUser) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="text-amber-800 dark:text-amber-400 font-semibold mb-2">
                    Sosyal Hesapla Giriş
                </h3>
                <p className="text-amber-700 dark:text-amber-500 text-sm">
                    Hesabınıza Google, Apple vb. bir sosyal hesap üzerinden giriş yaptığınız için şifre değiştirme işlemi yapamazsınız.
                </p>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-xl border shadow-sm ${colorVariant === 'school'
                ? 'bg-white dark:bg-[#231810] border-school/20 dark:border-[#493322]'
                : colorVariant === 'instructor'
                    ? 'bg-white dark:bg-[#0f172a] border-instructor/20 dark:border-instructor/30'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
            }`}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-700/50 mb-5">
                Şifre Değiştir
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <CustomInput
                    name="oldPassword"
                    label="Mevcut Şifre"
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e: any) => setOldPassword(e.target.value)}
                    colorVariant={colorVariant}
                    fullWidth
                />

                <CustomInput
                    name="newPassword"
                    label="Yeni Şifre"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e: any) => setNewPassword(e.target.value)}
                    colorVariant={colorVariant}
                    helperText="En az 6 karakter olmalıdır."
                    fullWidth
                />

                <CustomInput
                    name="confirmPassword"
                    label="Yeni Şifre (Tekrar)"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                    colorVariant={colorVariant}
                    error={newPassword !== '' && confirmPassword !== '' && newPassword !== confirmPassword}
                    helperText={newPassword !== '' && confirmPassword !== '' && newPassword !== confirmPassword ? "Şifreler eşleşmiyor" : ""}
                    fullWidth
                />

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={resetting}
                        className={`text-sm font-medium hover:underline ${colorVariant === 'school' ? 'text-school' : colorVariant === 'instructor' ? 'text-instructor' : 'text-brand-pink'
                            }`}
                    >
                        {resetting ? 'Gönderiliyor...' : 'Mevcut şifremi hatırlamıyorum'}
                    </button>

                    <Button
                        type="submit"
                        variant={colorVariant === 'default' ? 'primary' : colorVariant}
                        disabled={loading || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className="w-full sm:w-auto"
                    >
                        {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
