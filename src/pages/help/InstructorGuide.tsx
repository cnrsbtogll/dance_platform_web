import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/components/ui/Button';

/* ─── Küçük ikonlar ─── */
const CalIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const MoneyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

/* ═══════════════════════════════════════════
   SEKSİYON MOCKUP'LARI
═══════════════════════════════════════════ */

/* --- Ders Programı Mockup'ları --- */
const ScheduleMockup1 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        {/* Sidebar sim */}
        <div className="flex gap-2">
            <div className="w-24 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-600 p-2 space-y-1">
                {['Özet', 'Kurslarım', 'Öğrencilerim', 'Ders Programım', 'Kazançlarım'].map((item, i) => (
                    <div key={item} className={`text-[9px] px-1.5 py-1 rounded ${i === 3 ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold' : 'text-gray-400'}`}>
                        {item}
                    </div>
                ))}
            </div>
            {/* İçerik */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-teal-300 dark:border-teal-600 p-3 flex items-center justify-center">
                <div className="text-center">
                    <CalIcon />
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1">Ders Programım</p>
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Sol menüden <strong className="text-gray-700 dark:text-gray-200">Ders Programım</strong> sekmesine tıkla</p>
    </div>
);

const ScheduleMockup2 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Haftalık Ders Programı</p>
                <div className="flex items-center gap-1.5 bg-teal-600 text-white text-[10px] font-semibold px-2 py-1 rounded-lg cursor-pointer hover:bg-teal-700 transition-colors">
                    <PlusIcon />
                    Ders Ekle
                </div>
            </div>
            {/* Haftalık tablo sim */}
            <div className="grid grid-cols-5 gap-1 mt-1">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map((d, i) => (
                    <div key={d} className="text-center">
                        <div className="text-[9px] text-gray-400 mb-1">{d}</div>
                        <div className={`h-12 rounded-lg text-[9px] flex items-center justify-center ${[0, 2, 4].includes(i) ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium' : 'bg-gray-50 dark:bg-slate-700 text-gray-300'}`}>
                            {[0, 2, 4].includes(i) ? '19:00' : '—'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Haftalık görünümü incele, <strong className="text-gray-700 dark:text-gray-200">Ders Ekle</strong> butonuna tıkla</p>
    </div>
);

const ScheduleMockup3 = () => {
    const [day, setDay] = useState('');
    const [time, setTime] = useState('');
    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2 shadow-lg">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Ders Programı Ekle</p>
                <div className="space-y-1.5">
                    <div>
                        <p className="text-[10px] text-gray-400 mb-1">Kurs Seç</p>
                        <select className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                            <option>Salsa Başlangıç</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 mb-1">Gün</p>
                            <select value={day} onChange={e => setDay(e.target.value)} className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                                <option value="">Seç</option>
                                <option>Pazartesi</option><option>Salı</option><option>Çarşamba</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 mb-1">Saat</p>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full text-[11px] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200" />
                        </div>
                    </div>
                </div>
                <div className={`w-full mt-1 py-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${day && time ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                    Kaydet
                </div>
            </div>
            <p className="text-[11px] text-center text-gray-400">Kurs, gün ve saati seçip <strong className="text-gray-700 dark:text-gray-200">Kaydet</strong>&apos;e bas</p>
        </div>
    );
};

const ScheduleMockup4 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Haftalık Ders Programı</p>
            {[
                { name: 'Salsa Başlangıç', day: 'Pazartesi', time: '19:00' },
                { name: 'Bachata Orta', day: 'Çarşamba', time: '20:00' },
                { name: 'Salsa Başlangıç', day: 'Cuma', time: '19:00' },
            ].map((l, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30">
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0">
                        <CheckIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate">{l.name}</p>
                        <p className="text-[9px] text-gray-400">{l.day}</p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-1.5 py-0.5 rounded-full">{l.time}</span>
                </div>
            ))}
        </div>
        <p className="text-[11px] text-center text-gray-400">Programın hazır! Dashboard&apos;dan da görülebilir.</p>
    </div>
);

/* --- Öğrenci Listesi Mockup'ları --- */
const StudentMockup1 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="flex gap-2">
            <div className="w-24 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-600 p-2 space-y-1">
                {['Özet', 'Kurslarım', 'Öğrencilerim', 'Ders Programım'].map((item, i) => (
                    <div key={item} className={`text-[9px] px-1.5 py-1 rounded ${i === 2 ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-bold' : 'text-gray-400'}`}>
                        {item}
                    </div>
                ))}
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-sky-300 dark:border-sky-600 p-3 flex items-center justify-center">
                <div className="text-center">
                    <UsersIcon />
                    <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-1">Öğrencilerim</p>
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Sol menüden <strong className="text-gray-700 dark:text-gray-200">Öğrencilerim</strong> sekmesine tıkla</p>
    </div>
);

const StudentMockup2 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Öğrencilerim</p>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <span className="text-[10px] text-gray-400">Ara…</span>
                </div>
            </div>
            {/* Filtre */}
            <div className="flex gap-1.5">
                {['Tümü', 'Salsa', 'Bachata'].map((f, i) => (
                    <span key={f} className={`text-[10px] px-2 py-0.5 rounded-full ${i === 0 ? 'bg-sky-600 text-white font-semibold' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>{f}</span>
                ))}
            </div>
            {/* Öğrenci listesi */}
            {['Ayşe Kaya', 'Mehmet Demir', 'Zeynep Çelik'].map((name, i) => (
                <div key={name} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{name}</p>
                        <p className="text-[9px] text-gray-400">{['Salsa Başlangıç', 'Bachata Orta', 'Salsa Başlangıç'][i]}</p>
                    </div>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map(j => (
                            <div key={j} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[7px] ${j <= [4, 3, 2][i] ? 'bg-emerald-500' : 'bg-red-400'}`}>
                                {j <= [4, 3, 2][i] ? '✓' : '✗'}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <p className="text-[11px] text-center text-gray-400">Kursa göre filtrele, isimle arama yap</p>
    </div>
);

const StudentMockup3 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 flex items-center justify-center text-white font-bold">A</div>
                <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Ayşe Kaya</p>
                    <p className="text-[10px] text-sky-600 dark:text-sky-400">Salsa Başlangıç</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Devamsızlık', value: '2', color: 'text-rose-600' },
                    { label: 'Katılım', value: '%83', color: 'text-emerald-600' },
                    { label: 'Seviye', value: 'Orta', color: 'text-amber-600' },
                ].map(s => (
                    <div key={s.label} className="text-center bg-gray-50 dark:bg-slate-700 rounded-lg p-2">
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="flex gap-1.5 mt-1">
                <div className="flex-1 text-[10px] text-center py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-semibold cursor-pointer">Mesaj Gönder</div>
                <div className="flex-1 text-[10px] text-center py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer">İlerleme Notu</div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Bir öğrenciye tıkla → detay kartını incele</p>
    </div>
);

/* --- Gelir/Bakiye Mockup'ları --- */
const EarningsMockup1 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="flex gap-2">
            <div className="w-24 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-600 p-2 space-y-1">
                {['Özet', 'Kurslarım', 'Öğrencilerim', 'Ders Programım', 'Kazançlarım'].map((item, i) => (
                    <div key={item} className={`text-[9px] px-1.5 py-1 rounded ${i === 4 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold' : 'text-gray-400'}`}>
                        {item}
                    </div>
                ))}
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-300 dark:border-amber-600 p-3 flex items-center justify-center">
                <div className="text-center">
                    <MoneyIcon />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Kazançlarım</p>
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Sol menüden <strong className="text-gray-700 dark:text-gray-200">Kazançlarım</strong> sekmesine tıkla</p>
    </div>
);

const EarningsMockup2 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: 'Bu Ay', value: '₺4.500', sub: '+12%', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' },
                    { label: 'Toplam', value: '₺18.200', sub: '6 ay', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30' },
                ].map(c => (
                    <div key={c.label} className={`rounded-xl border p-2.5 ${c.bg}`}>
                        <p className="text-[10px] text-gray-400 mb-0.5">{c.label}</p>
                        <p className={`text-base font-bold ${c.color}`}>{c.value}</p>
                        <p className="text-[9px] text-gray-400">{c.sub}</p>
                    </div>
                ))}
            </div>
            {/* Mini grafik sim */}
            <div className="space-y-1">
                <p className="text-[10px] text-gray-400">Aylık gelir</p>
                <div className="flex items-end gap-1 h-12">
                    {[30, 60, 45, 80, 65, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${h}%`, background: i === 5 ? '#d97706' : '#fde68a' }} />
                    ))}
                </div>
                <div className="flex justify-between text-[9px] text-gray-400">
                    {['Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub'].map(m => <span key={m}>{m}</span>)}
                </div>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Aylık ve toplam kazanç özetini gör</p>
    </div>
);

const EarningsMockup3 = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 p-3 space-y-2">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Kursa Göre Gelir</p>
            {[
                { name: 'Salsa Başlangıç', students: 8, amount: '₺2.400' },
                { name: 'Bachata Orta', students: 5, amount: '₺1.700' },
                { name: 'Tango İleri', students: 4, amount: '₺400' },
            ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate">{row.name}</p>
                        <p className="text-[9px] text-gray-400">{row.students} öğrenci</p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{row.amount}</span>
                </div>
            ))}
            {/* Gelir ekleme notu */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <span className="text-[10px] text-blue-600 dark:text-blue-400">💡</span>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">Gelir girişini "Gelir Ekle" butonuyla manuel yapabilirsin.</p>
            </div>
        </div>
        <p className="text-[11px] text-center text-gray-400">Kursa göre gelirleri detaylı incele</p>
    </div>
);

/* ═══════════════════════════════════════════
   ANA BİLEŞEN
═══════════════════════════════════════════ */
type SectionId = 'schedule' | 'students' | 'earnings';

const InstructorGuide: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<SectionId>('schedule');
    const [scheduleStep, setScheduleStep] = useState(0);
    const [studentStep, setStudentStep] = useState(0);
    const [earningsStep, setEarningsStep] = useState(0);

    const sections: { id: SectionId; icon: React.ReactNode; title: string; subtitle: string; color: string }[] = [
        { id: 'schedule', icon: <CalIcon />, title: 'Ders Programı', subtitle: 'Oluştur & Düzenle', color: 'teal' },
        { id: 'students', icon: <UsersIcon />, title: 'Öğrenci Listesi', subtitle: 'Görüntüle & Filtrele', color: 'sky' },
        { id: 'earnings', icon: <MoneyIcon />, title: 'Gelir / Bakiye', subtitle: 'Takip Et', color: 'amber' },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; btn: string; light: string }> = {
        teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-700 dark:text-teal-300', badge: 'bg-teal-600', btn: 'bg-teal-600 hover:bg-teal-700', light: 'bg-teal-100 dark:bg-teal-900/30' },
        sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-300 dark:border-sky-700', text: 'text-sky-700 dark:text-sky-300', badge: 'bg-sky-600', btn: 'bg-sky-600 hover:bg-sky-700', light: 'bg-sky-100 dark:bg-sky-900/30' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', light: 'bg-amber-100 dark:bg-amber-900/30' },
    };

    // Her seksiyon için adım konfigürasyonu
    const scheduleSteps = [
        { title: 'Ders Programım Sekmesi', desc: 'Eğitmen panelinin sol menüsünden "Ders Programım" sekmesine tıkla.', mockup: <ScheduleMockup1 /> },
        { title: 'Haftalık Görünüm', desc: 'Haftalık takvim görünümü açılır. Burada mevcut programını görebilir, yeni ders saati eklemek için "Ders Ekle" butonuna tıklayabilirsin.', mockup: <ScheduleMockup2 /> },
        { title: 'Ders Bilgilerini Gir', desc: 'Açılan formda hangi kursa (Salsa, Bachata…), hangi gün ve saatte ders vereceğini seç. Tamamlayınca "Kaydet" butonuna bas.', mockup: <ScheduleMockup3 /> },
        { title: 'Program Hazır!', desc: 'Kaydedilen dersler haftalık takvimde görünür. Anasayfadaki "Yaklaşan Dersler" bölümünde de otomatik güncellenir.', mockup: <ScheduleMockup4 /> },
    ];

    const studentSteps = [
        { title: 'Öğrencilerim Sekmesi', desc: 'Sol menüden "Öğrencilerim" sekmesine tıkla. Tüm kurslarına kayıtlı öğrenciler listelenir.', mockup: <StudentMockup1 /> },
        { title: 'Filtrele ve Ara', desc: 'Kurs seçerek öğrenci listesini filtrele ya da isim arama kutusunu kullan. Yoklama ikonları öğrencilerin devamsızlık durumunu gösterir.', mockup: <StudentMockup2 /> },
        { title: 'Öğrenci Detayı', desc: 'Bir öğrenciye tıklayınca detay kartı açılır: devamsızlık, katılım oranı, dans seviyesi. Buradan öğrenciye mesaj gönderebilir veya ilerleme notu yazabilirsin.', mockup: <StudentMockup3 /> },
    ];

    const earningsSteps = [
        { title: 'Kazançlarım Sekmesi', desc: 'Sol menüden "Kazançlarım" sekmesine tıkla. Gelir özeti ve grafik seni karşılar.', mockup: <EarningsMockup1 /> },
        { title: 'Özet Kartlar & Grafik', desc: 'Bu aydaki kazancın ve toplam kazancın üstte gösterilir. Altta aylık gelir grafiği bulunur. Hangi ayın ne kadar getirdiğini görebilirsin.', mockup: <EarningsMockup2 /> },
        { title: 'Kursa Göre Gelir', desc: 'Hangi kursun ne kadar kazandırdığını tablo halinde görebilirsin. Gelir girişini "Gelir Ekle" butonuyla manuel olarak de yapabilirsin.', mockup: <EarningsMockup3 /> },
    ];

    const allSteps = { schedule: scheduleSteps, students: studentSteps, earnings: earningsSteps };
    const allStepNums = { schedule: scheduleStep, students: studentStep, earnings: earningsStep };
    const allSetters = { schedule: setScheduleStep, students: setStudentStep, earnings: setEarningsStep };

    const cur = activeSection;
    const steps = allSteps[cur];
    const stepNum = allStepNums[cur];
    const setStep = allSetters[cur];
    const c = colorMap[sections.find(s => s.id === cur)!.color];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">

                {/* ── Başlık ── */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                        <CalIcon />
                        Eğitmen Paneli Rehberi
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Eğitmen Panelini Nasıl Kullanırım?
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Ders programı oluşturma, öğrenci listesi görme ve gelir takibi — hepsini admine ihtiyaç duymadan kendin yapabilirsin.
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
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${isActive ? sc.badge + ' text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 group-hover:' + sc.light}`}>
                                    {s.icon}
                                </div>
                                <p className={`text-sm font-bold transition-colors ${isActive ? sc.text : 'text-gray-700 dark:text-gray-300'}`}>{s.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.subtitle}</p>
                            </button>
                        );
                    })}
                </div>

                {/* ── Aktif Seksiyon ── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl mb-10">
                    {/* Üst başlık */}
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

                        {/* Mini adım indikatörü */}
                        <div className="flex gap-1.5 mb-6">
                            {steps.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStep(i)}
                                    className={`h-1.5 rounded-full transition-all ${i === stepNum ? `flex-1 ${c.badge}` : 'w-8 bg-gray-200 dark:bg-slate-700'}`}
                                />
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Açıklama */}
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${c.bg} ${c.text}`}>
                                    Adım {stepNum + 1}: {steps[stepNum].title}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {steps[stepNum].desc}
                                </p>

                                {/* Seksiyon özel bilgi kutuları */}
                                {cur === 'schedule' && stepNum === 2 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>💡 İpucu</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Aynı kursa birden fazla gün ve saat ekleyebilirsin. Örneğin Salsa için Pazartesi 19:00 ve Çarşamba 20:00 gibi.</p>
                                    </div>
                                )}
                                {cur === 'students' && stepNum === 1 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>📊 Devamsızlık ikonları ne anlama gelir?</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-emerald-500 rounded-full text-white text-[8px] flex items-center justify-center">✓</span> Katıldı</span>
                                            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-400 rounded-full text-white text-[8px] flex items-center justify-center">✗</span> Gelmedi</span>
                                        </div>
                                    </div>
                                )}
                                {cur === 'earnings' && stepNum === 2 && (
                                    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
                                        <p className={`text-xs font-semibold ${c.text} mb-1`}>💡 Gelir manuel nasıl eklenir?</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Kazançlarım sekmesinde "Gelir Ekle" butonuna tıkla, kursu ve tutarı gir. Ödeme seni platform dışında gerçekleşse de buraya kayıt edebilirsin.</p>
                                    </div>
                                )}

                                {/* Tüm adımlar listesi */}
                                <div className="space-y-1.5 pt-1">
                                    {steps.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setStep(i)}
                                            className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm
                        ${i === stepNum ? `${c.bg} ${c.border} border font-semibold ${c.text}` : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${i < stepNum ? c.badge + ' text-white' : i === stepNum ? c.badge + ' text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-400'}`}>
                                                {i < stepNum ? <CheckIcon /> : i + 1}
                                            </div>
                                            {s.title}
                                        </button>
                                    ))}
                                </div>

                                {/* İleri / Geri */}
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

                {/* ── Bilgi kutuları ── */}
                <section className="bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/10 dark:to-sky-900/10 rounded-2xl p-8 border border-teal-100 dark:border-teal-800/30 mb-10">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">⚡ Hızlı Hatırlatmalar</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { emoji: '📅', title: 'Program & Kurs Bağlantısı', desc: 'Ders programı kurslarınla bağlantılıdır. Önce kursu oluştur, sonra programa ekle.' },
                            { emoji: '👥', title: 'Öğrenci Otomatik Eklenir', desc: 'Bir öğrenci kursa kaydolduğunda, listene otomatik eklenir. Manuel işlem gerekmez.' },
                            { emoji: '💰', title: 'Ödeme Platform Dışı', desc: 'Ücret tahsilatı seninle öğrenci arasında gerçekleşir. Geliri Kazançlarım\'dan takip edebilirsin.' },
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Eğitmen paneline geç ve hemen başla!</p>
                    <Button onClick={() => navigate('/instructor')}>
                        Eğitmen Paneline Git →
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default InstructorGuide;
