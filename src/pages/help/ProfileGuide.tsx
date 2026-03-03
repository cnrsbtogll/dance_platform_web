import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/components/ui/Button';

/* ─── Küçük inline SVG ikonlar ─── */
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/* ─── Avatar Mockup ─── */
const AvatarMockup: React.FC<{ step: number }> = ({ step }) => {
  const steps = [
    {
      label: 'Profil sayfanı aç',
      desc: 'Sağ üst menüden "Profilim" seçeneğine tıkla.',
      visual: (
        <div className="flex flex-col items-center gap-3 p-4">
          {/* Navbar sim */}
          <div className="w-full bg-gray-800 rounded-lg flex items-center justify-between px-3 py-2">
            <span className="text-white text-xs font-bold">Feriha</span>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-rose-800/60 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">AK</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="w-14 bg-white/20 rounded h-1.5" />
                <div className="w-10 bg-rose-400 rounded h-1.5 animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Menüden <strong className="text-gray-800 dark:text-gray-200">Profilim</strong> seçeneğine tıkla</p>
        </div>
      ),
    },
    {
      label: 'Fotoğrafa tıkla',
      desc: 'Sol sütundaki yuvarlak avatarın üzerine geldiğinde kamera ikonu belirir. Ona tıkla.',
      visual: (
        <div className="flex flex-col items-center gap-3 p-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <CameraIcon />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center">
              <CameraIcon />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Avatarın üzerine gel → <strong className="text-gray-800 dark:text-gray-200">kamera ikonu</strong> belirir</p>
        </div>
      ),
    },
    {
      label: 'Fotoğraf seç',
      desc: 'Açılan dosya seçiciden bilgisayarındaki fotoğrafı seç. JPG, PNG formatları desteklenir.',
      visual: (
        <div className="flex flex-col items-center gap-3 p-4">
          <div className="w-full border-2 border-dashed border-rose-300 dark:border-rose-700 rounded-xl p-4 bg-rose-50 dark:bg-rose-900/10 text-center">
            <div className="text-3xl mb-2">🖼️</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Dosya seçici açılır</p>
            <p className="text-[11px] text-gray-400 mt-1">JPG · PNG · Max 5 MB</p>
            <div className="mt-3 flex gap-2 justify-center">
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="w-8 h-8 rounded bg-rose-200 dark:bg-rose-800 ring-2 ring-rose-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Galeriden istediğin <strong className="text-gray-800 dark:text-gray-200">fotoğrafı seç</strong></p>
        </div>
      ),
    },
    {
      label: 'Otomatik kaydedilir',
      desc: 'Fotoğraf yüklendikten hemen sonra otomatik olarak kaydedilir. Kaydet butonuna basman gerekmez!',
      visual: (
        <div className="flex flex-col items-center gap-3 p-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-300 to-teal-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🥳</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <CheckIcon />
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">✅ Profil fotoğrafı güncellendi!</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-slate-600">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => { /* handled by parent */ }}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors ${i === step
              ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500'
              : 'text-gray-400 dark:text-gray-500'
              }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {steps[step].visual}
    </div>
  );
};

/* ─── Profil Mockup ─── */
const ProfileMockup: React.FC<{ step: number }> = ({ step }) => {
  const steps = [
    {
      visual: (
        <div className="p-4 space-y-2">
          <div className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">
            Adınız Soyadınız
          </div>
          <div className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">
            Telefon Numarası (İsteğe Bağlı)
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">Şehir</div>
            <div className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">Yaş</div>
          </div>
          <p className="text-[11px] text-center text-gray-400 pt-1">Profil sayfasındaki alanları doldur</p>
        </div>
      ),
    },
    {
      visual: (
        <div className="p-4 space-y-2">
          <div className="w-full bg-white dark:bg-slate-700 border-2 border-rose-400 rounded-lg flex items-center px-3 h-9 text-xs text-gray-700 dark:text-gray-200 font-medium gap-2">
            <UserIcon />
            Ahmet Kaya
          </div>
          <div className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">
            +90 532 123 45 67
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">İstanbul</div>
            <div className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center px-3 h-9 text-xs text-gray-400">28</div>
          </div>
          <p className="text-[11px] text-center text-gray-400 pt-1">Güncellemek istediğin alanı düzenle</p>
        </div>
      ),
    },
    {
      visual: (
        <div className="p-4 space-y-2">
          <div className="bg-white dark:bg-slate-700 rounded-lg p-2 flex gap-1 flex-wrap">
            {['Salsa', 'Bachata', 'Tango'].map(s => (
              <span key={s} className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-[11px] font-medium">{s}</span>
            ))}
            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-400 rounded-full text-[11px]">+ Ekle</span>
          </div>
          <div className="bg-white dark:bg-slate-700 rounded-lg p-2 flex gap-1 flex-wrap">
            {['Hafta içi akşam', 'Hafta sonu'].map(t => (
              <span key={t} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-[11px]">{t}</span>
            ))}
          </div>
          <p className="text-[11px] text-center text-gray-400 pt-1">Dans stili ve müsait zamanlarını seç</p>
        </div>
      ),
    },
    {
      visual: (
        <div className="p-4 space-y-3">
          <div className="fixed-bottom-bar bg-gradient-to-r from-rose-800 to-rose-600 rounded-xl flex items-center justify-between px-4 py-3 shadow-lg">
            <div>
              <p className="text-white text-xs font-semibold">Öğrenci Profili</p>
              <p className="text-rose-200 text-[10px]">⚠️ Kaydedilmemiş değişiklikleriniz var.</p>
            </div>
            <div className="bg-white text-rose-700 font-bold text-xs px-3 py-1.5 rounded-lg shadow">
              Değişiklikleri Kaydet
            </div>
          </div>
          <p className="text-[11px] text-center text-gray-400">Ekranın alt kısmındaki <strong className="text-gray-700 dark:text-gray-200">Kaydet</strong> butonuna tıkla</p>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-slate-600">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 py-2 text-center text-[11px] font-medium transition-colors ${i === step
              ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500'
              : 'text-gray-400 dark:text-gray-500'
              }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      {steps[step].visual}
    </div>
  );
};

/* ─── Ana Bileşen ─── */
const ProfileGuide: React.FC = () => {
  const navigate = useNavigate();
  const [avatarStep, setAvatarStep] = useState(0);
  const [profileStep, setProfileStep] = useState(0);

  const avatarSteps = [
    { title: 'Profil Sayfası', desc: 'Sağ üst menüden Profilim\'e tıkla.' },
    { title: 'Avatara Tıkla', desc: 'Yuvarlak avatarın üzerine gel, beliren kamera ikonuna tıkla.' },
    { title: 'Fotoğraf Seç', desc: 'JPG / PNG formatında bir fotoğraf seç.' },
    { title: 'Otomatik Kaydedilir', desc: 'Fotoğraf anında güncellenir, ek kayıt gerekmez.' },
  ];

  const profileSteps = [
    { title: 'Profil Sayfasını Aç', desc: 'Menüden Profilim\'e git.' },
    { title: 'Alanları Düzenle', desc: 'İsim, şehir, yaş gibi bilgileri değiştir.' },
    { title: 'Dans Tercihlerini Seç', desc: 'Dans stillerini ve müsait zamanlarını belirle.' },
    { title: 'Kaydet Butonuna Bas', desc: 'Ekranın altındaki Kaydet butonuna tıkla.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* ── Başlık ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <UserIcon />
            Profil Yönetimi Rehberi
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Profilini Nasıl Düzenlerim?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Avatar değiştirme ve profil bilgilerini güncelleme işlemlerinin tamamını admine ulaşmadan,
            sadece birkaç adımda kendin yapabilirsin.
          </p>
        </div>

        <div className="space-y-16">

          {/* ══════════════════════════════════
              BÖLÜM 1 — Avatar Değiştirme
          ══════════════════════════════════ */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
            <div className="p-8 md:p-12">

              {/* Başlık satırı */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center text-xl font-bold mr-4 flex-shrink-0">
                  1
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Fotoğrafı (Avatar) Değiştirme</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">4 kolay adımda fotoğrafını güncelle</p>
                </div>
              </div>

              {/* İçerik: Adım listesi + Mockup */}
              <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* Sol: Adımlar */}
                <div className="space-y-3">
                  {avatarSteps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setAvatarStep(i)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all
                        ${avatarStep === i
                          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 shadow-sm'
                          : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${avatarStep === i ? 'bg-rose-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${avatarStep === i ? 'text-rose-700 dark:text-rose-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {s.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  ))}

                  {/* İleri / Geri */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setAvatarStep(s => Math.max(0, s - 1))}
                      disabled={avatarStep === 0}
                      className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                    >
                      ← Önceki
                    </button>
                    <button
                      onClick={() => setAvatarStep(s => Math.min(avatarSteps.length - 1, s + 1))}
                      disabled={avatarStep === avatarSteps.length - 1}
                      className="flex-1 py-2 text-sm rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-30 transition-all"
                    >
                      Sonraki →
                    </button>
                  </div>
                </div>

                {/* Sağ: Görsel Mockup */}
                <AvatarMockup step={avatarStep} />
              </div>

              {/* Profil sayfasına git butonu */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Hemen dene!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Profil sayfana git ve avatarının üzerine tıkla.</p>
                </div>
                <Button onClick={() => navigate('/profile')} className="w-full sm:w-auto">
                  Profil Sayfama Git →
                </Button>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
              BÖLÜM 2 — Profil Bilgileri
          ══════════════════════════════════ */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
            <div className="p-8 md:p-12">

              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xl font-bold mr-4 flex-shrink-0">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Bilgilerini Düzenleme</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">İsim, dans tercihleri, şehir ve daha fazlası</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* Sol: Mockup */}
                <div className="order-2 md:order-1">
                  <ProfileMockup step={profileStep} />
                </div>

                {/* Sağ: Adımlar */}
                <div className="order-1 md:order-2 space-y-3">
                  {profileSteps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setProfileStep(i)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all
                        ${profileStep === i
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 shadow-sm'
                          : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${profileStep === i ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${profileStep === i ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {s.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setProfileStep(s => Math.max(0, s - 1))}
                      disabled={profileStep === 0}
                      className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                    >
                      ← Önceki
                    </button>
                    <button
                      onClick={() => setProfileStep(s => Math.min(profileSteps.length - 1, s + 1))}
                      disabled={profileStep === profileSteps.length - 1}
                      className="flex-1 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-30 transition-all"
                    >
                      Sonraki →
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Hemen dene!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bilgilerini güncelle, kaydet butonuna bas — bitti!</p>
                </div>
                <Button onClick={() => navigate('/profile')} variant="secondary" className="w-full sm:w-auto">
                  Profil Sayfama Git →
                </Button>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
              İpuçları kutusu
          ══════════════════════════════════ */}
          <section className="bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-rose-900/10 dark:to-indigo-900/10 rounded-2xl p-8 border border-rose-100 dark:border-rose-800/30">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">💡 Bilmen Gerekenler</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: '📷',
                  title: 'Avatar Hemen Güncellenir',
                  desc: 'Fotoğraf seçtiğinde ek kayıt gerekmez. Sistem otomatik olarak günceller.',
                },
                {
                  emoji: '💾',
                  title: 'Profil Kayıt Şartı',
                  desc: 'Profil bilgilerini (isim, şehir vb.) değiştirince alt bardaki "Kaydet" butonuna basman gerekir.',
                },
                {
                  emoji: '🔒',
                  title: 'Bilgiler Güvende',
                  desc: 'Boy/kilo gibi hassas bilgiler hiçbir zaman herkese açık profilinde gösterilmez.',
                },
              ].map((item) => (
                <div key={item.title} className="text-center p-4">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mx-auto mb-4 text-2xl">
                    {item.emoji}
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileGuide;
