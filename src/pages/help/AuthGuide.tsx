import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/components/ui/Button';

const AuthGuide: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Feriha'ya Nasıl Katılırım?
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Kayıt olma ve giriş yapma adımlarını sizin için derledik. Platformumuzu hemen kullanmaya başlayabilirsiniz!
                    </p>
                </div>

                <div className="space-y-16">
                    {/* Kayıt Olma Rehberi */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
                        <div className="p-8 md:p-12">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-brand-pink/10 text-brand-pink rounded-full flex items-center justify-center text-xl font-bold mr-4">
                                    1
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Kayıt Ol (Hesap Oluştur)</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-4 text-gray-600 dark:text-gray-400">
                                    <p>Sitemize ilk defa geliyorsanız bir hesap oluşturmanız gerekir:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Sağ üst köşedeki <strong className="text-gray-900 dark:text-gray-200">"Kayıt Ol"</strong> butonuna veya aşağıdaki butona tıklayın.</li>
                                        <li>Karşınıza çıkan formda <strong>Ad Soyad</strong>, <strong>E-posta adresi</strong> ve tahmin edilmesi zor bir <strong>Şifre</strong> belirleyin.</li>
                                        <li>Platformda Dans Eğitmeni, Dans Okulu veya Öğrenci olarak istediğiniz rolleri daha sonra belirleyebilirsiniz. Temel başlangıç rolü "Öğrenci" olarak tanımlanır.</li>
                                        <li>Tüm bilgileri doldurduktan sonra <strong className="text-gray-900 dark:text-gray-200">Kayıt Ol</strong> butonuna basarak işleminizi tamamlayın.</li>
                                    </ul>
                                    <div className="pt-4">
                                        <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto">
                                            Hemen Kayıt Ol
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-gray-100 dark:bg-slate-700/50 rounded-xl p-6 border border-gray-200 dark:border-slate-600">
                                    <div className="space-y-4">
                                        <div className="h-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded flex items-center px-3 text-sm text-gray-400">
                                            Adınız Soyadınız
                                        </div>
                                        <div className="h-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded flex items-center px-3 text-sm text-gray-400">
                                            E-posta Adreiniz
                                        </div>
                                        <div className="h-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded flex items-center px-3 text-sm text-gray-400">
                                            Şifreniz (En az 6 karakter)
                                        </div>
                                        <div className="h-10 bg-brand-pink rounded flex items-center justify-center text-white font-medium">
                                            Kayıt Ol
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Giriş Yapma Rehberi */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
                        <div className="p-8 md:p-12">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                                    2
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Giriş Yap</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div className="order-2 md:order-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl p-6 border border-gray-200 dark:border-slate-600">
                                    <div className="space-y-4">
                                        <div className="h-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded flex items-center px-3 text-sm text-gray-400">
                                            E-posta Adresiniz
                                        </div>
                                        <div className="relative">
                                            <div className="h-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded flex items-center px-3 text-sm text-gray-400">
                                                Şifreniz
                                            </div>
                                            <div className="absolute right-0 top-0 -mt-6 text-xs text-brand-pink font-medium">
                                                Şifremi unuttum?
                                            </div>
                                        </div>
                                        <div className="h-10 bg-brand-pink rounded flex items-center justify-center text-white font-medium">
                                            Giriş Yap
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 md:order-2 space-y-4 text-gray-600 dark:text-gray-400">
                                    <p>Mevcut bir hesabınız varsa aşağıdaki adımları izleyin:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Sağ üst köşedeki <strong className="text-gray-900 dark:text-gray-200">"Giriş"</strong> butonuna veya aşağıdaki butona tıklayın.</li>
                                        <li>Sisteme kayıt olduğunuz <strong>E-posta adresinizi</strong> ve <strong>Şifrenizi</strong> girin.</li>
                                        <li>Eğer şifrenizi unuttuysanız <strong>"Şifremi unuttum?"</strong> linkine tıklayarak şifre sıfırlama işlemlerini başlatabilirsiniz. E-postanıza gelen bağlantıyla yeni bir şifre oluşturabilirsiniz.</li>
                                    </ul>
                                    <div className="pt-4">
                                        <Button onClick={() => navigate('/signin')} className="w-full sm:w-auto" variant="secondary">
                                            Giriş Sayfasına Git
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sıkça Sorulan Sorular / İpuçları */}
                    <section className="bg-brand-pink/5 dark:bg-brand-pink/10 rounded-2xl p-8 border border-brand-pink/20">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Neden Üye Olmalıyım?</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mx-auto mb-4 text-2xl">
                                    💃
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Partner Bulun</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Kendi seviyenizde pratik yapabileceğiniz güvenilir dans partnerleri bulun.</p>
                            </div>
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mx-auto mb-4 text-2xl">
                                    🎓
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Eğitim Takibi</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Katıldığınız kursları ve eğitmenlerle gelişiminizi anlık olarak takip edin.</p>
                            </div>
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mx-auto mb-4 text-2xl">
                                    🎟️
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Etkinlikler</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Dans gecelerinden, bölgesel festivallerden anında haberdar olun.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AuthGuide;
