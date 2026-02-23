import React, { useState, useEffect, Fragment } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { DanceClass } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { getCourseImage } from '../../common/utils/imageUtils';
import { ChatDialog } from '../../features/chat/components/ChatDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY_MAP: Record<string, string> = {
  monday: 'Pzt', tuesday: 'Sal', wednesday: 'Çar', thursday: 'Per',
  friday: 'Cum', saturday: 'Cmt', sunday: 'Paz',
  pazartesi: 'Pzt', salı: 'Sal', çarşamba: 'Çar', perşembe: 'Per',
  cuma: 'Cum', cumartesi: 'Cmt', pazar: 'Paz',
};
const normDay = (d: string) => DAY_MAP[d.toLowerCase()] ?? d;

const LEVEL_MAP: Record<string, string> = {
  beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri', professional: 'Profesyonel',
};
const normLevel = (l?: string) => (l ? (LEVEL_MAP[l.toLowerCase()] ?? l) : '');

const fmtDate = (date: any): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const fmtCurrency = (price: number, currency?: string) => {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
  return `${sym}${price.toLocaleString('tr-TR')}`;
};

// ─── School data (minimal) ───────────────────────────────────────────────────
interface SchoolData {
  displayName?: string;
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
}

// ─── Extended course type from Firestore ────────────────────────────────────
interface CourseData extends DanceClass {
  participantStats?: { male?: number; female?: number; other?: number; total?: number };
  rating?: number;
  reviewCount?: number;
  studentIds?: string[];
  location?: any; // can be object with .type or .address
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Ic = {
  User: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  School: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Pin: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Star: ({ filled = true }: { filled?: boolean }) => (
    <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Home: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  ),
  Back: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  ),
};

// ─── Star Rating Display ──────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; count?: number; size?: 'sm' | 'md' }> = ({
  rating, count, size = 'sm',
}) => {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      {count !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({count})</span>
      )}
    </div>
  );
};

// ─── Chat Target Picker Modal ────────────────────────────────────────────────
const ChatPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  course: CourseData;
  school: SchoolData | null;
  onSelect: (target: { id: string; displayName: string; photoURL?: string; role: 'instructor' | 'school' }) => void;
}> = ({ isOpen, onClose, course, school, onSelect }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0"
        enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                    Kiminle İletişime Geçmek İstiyorsunuz?
                  </Dialog.Title>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.name}</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <Ic.X />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {/* Eğitmen seçeneği */}
                {course.instructorId && course.instructorName && (
                  <button
                    onClick={() => onSelect({ id: course.instructorId, displayName: course.instructorName!, role: 'instructor' })}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-brand-pink hover:bg-brand-light dark:hover:bg-rose-900/20 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-light dark:bg-rose-900/30 text-brand-pink flex items-center justify-center flex-shrink-0 group-hover:bg-brand-pink group-hover:text-white transition-colors">
                      <Ic.User />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Eğitmen</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{course.instructorName}</p>
                    </div>
                    <Ic.ChevronRight />
                  </button>
                )}
                {/* Okul seçeneği */}
                {course.locationType === 'school' && course.schoolId && (school?.displayName || school?.name || course.schoolName) && (
                  <button
                    onClick={() => onSelect({ id: course.schoolId!, displayName: school?.displayName || school?.name || course.schoolName!, role: 'school' })}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Ic.School />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Dans Okulu</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{school?.displayName || school?.name || course.schoolName}</p>
                    </div>
                    <Ic.ChevronRight />
                  </button>
                )}
                {!course.instructorId && !course.schoolId && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">İletişim bilgisi bulunamadı.</p>
                )}
              </div>
              <div className="px-4 pb-4">
                <button onClick={onClose} className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                  İptal
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

// ─── Profile Completion + Enroll Modal ───────────────────────────────────────
const EnrollModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (gender: string, phone: string) => void;
  course: CourseData;
  loading: boolean;
  needsGender: boolean;
  needsPhone: boolean;
}> = ({ isOpen, onClose, onConfirm, course, loading, needsGender, needsPhone }) => {
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const needsProfile = needsGender || needsPhone;
  const canSubmit = (!needsGender || gender !== '') && (!needsPhone || phone.trim() !== '');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0"
          enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-6">
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Kursa Kaydol
                </Dialog.Title>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <span className="font-medium text-slate-800 dark:text-white">{course.name}</span> kursuna kaydolmak istediğinizi onaylıyor musunuz?
                </p>

                {needsProfile && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-4 space-y-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Profilinizi Tamamlayın
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">Kayıt için aşağıdaki bilgileri tamamlayın.</p>

                    {needsGender && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cinsiyet <span className="text-brand-pink">*</span></label>
                        <div className="flex gap-2">
                          {['male', 'female', 'other'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGender(g)}
                              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer border-2 ${gender === g
                                ? 'bg-brand-pink border-brand-pink text-white'
                                : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-brand-pink'
                                }`}
                            >
                              {g === 'male' ? 'Erkek' : g === 'female' ? 'Kadın' : 'Diğer'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {needsPhone && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Telefon Numarası <span className="text-brand-pink">*</span></label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+90 5xx xxx xx xx"
                          className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-brand-pink placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-400 mt-1">Eğitmen sizinle iletişim kurmak için kullanabilir.</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  Kaydolduktan sonra ödeme bilgisi için okul ile iletişime geçmeniz gerekecektir.
                </p>

                <div className="flex gap-3">
                  <button onClick={onClose} disabled={loading}
                    className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50">
                    Vazgeç
                  </button>
                  <button
                    onClick={() => onConfirm(gender, phone)}
                    disabled={loading || !canSubmit}
                    className="flex-1 h-10 rounded-xl bg-brand-pink text-white text-sm font-medium hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : 'Kaydol'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// ─── Gender Distribution Bar ──────────────────────────────────────────────────
const GenderBar: React.FC<{ male: number; female: number; other: number }> = ({ male, female, other }) => {
  const total = male + female + other || 1;
  const malePct = Math.round((male / total) * 100);
  const femalePct = Math.round((female / total) * 100);
  const otherPct = 100 - malePct - femalePct;

  return (
    <div className="space-y-2.5">
      {/* Bar */}
      <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex">
        {malePct > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${malePct}%` }} />}
        {femalePct > 0 && <div className="bg-rose-400 transition-all" style={{ width: `${femalePct}%` }} />}
        {otherPct > 0 && <div className="bg-slate-300 dark:bg-slate-500" style={{ width: `${otherPct}%` }} />}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">Erkek <strong className="text-slate-800 dark:text-white">{male}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">Kadın <strong className="text-slate-800 dark:text-white">{female}</strong></span>
        </div>
        {other > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            <span className="text-slate-600 dark:text-slate-400">Diğer <strong className="text-slate-800 dark:text-white">{other}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CourseDetailPage: React.FC = () => {
  const { id } = useParams<Record<string, string | undefined>>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [needsGender, setNeedsGender] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  // Chat
  const [chatTarget, setChatTarget] = useState<{
    id: string; displayName: string; photoURL?: string; role: 'student' | 'instructor' | 'school' | 'partner';
  } | null>(null);

  // Fetch course + school
  useEffect(() => {
    if (!id) { setError("Kurs ID'si bulunamadı"); setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Course
        const cSnap = await getDoc(doc(db, 'courses', id));
        if (!cSnap.exists()) { setError('Kurs bulunamadı'); return; }
        const c = { id: cSnap.id, ...cSnap.data() } as CourseData;
        setCourse(c);

        // Check enrollment
        if (currentUser?.uid && c.studentIds?.includes(currentUser.uid)) {
          setEnrolled(true);
        }

        // Check profile completeness for enroll
        if (currentUser?.uid) {
          try {
            const uSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (uSnap.exists()) {
              const ud = uSnap.data();
              setNeedsGender(!ud.gender);
              setNeedsPhone(!ud.phoneNumber);
            }
          } catch { /* not critical */ }
        }

        // School — resolve schoolId from course or location
        const schoolId = c.schoolId || c.location?.schoolId;
        if (schoolId) {
          try {
            // Try schools collection first
            let sSnap = await getDoc(doc(db, 'schools', schoolId));

            // Fallback to users
            if (!sSnap.exists()) {
              sSnap = await getDoc(doc(db, 'users', schoolId));
            }

            if (sSnap.exists()) setSchool(sSnap.data() as SchoolData);
          } catch (err) {
            console.error('Okul detayları yüklenirken hata:', err);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Kurs bilgisi yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser?.uid]);

  // Enroll handler — receives gender & phone collected from modal
  const handleEnroll = async (gender: string, phone: string) => {
    if (!currentUser || !id) { navigate('/signin', { state: { returnUrl: `/courses/${id}` } }); return; }
    setEnrollLoading(true);
    try {
      // 1. Update user profile if needed
      if ((needsGender && gender) || (needsPhone && phone)) {
        const userRef = doc(db, 'users', currentUser.uid);
        const profileUpdate: Record<string, string> = {};
        if (needsGender && gender) profileUpdate.gender = gender;
        if (needsPhone && phone) profileUpdate.phoneNumber = phone;
        await updateDoc(userRef, profileUpdate);
        if (needsGender && gender) setNeedsGender(false);
        if (needsPhone && phone) setNeedsPhone(false);
      }

      // 2. Add student to course
      const courseRef = doc(db, 'courses', id);
      await updateDoc(courseRef, {
        studentIds: arrayUnion(currentUser.uid),
        currentParticipants: increment(1),
        // Update gender stats
        ...(gender || !needsGender ? {
          [`participantStats.${gender || 'other'}`]: increment(1),
          'participantStats.total': increment(1),
        } : {}),
      });

      setEnrolled(true);
      setEnrollOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setEnrollLoading(false);
    }
  };

  // Derived flags
  const isOwner = !!(currentUser && course && currentUser.uid === course.instructorId);
  const isFull = !!(course && course.currentParticipants >= course.maxParticipants);
  const canEnroll = !isOwner && !isFull && !enrolled;

  // Location text
  const getLocationText = () => {
    if (!course) return null;

    // 1. Yeni yapı: locationType kontrolü
    if (course.locationType === 'custom') {
      return course.customAddress || 'Adres belirtilmedi';
    }

    if (course.locationType === 'school' || !course.locationType) {
      const addr = school?.address || course.schoolAddress || (course as any).location?.address;
      const city = school?.city || school?.district || (course as any).location?.city;

      const parts = [addr, city].filter(Boolean);
      return parts.length ? parts.join(', ') : (school?.displayName || school?.name || course.schoolName || 'Okul Konumu');
    }

    // 2. Geriye dönük uyumluluk (Legacy)
    const loc = (course as any).location;
    if (!loc) return null;
    if (typeof loc === 'string') return loc;

    // Eğer loc objesi varsa ve içinde customAddress varsa
    if (loc.customAddress) return loc.customAddress;

    const parts = [loc.address, loc.city, loc.state].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Adres belirtilmedi';
  };

  // Days of week chips
  const getDayChips = () => {
    if (!course?.daysOfWeek?.length) return null;
    return course.daysOfWeek.map(d => normDay(d));
  };

  const locationText = course ? getLocationText() : null;
  const dayChips = course ? getDayChips() : null;
  const stats = course?.participantStats;
  const rating = course?.rating ?? 0;
  const reviewCount = course?.reviewCount ?? 0;

  // ── render ──
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-6 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-brand-pink transition-colors">
            <Ic.Home /> Ana Sayfa
          </Link>
          <Ic.ChevronRight />
          <Link to="/courses" className="hover:text-brand-pink transition-colors">Kurslar</Link>
          <Ic.ChevronRight />
          <span className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
            {loading ? 'Yükleniyor…' : course?.name ?? 'Kurs Detayı'}
          </span>
        </nav>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Yükleniyor…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-lg mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-6 text-center">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium mb-4">{error}</p>
            <Link to="/courses" className="text-sm font-medium text-red-700 dark:text-red-400 hover:underline">
              Kurslara Geri Dön
            </Link>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && course && (
          <div className="space-y-6">
            {/* Hero card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Cover image */}
              <div className="relative h-56 sm:h-72 bg-slate-200 dark:bg-slate-700">
                <img
                  src={getCourseImage(course.imageUrl, course.danceStyle)}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                {/* Badges on image */}
                <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                  {course.danceStyle && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-white shadow-sm backdrop-blur-sm">
                      {course.danceStyle}
                    </span>
                  )}
                  {course.level && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-pink/90 text-white shadow-sm backdrop-blur-sm">
                      {normLevel(course.level)}
                    </span>
                  )}
                  {!course.recurring && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/90 text-white shadow-sm backdrop-blur-sm">
                      Tek Seferlik
                    </span>
                  )}
                </div>

                {/* Rating on image */}
                {rating > 0 && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{rating.toFixed(1)}</span>
                    {reviewCount > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">({reviewCount})</span>}
                  </div>
                )}
              </div>

              {/* Content area */}
              <div className="p-5 sm:p-7">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left column */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                      {course.name}
                    </h1>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      {/* Instructor */}
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="text-brand-pink"><Ic.User /></span>
                        <span>
                          <span className="text-slate-400 dark:text-slate-500 mr-1">Eğitmen:</span>
                          <Link
                            to={`/instructors/${course.instructorId}`}
                            className="font-medium text-slate-800 dark:text-slate-200 hover:text-brand-pink dark:hover:text-brand-pink transition-colors"
                          >
                            {course.instructorName || '—'}
                          </Link>
                        </span>
                      </div>

                      {/* School / Freelance */}
                      {course.locationType === 'custom' ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="text-blue-500"><Ic.School /></span>
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 mr-1">Okul:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              Freelance
                            </span>
                          </span>
                        </div>
                      ) : (
                        (course.locationType === 'school' || !course.locationType) && (school?.displayName || school?.name || course.schoolName) ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="text-blue-500"><Ic.School /></span>
                            <span>
                              <span className="text-slate-400 dark:text-slate-500 mr-1">Okul:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {school?.displayName || school?.name || course.schoolName}
                              </span>
                            </span>
                          </div>
                        ) : null
                      )}

                      {/* Location */}
                      {locationText && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="text-emerald-500"><Ic.Pin /></span>
                          <span className="text-slate-800 dark:text-slate-200">{locationText}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating row (if exists) */}
                    {rating > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <StarRating rating={rating} count={reviewCount} size="sm" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">/ 5.0</span>
                      </div>
                    )}
                  </div>

                  {/* Right column — price + actions */}
                  <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                      {/* Price */}
                      <div>
                        <span className="text-2xl font-bold text-brand-pink">
                          {fmtCurrency(course.price, course.currency)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          {course.recurring ? '/ ay' : '/ ders'}
                        </span>
                      </div>

                      {/* Capacity */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1"><Ic.Users /> Kontenjan</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {course.currentParticipants} / {course.maxParticipants}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-brand-pink'}`}
                            style={{ width: `${Math.min(100, (course.currentParticipants / Math.max(1, course.maxParticipants)) * 100)}%` }}
                          />
                        </div>
                        {isFull ? (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">Kontenjan Dolu</p>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {course.maxParticipants - course.currentParticipants} kişilik yer kaldı
                          </p>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="space-y-2 pt-1">
                        {/* İletişime Geç */}
                        <button
                          onClick={() => setContactOpen(true)}
                          className="w-full h-10 rounded-xl border-2 border-brand-pink text-brand-pink text-sm font-semibold hover:bg-brand-pink hover:text-white transition-all cursor-pointer"
                        >
                          İletişime Geç
                        </button>

                        {/* Kursa Kaydol */}
                        {enrolled ? (
                          <div className="w-full h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                            <Ic.Check /> Kayıtlısınız
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!currentUser) { navigate('/signin', { state: { returnUrl: `/courses/${id}` } }); return; }
                              setEnrollOpen(true);
                            }}
                            disabled={!canEnroll}
                            title={isOwner ? 'Kendi kursunuza kaydolamazsınız' : isFull ? 'Kontenjan dolu' : undefined}
                            className={`w-full h-10 rounded-xl text-sm font-semibold transition-all cursor-pointer ${canEnroll
                              ? 'bg-brand-pink text-white hover:bg-rose-700 shadow-sm hover:shadow-md'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              }`}
                          >
                            {isOwner ? 'Kendi Kursunuz' : isFull ? 'Kontenjan Dolu' : 'Kursa Kaydol'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ders Bilgileri */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Ders Bilgileri</h2>
                <div className="space-y-3">
                  {/* Duration */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-brand-pink"><Ic.Clock /></span> Süre
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{course.duration} dakika</span>
                  </div>

                  {/* Time */}
                  {course.time && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="text-brand-pink"><Ic.Clock /></span> Saat
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{course.time}</span>
                    </div>
                  )}

                  {/* Days of week */}
                  {dayChips && dayChips.length > 0 ? (
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <span className="text-brand-pink"><Ic.Calendar /></span> Günler
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {dayChips.map(day => (
                          <span key={day} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light dark:bg-rose-900/30 text-brand-pink">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : !course.recurring && course.date ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="text-brand-pink"><Ic.Calendar /></span> Tarih
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDate(course.date)}</span>
                    </div>
                  ) : null}

                  {/* Level */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-brand-pink">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                      Seviye
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{normLevel(course.level)}</span>
                  </div>
                </div>
              </div>

              {/* Katılımcı Bilgileri */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Katılımcılar</h2>

                {/* Capacity visual */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Doluluk Oranı</span>
                    <span className="font-bold text-slate-800 dark:text-white text-base">
                      {course.currentParticipants} <span className="text-slate-400 font-normal text-sm">/ {course.maxParticipants}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-brand-pink'}`}
                      style={{ width: `${Math.min(100, (course.currentParticipants / Math.max(1, course.maxParticipants)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Gender distribution */}
                {stats && (stats.male !== undefined || stats.female !== undefined) && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cinsiyet Dağılımı</p>
                    <GenderBar
                      male={stats.male ?? 0}
                      female={stats.female ?? 0}
                      other={stats.other ?? 0}
                    />
                  </div>
                )}

                {/* Rating detail */}
                {rating > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Kurs Puanı</span>
                      <div className="flex items-center gap-2">
                        <StarRating rating={rating} size="sm" />
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{rating.toFixed(1)}</span>
                        {reviewCount > 0 && (
                          <span className="text-xs text-slate-400">({reviewCount} yorum)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Kurs Hakkında</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{course.description}</p>
              </div>
            )}

            {/* Highlights */}
            {course.highlights && course.highlights.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Öne Çıkanlar</h2>
                <ul className="space-y-2">
                  {course.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="mt-0.5 text-emerald-500 flex-shrink-0"><Ic.Check /></span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Back */}
            <div className="flex justify-start">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <Ic.Back /> Diğer Kurslara Dön
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {course && (
        <>
          <ChatPickerModal
            isOpen={contactOpen}
            onClose={() => setContactOpen(false)}
            course={course}
            school={school}
            onSelect={(target) => {
              setContactOpen(false);
              setChatTarget({ ...target, role: target.role as 'instructor' | 'school' | 'student' | 'partner' });
            }}
          />
          <EnrollModal
            isOpen={enrollOpen}
            onClose={() => setEnrollOpen(false)}
            onConfirm={handleEnroll}
            course={course}
            loading={enrollLoading}
            needsGender={needsGender}
            needsPhone={needsPhone}
          />
        </>
      )}
      {/* Chat Dialog */}
      {chatTarget && (
        <ChatDialog
          open={!!chatTarget}
          onClose={() => setChatTarget(null)}
          partner={chatTarget}
          chatType={chatTarget.role === 'school' ? 'student-school' : 'student-instructor'}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;