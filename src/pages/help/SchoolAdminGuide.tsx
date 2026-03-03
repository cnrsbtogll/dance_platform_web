import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/components/ui/Button';

/* ─── İkonlar ─── */
const PersonIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const BuildingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);
const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const EmailIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

/* ═══════════════════════════════════════════════
   BÖLÜM 1: EĞİTMEN EKLEME MOCKUP'LARI
═══════════════════════════════════════════════ */

const InstructorMock1 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="flex gap-2">
            {/* Sidebar */}
            <div className="w-24 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-600 p-2 space-y-1">
                {['Özet', 'Okul Profili', 'Kurslar', 'Öğrenciler', 'Eğitmenler', 'Program'].map((item, i) => (
                    <div key={item} className={`text-[9px] px-1.5 py-1 rounded truncate ${i === 4 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-bold' : 'text-gray-400'}`}>
                        {item}
                    </div>
                ))}
            </div>
            {/* İçerik alanı */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-orange-300 dark:border-orange-600 p-3 flex items-center justify-center">
                <div className="text-center space-y-1">
                    <PersonIcon />
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">Eğitmenler</p>
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Sol menüden <strong className="text-gray-700 dark:text-gray-200">Eğitmenler</strong> sekmesine tıkla</p>
    </div>
);

const InstructorMock2 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Eğitmen Listesi</p>
                <div
                    className="flex items-center gap-1 bg-orange-600 text-white text-[10px] font-semibold px-2 py-1 rounded-lg cursor-pointer hover:bg-orange-700 transition-colors"
                >
                    <PlusIcon /> Eğitmen Ekle
                </div>
            </div>
            {/* Mevcut eğitmenler */}
            {['Ahmet Yıldız • Salsa', 'Zeynep Demir • Bachata'].map((name, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${i === 0 ? 'bg-orange-400' : 'bg-amber-400'}`}>{name[0]}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-800 dark:text-gray-100 truncate">{name.split('•')[0].trim()}</p>
                        <p className="text-[9px] text-orange-500">{name.split('•')[1]?.trim()}</p>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-orange-50">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                    </div>
                </div>
            ))}
            <p className="text-[10px] text-center text-gray-400 pt-1">Mevcut eğitmenler listelenir → <strong className="text-gray-700 dark:text-gray-200">Eğitmen Ekle</strong></p>
        </div>
    </div>
);

const InstructorMock3 = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [style, setStyle] = useState('');
    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2 shadow-lg">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Yeni Eğitmen</p>
                <div className="space-y-1.5">
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Ad Soyad</p>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ahmet Yıldız" className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 placeholder-gray-300" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">E-posta</p>
                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="egitmen@ornek.com" className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 placeholder-gray-300" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Dans Stili</p>
                        <select value={style} onChange={e => setStyle(e.target.value)} className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                            <option value="">Seç</option>
                            <option>Salsa</option><option>Bachata</option><option>Tango</option><option>Kizomba</option>
                        </select>
                    </div>
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                        <span className="text-[10px]">☑️</span>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">Eğitmenin sertifikalı olduğunu onaylıyorum</p>
                    </div>
                </div>
                <div className={`w-full py-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${name && email && style ? 'bg-orange-600 text-white cursor-pointer' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                    Eğitmeni Kaydet
                </div>
            </div>
            <p className="text-[11px] text-center text-gray-400">Formu doldurup <strong className="text-gray-700 dark:text-gray-200">Eğitmeni Kaydet</strong>&apos;e bas</p>
        </div>
    );
};

const InstructorMock4 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            {/* Başarı mesajı */}
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0"><CheckIcon /></div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Yeni eğitmen oluşturuldu ve eklendi!</p>
            </div>
            {/* Güncel liste */}
            {['Ahmet Yıldız • Salsa', 'Zeynep Demir • Bachata', 'Mehmet Can • Tango'].map((name, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-2 rounded-lg border ${i === 2 ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30' : 'bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${['bg-orange-400', 'bg-amber-400', 'bg-teal-400'][i]}`}>{name[0]}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-800 dark:text-gray-100">{name.split('•')[0].trim()}</p>
                        <p className="text-[9px] text-orange-500">{name.split('•')[1]?.trim()}</p>
                    </div>
                    {i === 2 && <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">YENİ</span>}
                </div>
            ))}
            {/* E-posta uyarı */}
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <EmailIcon />
                <p className="text-[10px] text-blue-600 dark:text-blue-400">Eğitmene otomatik e-posta doğrulama maili gönderildi.</p>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Eğitmen listeye eklendi, e-posta bildirimi gitti.</p>
    </div>
);

/* ═══════════════════════════════════════════════
   BÖLÜM 2: SINIF & STÜDYO TANIMLAMASI MOCKUP'LARI
   (Kurs yönetimi üzerinden yapılıyor)
═══════════════════════════════════════════════ */

const StudioMock1 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="flex gap-2">
            <div className="w-24 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-600 p-2 space-y-1">
                {['Özet', 'Okul Profili', 'Kurslar', 'Öğrenciler', 'Eğitmenler', 'Program'].map((item, i) => (
                    <div key={item} className={`text-[9px] px-1.5 py-1 rounded truncate ${i === 2 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-400'}`}>
                        {item}
                    </div>
                ))}
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-indigo-300 dark:border-indigo-600 p-3 flex items-center justify-center">
                <div className="text-center space-y-1">
                    <BuildingIcon />
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Kurslar</p>
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Sol menüden <strong className="text-gray-700 dark:text-gray-200">Kurslar</strong> sekmesine tıkla</p>
    </div>
);

const StudioMock2 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Kurs Oluştur</p>
                <div className="flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-1 rounded-lg cursor-pointer">
                    <PlusIcon /> Yeni Kurs
                </div>
            </div>
            {/* Kurs form önizleme */}
            <div className="space-y-1.5 pt-1">
                {[
                    { label: 'Kurs Adı', placeholder: 'Salsa Başlangıç — Salon A' },
                    { label: 'Kapasite (Max Öğrenci)', placeholder: '20' },
                    { label: 'Ücret (₺)', placeholder: '500' },
                ].map(f => (
                    <div key={f.label}>
                        <p className="text-[10px] text-gray-400 mb-0.5">{f.label}</p>
                        <div className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-slate-700 text-gray-400">
                            {f.placeholder}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
                {['Salon A', 'Salon B', 'Stüdyo 1'].map((s, i) => (
                    <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${i === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-slate-600 text-gray-400'}`}>{s}</span>
                ))}
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Kurs adına salon/stüdyo bilgisini ekle, kapasiteyi gir</p>
    </div>
);

const StudioMock3 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Eğitmen & Program Bağla</p>
            <div className="space-y-2">
                <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Eğitmen Seç</p>
                    <select className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                        <option>Ahmet Yıldız</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Gün</p>
                        <select className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                            <option>Pazartesi</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Saat</p>
                        <input type="time" defaultValue="19:00" className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <div className="w-4 h-4 bg-indigo-600 rounded-sm flex items-center justify-center text-white flex-shrink-0"><CheckIcon /></div>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400">Salon A · Pazartesi 19:00 ✓</p>
                </div>
            </div>
            <div className="w-full py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg text-center cursor-pointer">
                Kursu Kaydet
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Eğitmen + gün + saat seç → <strong className="text-gray-700 dark:text-gray-200">Kursu Kaydet</strong></p>
    </div>
);

const StudioMock4 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0"><CheckIcon /></div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Kurs oluşturuldu!</p>
            </div>
            {[
                { name: 'Salsa Başlangıç — Salon A', day: 'Pzt 19:00', cap: '0/20', color: 'bg-orange-400' },
                { name: 'Bachata Orta — Salon B', day: 'Çar 20:00', cap: '5/15', color: 'bg-amber-400' },
                { name: 'Tango İleri — Stüdyo 1', day: 'Cum 18:00', cap: '3/10', color: 'bg-indigo-400' },
            ].map((c, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${c.color}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                        <p className="text-[9px] text-gray-400">{c.day}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">{c.cap}</span>
                </div>
            ))}
        </div>
        <p className="text-[11px] text-center text-gray-400">Salon & stüdyo bazlı kurslar aktif oldu.</p>
    </div>
);

/* ═══════════════════════════════════════════════
   BÖLÜM 3: OKUL AYARLARI MOCKUP'LARI
═══════════════════════════════════════════════ */

const SettingsMock1 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="flex gap-2">
            <div className="w-24 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-600 p-2 space-y-1">
                {['Özet', 'Okul Profili', 'Kurslar', 'Öğrenciler', 'Eğitmenler', 'Program'].map((item, i) => (
                    <div key={item} className={`text-[9px] px-1.5 py-1 rounded truncate ${i === 1 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold' : 'text-gray-400'}`}>
                        {item}
                    </div>
                ))}
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-rose-300 dark:border-rose-600 p-3 flex items-center justify-center">
                <div className="text-center space-y-1">
                    <SettingsIcon />
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Okul Profili</p>
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Sol menüden <strong className="text-gray-700 dark:text-gray-200">Okul Profili</strong> sekmesine tıkla</p>
    </div>
);

const SettingsMock2 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Okul Profili</p>
                <div className="text-[10px] bg-rose-600 text-white px-2 py-1 rounded-lg cursor-pointer font-semibold">Düzenle</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: 'Okul Adı', value: 'Dans Akademisi' },
                    { label: 'E-posta', value: 'info@dans.com' },
                    { label: 'Telefon', value: '+90 532 123 …' },
                    { label: 'Şehir', value: 'İstanbul' },
                ].map(f => (
                    <div key={f.label} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-2">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{f.value}</p>
                    </div>
                ))}
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Adres</p>
                <p className="text-[11px] text-gray-700 dark:text-gray-200">Kadıköy, İstanbul</p>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Mevcut bilgileri gör, <strong className="text-gray-700 dark:text-gray-200">Düzenle</strong> butonuna bas</p>
    </div>
);

const SettingsMock3 = () => {
    const [name, setName] = useState('Dans Akademisi');
    const [phone, setPhone] = useState('+90 532 123 45 67');
    const [iban, setIban] = useState('TR12 0001 0012 3456 7890 12');
    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2 shadow-lg">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Okul Bilgilerini Düzenle</p>
                <div className="space-y-1.5">
                    {[
                        { label: 'Okul Adı', val: name, setter: setName },
                        { label: 'Telefon', val: phone, setter: setPhone },
                        { label: 'IBAN', val: iban, setter: setIban },
                    ].map(f => (
                        <div key={f.label}>
                            <p className="text-[10px] text-gray-400 mb-0.5">{f.label}</p>
                            <input
                                value={f.val}
                                onChange={e => f.setter(e.target.value)}
                                className="w-full text-[11px] border-2 border-rose-300 dark:border-rose-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:outline-none"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-1">
                    <div className="flex-1 h-8 border border-gray-200 dark:border-slate-600 rounded-lg text-[11px] text-gray-500 flex items-center justify-center">İptal</div>
                    <div className="flex-1 h-8 bg-rose-600 text-white text-[11px] font-bold rounded-lg flex items-center justify-center cursor-pointer">Kaydet</div>
                </div>
            </div>
            <p className="text-[11px] text-center text-gray-400">Bilgileri düzenle, IBAN gir → <strong className="text-gray-700 dark:text-gray-200">Kaydet</strong></p>
        </div>
    );
};

const SettingsMock4 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0"><CheckIcon /></div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Okul bilgileri güncellendi!</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: 'Okul Adı', value: 'Dans Akademisi', ok: true },
                    { label: 'Telefon', value: '+90 532 123 …', ok: true },
                    { label: 'IBAN', value: 'TR12 0001 …', ok: true },
                    { label: 'Şifre', value: '●●●●●●●●', ok: true },
                ].map(f => (
                    <div key={f.label} className={`rounded-lg p-2 flex items-start gap-1.5 ${f.ok ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20' : 'bg-gray-50 dark:bg-slate-700'}`}>
                        {f.ok && <div className="w-4 h-4 flex-shrink-0 mt-0.5"><CheckIcon /></div>}
                        <div>
                            <p className="text-[9px] text-gray-400">{f.label}</p>
                            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{f.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/20">
                <p className="text-[10px] text-blue-600 dark:text-blue-400">💡 IBAN bilgisi öğrencilerin ödeme ekranında görünür.</p>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Tüm iletişim ve ödeme bilgilerin güncel!</p>
    </div>
);

/* ════════════════════════════════════════════
   ANA BİLEŞEN
════════════════════════════════════════════ */
type SectionId = 'instructor' | 'studio' | 'settings';

const SchoolAdminGuide: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<SectionId>('instructor');
    const [instructorStep, setInstructorStep] = useState(0);
    const [studioStep, setStudioStep] = useState(0);
    const [settingsStep, setSettingsStep] = useState(0);

    const sections: { id: SectionId; icon: React.ReactNode; title: string; subtitle: string; color: string }[] = [
        { id: 'instructor', icon: <PersonIcon />, title: 'Eğitmen Ekle/Davet Et', subtitle: 'Yeni eğitmen kaydı', color: 'orange' },
        { id: 'studio', icon: <BuildingIcon />, title: 'Sınıf & Stüdyo Tanımla', subtitle: 'Salon bazlı kurs oluştur', color: 'indigo' },
        { id: 'settings', icon: <SettingsIcon />, title: 'Okul Ayarları', subtitle: 'İletişim & IBAN bilgileri', color: 'rose' },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; btn: string; light: string }> = {
        orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-600', btn: 'bg-orange-600 hover:bg-orange-700', light: 'bg-orange-100 dark:bg-orange-900/30' },
        indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-300', badge: 'bg-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700', light: 'bg-indigo-100 dark:bg-indigo-900/30' },
        rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-700 dark:text-rose-300', badge: 'bg-rose-600', btn: 'bg-rose-600 hover:bg-rose-700', light: 'bg-rose-100 dark:bg-rose-900/30' },
    };

    const instructorSteps = [
        { title: 'Eğitmenler Sekmesi', desc: 'Okul admin panelinin sol menüsünden "Eğitmenler" sekmesine tıkla. Okuluna bağlı tüm eğitmenler burada listelenir.', mockup: <InstructorMock1 /> },
        { title: 'Eğitmen Ekle Butonu', desc: 'Sağ üstteki "Eğitmen Ekle" butonuna tıkla. Platformda zaten kayıtlı bir kullanıcıyı e-posta ile bağlayabilir ya da sıfırdan yeni hesap oluşturabilirsin.', mockup: <InstructorMock2 /> },
        { title: 'Formu Doldur', desc: 'Ad soyad, e-posta ve dans stilini gir. Eğitmenin sertifikalı olduğunu onay kutusunu işaretleyerek belirt. E-posta sistemde daha önce kayıtlıysa, mevcut kullanıcı okuluna bağlanır.', mockup: <InstructorMock3 /> },
        { title: 'Eğitmen Eklendi!', desc: 'Eğitmen listene eklendi. Eğer yeni hesap oluşturduysan, eğitmene otomatik olarak e-posta doğrulama maili gönderilir. Ardından eğitmeni kurslara atayabilirsin.', mockup: <InstructorMock4 /> },
    ];

    const studioSteps = [
        { title: 'Kurslar Sekmesi', desc: 'Sol menüden "Kurslar" sekmesine tıkla. Sınıf ve stüdyo tanımlaması kurs oluşturma akışı üzerinden yapılır — her kurs bir salon veya stüdyoya karşılık gelir.', mockup: <StudioMock1 /> },
        { title: 'Kurs Adında Salon Belirt', desc: 'Yeni kurs oluştururken kurs adına salon/stüdyo bilgisini ekle (örn. "Salsa Başlangıç — Salon A"). Kapasite alanına o salonun maksimum öğrenci sayısını gir.', mockup: <StudioMock2 /> },
        { title: 'Eğitmen & Program Bağla', desc: 'Kursa hangi eğitmenin gireceğini seç. Ders günü ve saatini belirle. Aynı kursa birden fazla gün-saat çifti ekleyebilirsin (örn. Pzt+Çar).', mockup: <StudioMock3 /> },
        { title: 'Salon Aktif!', desc: 'Kurs yayınlandı. Öğrenciler arama sayfasında "Salon A" bilgisiyle kursu görebilir. Her salon için ayrı kurs oluşturarak kapasiteleri bağımsız yönetebilirsin.', mockup: <StudioMock4 /> },
    ];

    const settingsSteps = [
        { title: 'Okul Profili Sekmesi', desc: 'Sol menüden "Okul Profili" sekmesine tıkla. Burada okulunun genel bilgileri, iletişim detayları ve ödeme bilgileri yer alır.', mockup: <SettingsMock1 /> },
        { title: 'Mevcut Bilgileri İncele', desc: 'Okul adı, e-posta, telefon, şehir ve adres bilgilerini görebilirsin. Sağ üstteki "Düzenle" butonuna tıklayarak güncelleme yapabilirsin.', mockup: <SettingsMock2 /> },
        { title: 'Bilgileri Güncelle', desc: 'Açılan formda okul adı, telefon, adres, IBAN ve alıcı adını düzenle. IBAN bilgisi öğrencilere ödeme ekranında gösterilir. Tamamladıktan sonra "Kaydet"e bas.', mockup: <SettingsMock3 /> },
        { title: 'Güncel & Hazır!', desc: 'Tüm bilgiler kaydedildi. IBAN güncel tutulursa öğrenciler doğru hesaba ödeme yapabilir. Aynı sayfadan şifreni de değiştirebilirsin.', mockup: <SettingsMock4 /> },
    ];

    const allSteps = { instructor: instructorSteps, studio: studioSteps, settings: settingsSteps };
    const allNums = { instructor: instructorStep, studio: studioStep, settings: settingsStep };
    const allSets = { instructor: setInstructorStep, studio: setStudioStep, settings: setSettingsStep };

    const cur = activeSection;
    const steps = allSteps[cur];
    const stepNum = allNums[cur];
    const setStep = allSets[cur];
    const c = colorMap[sections.find(s => s.id === cur)!.color];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">

                {/* ── Başlık ── */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                        <BuildingIcon />
                        Okul Yönetim Paneli Rehberi
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Okul Panelini Nasıl Kullanırım?
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Eğitmen ekleme, sınıf/stüdyo tanımlama ve okul ayarları — hepsini admine ihtiyaç duymadan kendin yapabilirsin.
                    </p>
                </div>

                {/* ── Seksiyon Seçici ── */}
                <div className="grid grid-cols-3 gap-3 mb-10">
                    {sections.map(s => {
                        const sc = colorMap[s.color];
                        const isActive = activeSection === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md group ${isActive ? `${sc.bg} ${sc.border} shadow-md` : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${isActive ? sc.badge + ' text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                                    {s.icon}
                                </div>
                                <p className={`text-sm font-bold transition-colors ${isActive ? sc.text : 'text-gray-700 dark:text-gray-300'}`}>{s.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{s.subtitle}</p>
                            </button>
                        );
                    })}
                </div>

                {/* ── Aktif Seksiyon Kartı ── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow mb-10">
                    {/* Başlık şeridi */}
                    <div className={`px-6 py-4 ${c.bg} border-b ${c.border}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${c.badge} text-white flex items-center justify-center`}>
                                {sections.find(s => s.id === cur)?.icon}
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${c.text}`}>{sections.find(s => s.id === cur)?.title}</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Adım {stepNum + 1} / {steps.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* İlerleme çizgisi */}
                        <div className="flex gap-1.5 mb-6">
                            {steps.map((_, i) => (
                                <button key={i} onClick={() => setStep(i)} className={`h-1.5 rounded-full transition-all ${i === stepNum ? `flex-1 ${c.badge}` : 'w-8 bg-gray-200 dark:bg-slate-700'}`} />
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Açıklama */}
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${c.bg} ${c.text}`}>
                                    Adım {stepNum + 1}: {steps[stepNum].title}
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{steps[stepNum].desc}</p>

                                {/* Seksiyon özel ipuçları */}
                                {cur === 'instructor' && stepNum === 1 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>🔗 Mevcut Kullanıcıyı Bağlama</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Eğitmenin e-postası sistemde kayıtlıysa "Bu kullanıcıyı eğitmen olarak ekle" onay penceresi çıkar. Mevcut kişiyi bürokrasi olmadan anında bağlayabilirsin.</p>
                                    </div>
                                )}
                                {cur === 'instructor' && stepNum === 2 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>🔑 Varsayılan Şifre</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Yeni eğitmen için otomatik şifre atanır. Eğitmen ilk girişten sonra şifresini değiştirebilir ya da e-posta doğrulama mailinden sıfırlayabilir.</p>
                                    </div>
                                )}
                                {cur === 'studio' && stepNum === 1 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>🏛️ Salon Adlandırma İpucu</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Kurs adını "Dans Stili — Salon/Stüdyo" formatında yaz. Örn: "Salsa Başlangıç — Salon A" ya da "Bachata Orta — Ana Stüdyo". Bu şekilde öğrenciler salonu kolayca görür.</p>
                                    </div>
                                )}
                                {cur === 'studio' && stepNum === 2 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>📅 Çoklu Gün Desteği</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Aynı kursa birden fazla gün-saat ekleyebilirsin. Örneğin Salsa Başlangıç için "Pzt 19:00" ve "Çar 20:00" aynı anda tanımlanabilir.</p>
                                    </div>
                                )}
                                {cur === 'settings' && stepNum === 2 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>💳 IBAN Neden Önemli?</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Öğrenciler kursa kaydolduğunda ödeme için IBAN bilgisine yönlendirilir. Güncel tutulmazsa öğrenciler yanlış hesaba ödeme yapabilir.</p>
                                    </div>
                                )}
                                {cur === 'settings' && stepNum === 3 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>🔐 Şifre Değiştirme</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Okul Profili sayfasının altında "Şifre Değiştir" bölümü bulunur. Mevcut şifreni girerek yeni şifre belirleyebilirsin.</p>
                                    </div>
                                )}

                                {/* Adım listesi */}
                                <div className="space-y-1.5 pt-1">
                                    {steps.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setStep(i)}
                                            className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm
                        ${i === stepNum ? `${c.bg} ${c.border} border font-semibold ${c.text}` : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${i <= stepNum ? c.badge + ' text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-400'}`}>
                                                {i < stepNum ? <CheckIcon /> : i + 1}
                                            </div>
                                            {s.title}
                                        </button>
                                    ))}
                                </div>

                                {/* Navigasyon */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setStep(s => Math.max(0, s - 1))}
                                        disabled={stepNum === 0}
                                        className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                                    >
                                        ← Önceki
                                    </button>
                                    <button
                                        onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                                        disabled={stepNum === steps.length - 1}
                                        className={`flex-1 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-30 transition-all ${c.btn}`}
                                    >
                                        Sonraki →
                                    </button>
                                </div>
                            </div>

                            {/* Görsel Mockup */}
                            {steps[stepNum].mockup}
                        </div>
                    </div>
                </div>

                {/* ── SSS Kutuları ── */}
                <section className="bg-gradient-to-br from-orange-50 to-indigo-50 dark:from-orange-900/10 dark:to-indigo-900/10 rounded-2xl p-8 border border-orange-100 dark:border-orange-800/30 mb-10">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">💡 Hızlı Hatırlatmalar</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { emoji: '🔗', title: 'Mevcut Kullanıcı Bağlama', desc: 'Eğitmenin e-postası sistemde varsa yeni hesap açmaya gerek yok. "Bağla" ile anında okuluna ekle.' },
                            { emoji: '🏛️', title: 'Salon = Kurs', desc: 'Her salon/stüdyo için ayrı kurs oluştur. Kurs adına salon adını ekleyerek kapasiteleri bağımsız yönet.' },
                            { emoji: '💳', title: 'IBAN Güncel Tut', desc: 'Öğrenciler ödeme için IBAN\'ına yönlendirilir. Okul Profili sayfasından her zaman güncelleyebilirsin.' },
                        ].map(item => (
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
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Okul paneline geç ve hemen başla!</p>
                    <Button onClick={() => navigate('/school-admin')}>
                        Okul Paneline Git →
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default SchoolAdminGuide;
