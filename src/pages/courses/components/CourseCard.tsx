import React, { useState, useEffect } from 'react';
import { DanceClass } from '../../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { getCourseImage } from '../../../common/utils/imageUtils';
import { ChatDialog } from '../../../features/chat/components/ChatDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

interface CourseCardProps {
  course: DanceClass;
  onEnroll?: (courseId: string) => void;
}

// Chat target tipi
interface ChatTarget {
  id: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'instructor' | 'school' | 'partner';
}

const PinIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [resolvedSchoolAddress, setResolvedSchoolAddress] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // locationType yoksa school olarak kabul et
  const effectiveLocationType = course.locationType || 'school';

  // Okul adresi yoksa schoolId ile Firebase'den çek
  useEffect(() => {
    if (effectiveLocationType !== 'school') return;

    const existingAddr = course.schoolAddress || (course as any).location?.address;
    if (existingAddr) {
      setResolvedSchoolAddress(existingAddr);
      return;
    }

    const schoolId = course.schoolId;
    if (!schoolId) return;

    const fetchSchoolAddress = async () => {
      try {
        // Önce schools koleksiyonunu dene
        let snap = await getDoc(doc(db, 'schools', schoolId));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'users', schoolId));
        }
        if (snap.exists()) {
          const data = snap.data();
          const addr = data.address || data.location?.address;
          const city = data.city || data.district;
          const parts = [addr, city].filter(Boolean);
          if (parts.length) setResolvedSchoolAddress(parts.join(', '));
        }
      } catch {
        // sessizce geç
      }
    };

    fetchSchoolAddress();
  }, [course.schoolId, course.schoolAddress, effectiveLocationType]);

  const hasInstructor = !!(course.instructorId && course.instructorName);
  const hasSchool = !!(course.schoolId && course.schoolName);

  // İletişime Geç tıklanınca: giriş yoksa signin'e yönlendir,
  // her iki taraf varsa picker aç, tek taraf varsa direkt chat aç
  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentUser) {
      navigate('/signin', { state: { returnUrl: `/courses/${course.id}` } });
      return;
    }
    if (hasInstructor && hasSchool) {
      setIsPickerOpen(true);
    } else if (hasInstructor) {
      setChatTarget({ id: course.instructorId, displayName: course.instructorName!, role: 'instructor' });
    } else if (hasSchool) {
      setChatTarget({ id: course.schoolId!, displayName: course.schoolName!, role: 'school' });
    } else {
      // Fallback – bilgi yok, detay sayfasına yönlendir
      navigate(`/courses/${course.id}`);
    }
  };

  // Dans stiline göre renk
  const getDanceStyleColor = (style: string) => {
    switch (style) {
      case 'salsa':
        return 'bg-red-500';
      case 'bachata':
        return 'bg-indigo-500';
      case 'kizomba':
        return 'bg-blue-500';
      case 'tango':
        return 'bg-orange-500';
      case 'vals':
        return 'bg-cyan-600';
      case 'hiphop':
        return 'bg-brand-pink';
      case 'modern-dans':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Seviyeye göre renk
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-orange-500';
      case 'professional':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Türkçe seviye adı
  const getLevelName = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Başlangıç';
      case 'intermediate':
        return 'Orta';
      case 'advanced':
        return 'İleri';
      case 'professional':
        return 'Profesyonel';
      default:
        return level;
    }
  };

  // Türkçe dans stili adı
  const getDanceStyleName = (style: string) => {
    switch (style) {
      case 'salsa':
        return 'Salsa';
      case 'bachata':
        return 'Bachata';
      case 'kizomba':
        return 'Kizomba';
      case 'tango':
        return 'Tango';
      case 'vals':
        return 'Vals';
      case 'hiphop':
        return 'Hip Hop';
      case 'modern-dans':
        return 'Modern Dans';
      case 'bale':
        return 'Bale';
      case 'flamenko':
        return 'Flamenko';
      case 'zeybek':
        return 'Zeybek';
      case 'jazz':
        return 'Jazz';
      case 'breakdance':
        return 'Breakdance';
      default:
        return style;
    }
  };

  // Tarihi formatla
  const formatDate = (date: Date | any) => {
    if (!date) return '';

    const d = new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Gün kısaltması
  const normDay = (day: string) => {
    switch (day.toLowerCase()) {
      case 'monday': return 'Pzt';
      case 'tuesday': return 'Sal';
      case 'wednesday': return 'Çar';
      case 'thursday': return 'Per';
      case 'friday': return 'Cum';
      case 'saturday': return 'Cts';
      case 'sunday': return 'Paz';
      default: return day.substring(0, 3);
    }
  };

  // Ders zamanını formatla (sadece saat - günler chip olarak gösterilecek)
  const formatSchedule = () => {
    if (course.recurring && course.daysOfWeek?.length) {
      return course.time || '';
    }
    return `${formatDate(course.date)} ${course.time || ''}`;
  };

  // Fiyatı formatla — recurring ise "/ay" ekle
  const formatPrice = () => {
    const currencySymbol = course.currency === 'TRY' ? '₺' : course.currency === 'USD' ? '$' : '€';
    const suffix = course.recurring ? '/ay' : '/ders';
    return `${course.price.toLocaleString('tr-TR')} ${currencySymbol} ${suffix}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isPickerOpen || chatTarget) return;
    navigate(`/courses/${course.id}`);
  };

  // Chat hedef seçim modalı (eğitmen + okul her ikisi de varsa gösterilir)
  const ChatPickerModal = () => (
    <Transition appear show={isPickerOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsPickerOpen(false)}>
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
                  <button onClick={() => setIsPickerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {hasInstructor && (
                    <button
                      onClick={() => { setIsPickerOpen(false); setChatTarget({ id: course.instructorId, displayName: course.instructorName!, role: 'instructor' }); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-brand-pink hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-brand-pink flex items-center justify-center flex-shrink-0 group-hover:bg-brand-pink group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Eğitmen</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{course.instructorName}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  {hasSchool && (
                    <button
                      onClick={() => { setIsPickerOpen(false); setChatTarget({ id: course.schoolId!, displayName: course.schoolName!, role: 'school' }); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Dans Okulu</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{course.schoolName}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <button onClick={() => setIsPickerOpen(false)}
                    className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
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

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Resim Konteyner - Sabit yükseklik */}
        <div className="relative h-48">
          <div className="absolute inset-0">
            <img
              src={getCourseImage(course.imageUrl, course.danceStyle)}
              alt={course.name}
              className={`w-full h-full object-cover object-center transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
              style={{ objectPosition: 'center center' }}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}></div>
          </div>

          {/* Seviye rozeti */}
          <div className={`absolute top-4 right-4 ${getLevelColor(course.level)} text-white px-3 py-1 text-sm font-medium rounded-full shadow-lg`}>
            {getLevelName(course.level)}
          </div>

          {/* Zamanlama rozeti - recurring ise sadece saat, değilse tarih+saat */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 px-3 py-1 text-sm font-medium rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSchedule() || 'Saat belirtilmedi'}
          </div>
        </div>

        {/* Kurs Bilgileri - flex-grow ile kalan alanı doldur */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Üst Kısım */}
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDanceStyleColor(course.danceStyle)} text-white`}>
                  {getDanceStyleName(course.danceStyle)}
                </span>
                {/* Periyodik ise gün chip'leri göster */}
                {course.recurring && course.daysOfWeek?.length ? (
                  course.daysOfWeek.map(day => (
                    <span key={day} className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {normDay(day)}
                    </span>
                  ))
                ) : !course.recurring && (
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    Tek Seferlik
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-brand-pink text-right leading-tight">
                <div>{formatPrice()}</div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.name}</h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {course.instructorName}
              {effectiveLocationType === 'custom'
                ? ' • Freelance'
                : (course.locationType === 'school' || !course.locationType) && course.schoolName
                  ? ` • ${course.schoolName}`
                  : ''}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
              <span className="text-emerald-500"><PinIcon /></span>
              <span className="line-clamp-1">
                {effectiveLocationType === 'custom'
                  ? (course.customAddress || 'Adres belirtilmedi')
                  : (resolvedSchoolAddress || course.schoolName || 'Okul Konumu')}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
              {course.description}
            </p>
          </div>

          {/* Alt Kısım - Katılımcı Durumu ve Butonlar */}
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 mr-3">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${course.currentParticipants / course.maxParticipants > 0.8
                        ? 'bg-red-500'
                        : course.currentParticipants / course.maxParticipants > 0.5
                          ? 'bg-yellow-500'
                          : 'bg-brand-pink'
                        }`}
                      style={{ width: `${(course.currentParticipants / course.maxParticipants) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-center min-w-[60px] text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                  {course.currentParticipants}/{course.maxParticipants}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {course.currentParticipants === course.maxParticipants
                  ? 'Kontenjan dolu'
                  : `${course.maxParticipants - course.currentParticipants} kişilik kontenjan kaldı`}
              </p>
            </div>

            {/* Butonlar */}
            <div className="flex space-x-2">
              <button
                onClick={handleContact}
                className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-brand-pink text-brand-pink hover:bg-brand-light dark:hover:bg-rose-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink transition-colors cursor-pointer"
              >
                İletişime Geç
              </button>
              <Link
                to={`/courses/${course.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-2 px-4 text-sm font-medium rounded-md bg-brand-pink text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink text-center transition-colors cursor-pointer"
              >
                Detaylar
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ChatPickerModal />
      {chatTarget && (
        <ChatDialog
          open={!!chatTarget}
          onClose={() => setChatTarget(null)}
          partner={chatTarget}
          chatType={chatTarget.role === 'school' ? 'student-school' : 'student-instructor'}
        />
      )}
    </>
  );
};

export default CourseCard;