import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/components/ui/Button';

/* ── Mini SVG İkonları ── */
const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
);
const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const BookIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

/* ════════════════════════════════════════
   ADIM 1 MOCKUP — Kurs Arama
   ════════════════════════════════════════ */
const Step1Mockup = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        {/* Arama çubuğu */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border-2 border-rose-400 rounded-xl px-3 py-2 shadow-sm">
            <SearchIcon />
            <span className="text-sm text-gray-400">Salsa, Bachata, Tango…</span>
            <span className="ml-auto w-2 h-4 bg-rose-400 rounded animate-pulse" />
        </div>
        {/* Filtre butonları */}
        <div className="flex gap-2 flex-wrap">
            {['Dans Stili', 'Seviye', 'Şehir'].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full border border-gray-200 dark:border-slate-600 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700">{f}</span>
            ))}
        </div>
        {/* Kurs kartları */}
        {[
            { name: 'Salsa Başlangıç', style: 'Salsa', level: 'Başlangıç', price: '₺500', spots: '3 yer kaldı' },
            { name: 'Bachata Orta Seviye', style: 'Bachata', level: 'Orta', price: '₺650', spots: '7 yer kaldı' },
        ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600 p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-200 to-rose-400 dark:from-rose-800 dark:to-rose-600 flex items-center justify-center text-xl flex-shrink-0">
                    {i === 0 ? '💃' : '🕺'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300">{c.style}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">{c.level}</span>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{c.price}</p>
                    <p className="text-[10px] text-gray-400">{c.spots}</p>
                </div>
            </div>
        ))}
        <p className="text-[11px] text-center text-gray-400 pt-1">İstediğin kursu bul ve üzerine tıkla</p>
    </div>
);

/* ════════════════════════════════════════
   ADIM 2 MOCKUP — Kurs Detay & Kaydol
   ════════════════════════════════════════ */
const Step2Mockup = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        {/* Kurs başlı */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-700 rounded-xl p-4 text-white">
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">Salsa · Başlangıç</span>
            <h3 className="text-sm font-bold mt-1">Salsa Başlangıç Kursu</h3>
            <p className="text-[10px] text-rose-200 mt-0.5">Eğitmen: Ahmet Yıldız · İstanbul</p>
        </div>
        {/* Bilgi kutusu */}
        <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            {[
                { label: 'Fiyat', value: '₺500 / ay', color: 'text-rose-600' },
                { label: 'Süre', value: '60 dakika' },
                { label: 'Günler', value: 'Salı · Perşembe' },
                { label: 'Kontenjan', value: '12 / 15 dolu' },
            ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{r.label}</span>
                    <span className={`text-[11px] font-semibold ${r.color || 'text-gray-700 dark:text-gray-200'}`}>{r.value}</span>
                </div>
            ))}
        </div>
        {/* Kayıt butonu */}
        <div className="w-full h-9 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow-md cursor-pointer hover:bg-rose-700 transition-colors">
            Kursa Kaydol
        </div>
        <p className="text-[11px] text-center text-gray-400">Detay sayfasından <strong className="text-gray-700 dark:text-gray-200">Kursa Kaydol</strong> butonuna tıkla</p>
    </div>
);

/* ════════════════════════════════════════
   ADIM 3 MOCKUP — Onay Modalı
   ════════════════════════════════════════ */
const Step3Mockup = () => {
    const [gender, setGender] = useState('');
    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
            {/* Modal kutusu */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 shadow-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Kursa Kaydol</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Salsa Başlangıç</span> kursuna kaydolmak istediğinizi onaylıyor musunuz?
                </p>
                {/* Profil tamamlama (isteğe bağlı) */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-2.5 space-y-2">
                    <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">⚠️ Profil Bilgisi Gerekiyor</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500">Daha iyi eşleştirme için cinsiyet belirt:</p>
                    <div className="flex gap-1.5">
                        {['Erkek', 'Kadın', 'Diğer'].map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`flex-1 text-[10px] py-1 rounded-lg border-2 font-semibold transition-all ${gender === g ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-[10px] text-gray-400">Ödeme için okul / eğitmenle iletişime geç.</p>
                {/* Butonlar */}
                <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-500 flex items-center justify-center">Vazgeç</div>
                    <div className={`flex-1 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${gender ? 'bg-rose-600 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-400'}`}>
                        Kaydol
                    </div>
                </div>
            </div>
            <p className="text-[11px] text-center text-gray-400">Gerekli bilgileri doldurup <strong className="text-gray-700 dark:text-gray-200">Kaydol</strong>&apos;a tıkla</p>
        </div>
    );
};

/* ════════════════════════════════════════
   ADIM 4 MOCKUP — Kayıt Onayı
   ════════════════════════════════════════ */
const Step4Mockup = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        {/* Başarı göstergesi */}
        <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-4xl">🎉</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                    <CheckIcon />
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Kayıt Başarılı!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Salsa Başlangıç kursuna kayıt oldunuz.</p>
            </div>
        </div>
        {/* Kurs panelinde görünür */}
        <div className="bg-white dark:bg-slate-700 rounded-xl border border-emerald-200 dark:border-emerald-800/40 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckIcon />
            </div>
            <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Kayıtlısınız</p>
                <p className="text-[10px] text-gray-400">Kurs sayfasında "Kayıtlısınız" rozeti belirir</p>
            </div>
        </div>
        {/* İletişim hatırlatıcı */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 text-center">
            <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">💡 Ödeme için eğitmen / okul ile iletişime geç</p>
        </div>
        <p className="text-[11px] text-center text-gray-400">Tamamlandı! Kurs panelinden takip edebilirsin.</p>
    </div>
);

/* ════════════════════════════════════════
   ANA BİLEŞEN
   ════════════════════════════════════════ */
const CourseEnrollGuide: React.FC = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            num: 1,
            title: 'Kurs Bul',
            shortDesc: 'Kurslar sayfasında arama yap',
            desc: '"Kurslar" menüsüne git. Dans stili, seviye veya şehir filtrelerini kullanarak sana uygun kursu bul. Kart üzerine tıkla.',
            mockup: <Step1Mockup />,
            color: 'rose',
        },
        {
            num: 2,
            title: 'İncele & Kaydol',
            shortDesc: 'Detay sayfasından butona tıkla',
            desc: 'Kurs detay sayfasında fiyat, ders günü, eğitmen ve kontenjan bilgilerini gözden geçir. Uygunsa sağ taraftaki "Kursa Kaydol" butonuna tıkla.',
            mockup: <Step2Mockup />,
            color: 'indigo',
        },
        {
            num: 3,
            title: 'Onayla',
            shortDesc: 'Açılan pencerede bilgileri doldur',
            desc: 'Bir onay penceresi açılır. Eğer daha önce cinsiyet veya telefon girmemişsen, platform bu bilgileri ister (kurs dengeleme için). Tamamla ve "Kaydol"a bas.',
            mockup: <Step3Mockup />,
            color: 'amber',
        },
        {
            num: 4,
            title: 'Hazırsın!',
            shortDesc: 'Kayıt tamamlandı, ödeme için iletişime geç',
            desc: 'Kayıt sisteme işlendi. Kurs sayfasında "Kayıtlısınız" yazısı çıkar. Ödeme için eğitmen ya da okul ile mesaj bölümünden iletişime geçebilirsin.',
            mockup: <Step4Mockup />,
            color: 'emerald',
        },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; btn: string; badge: string }> = {
        rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-700 dark:text-rose-300', btn: 'bg-rose-600 hover:bg-rose-700', badge: 'bg-rose-600' },
        indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-300', btn: 'bg-indigo-600 hover:bg-indigo-700', badge: 'bg-indigo-600' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', btn: 'bg-amber-600 hover:bg-amber-700', badge: 'bg-amber-600' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700', badge: 'bg-emerald-600' },
    };

    const current = steps[activeStep];
    const c = colorMap[current.color];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">

                {/* ── Başlık ── */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                        <BookIcon />
                        Kurs Kayıt Rehberi
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Bir Kursa Nasıl Kaydolurum?
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Sadece 4 adımda istediğin kursa kayıt ol — admine gerek yok, e-posta bekleme yok.
                    </p>
                </div>

                {/* ── Adım Göstergesi (Timeline) ── */}
                <div className="flex items-center justify-center mb-10 relative">
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[calc(100%-8rem)] h-0.5 bg-gray-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="flex gap-4 sm:gap-0 sm:justify-between w-full max-w-lg relative z-10">
                        {steps.map((s, i) => {
                            const sc = colorMap[s.color];
                            const done = i < activeStep;
                            const active = i === activeStep;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActiveStep(i)}
                                    className="flex flex-col items-center gap-1.5 flex-1 group"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${done ? `${sc.badge} border-transparent text-white`
                                            : active ? `${sc.badge} border-transparent text-white shadow-lg scale-110`
                                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-400 dark:text-gray-500 group-hover:border-gray-300'
                                        }`}
                                    >
                                        {done ? <CheckIcon /> : s.num}
                                    </div>
                                    <span className={`text-[10px] font-semibold hidden sm:block transition-colors ${active ? sc.text : 'text-gray-400 dark:text-gray-500'}`}>
                                        {s.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Aktif Adım Kartı ── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl mb-8">
                    <div className={`px-6 py-4 ${c.bg} border-b ${c.border}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${c.badge} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                                {current.num}
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${c.text}`}>{current.title}</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{current.shortDesc}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Açıklama */}
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{current.desc}</p>

                                {/* Özel ipuçları */}
                                {activeStep === 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filtreler</p>
                                        {['Dans stili (Salsa, Bachata, Tango…)', 'Seviye (Başlangıç, Orta, İleri)', 'Şehir / Semt'].map(tip => (
                                            <div key={tip} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center flex-shrink-0"><CheckIcon /></span>
                                                {tip}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeStep === 1 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Kontrol Et</p>
                                        {['Kontenjan durumu (dolu mu?)', 'Ders saati ve günleri', 'Ücret ve ödeme yöntemi'].map(tip => (
                                            <div key={tip} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center flex-shrink-0"><CheckIcon /></span>
                                                {tip}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeStep === 2 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 space-y-1">
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">💡 Profil bilgisi neden isteniyor?</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-500">Kurslar erkek/kadın kontenjanı dengesiyle yürütülür. Cinsiyet bilgisi sadece bu amaçla kullanılır, profilinde herkese açık gösterilmez.</p>
                                    </div>
                                )}
                                {activeStep === 3 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 space-y-1">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">💬 Ödeme nasıl yapılır?</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Ödeme platformumuz üzerinden değil, eğitmen veya dans okulu ile doğrudan gerçekleşir. Kurs sayfasındaki "İletişime Geç" butonu ya da sohbet bölümünü kullan.</p>
                                    </div>
                                )}

                                {/* İleri / Geri */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                                        disabled={activeStep === 0}
                                        className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                                    >
                                        ← Önceki
                                    </button>
                                    <button
                                        onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
                                        disabled={activeStep === steps.length - 1}
                                        className={`flex-1 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-30 transition-all ${c.btn}`}
                                    >
                                        Sonraki →
                                    </button>
                                </div>
                            </div>

                            {/* Görsel Mockup */}
                            {current.mockup}
                        </div>
                    </div>
                </div>

                {/* ── Hızlı Bakış Kartları ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                    {steps.map((s, i) => {
                        const sc = colorMap[s.color];
                        return (
                            <button
                                key={i}
                                onClick={() => setActiveStep(i)}
                                className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-md
                  ${activeStep === i ? `${sc.bg} ${sc.border}` : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-200'}`}
                            >
                                <div className={`w-7 h-7 rounded-full ${sc.badge} text-white text-xs font-bold flex items-center justify-center mb-2`}>
                                    {i < activeStep ? <CheckIcon /> : s.num}
                                </div>
                                <p className={`text-xs font-bold ${activeStep === i ? sc.text : 'text-gray-700 dark:text-gray-300'}`}>{s.title}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{s.shortDesc}</p>
                            </button>
                        );
                    })}
                </div>

                {/* ── SSS / Bilgi Kutuları ── */}
                <section className="bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-rose-900/10 dark:to-indigo-900/10 rounded-2xl p-8 border border-rose-100 dark:border-rose-800/30">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">💡 Sık Sorulan Sorular</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                emoji: '🔐',
                                title: 'Giriş yapmam gerekiyor mu?',
                                desc: 'Evet, kursa kaydolmak için üye olman ve giriş yapman gerekir. Kayıt ücretsizdir.',
                            },
                            {
                                emoji: '💳',
                                title: 'Ödeme nasıl yapılır?',
                                desc: 'Ödeme eğitmen/okul ile doğrudan yapılır. Kayıt olunca iletişime geç butonundan ulaşabilirsin.',
                            },
                            {
                                emoji: '❌',
                                title: 'Kaydımı iptal edebilir miyim?',
                                desc: 'İptal için eğitmen veya okulla iletişime geçmen gerekir. Platform üzerinden otomatik iptal şu an aktif değil.',
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

                {/* ── CTA ── */}
                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hazır mısın? Kursları keşfetmeye başla!</p>
                    <Button onClick={() => navigate('/courses')}>
                        Kurslara Göz At →
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default CourseEnrollGuide;
