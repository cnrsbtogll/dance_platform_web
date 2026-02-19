import React, { useState } from 'react';
import { DanceClass } from '../../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { getCourseImage } from '../../../common/utils/imageUtils';

interface CourseCardProps {
  course: DanceClass;
  onEnroll?: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const navigate = useNavigate();

  // Dans stiline göre renk
  const getDanceStyleColor = (style: string) => {
    switch (style) {
      case 'salsa':
        return 'bg-red-500';
      case 'bachata':
        return 'bg-purple-500';
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

  // Ders zamanını formatla
  const formatSchedule = () => {
    if (course.recurring && course.daysOfWeek?.length) {
      const days = course.daysOfWeek
        .map(day => {
          switch (day.toLowerCase()) {
            case 'monday': return 'Pts';
            case 'tuesday': return 'Sal';
            case 'wednesday': return 'Çar';
            case 'thursday': return 'Per';
            case 'friday': return 'Cum';
            case 'saturday': return 'Cts';
            case 'sunday': return 'Paz';
            default: return day.substring(0, 3);
          }
        })
        .join(', ');
      return `${days} ${course.time}`;
    }
    return `${formatDate(course.date)} ${course.time}`;
  };

  // Fiyatı formatla (1000 -> 1.000 ₺)
  const formatPrice = () => {
    const currencySymbol = course.currency === 'TRY' ? '₺' : course.currency === 'USD' ? '$' : '€';
    return `${course.price.toLocaleString('tr-TR')} ${currencySymbol}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Modal açıldığında veya butonlara tıklandığında navigasyonu engelle
    if (isContactModalOpen) return;
    navigate(`/courses/${course.id}`);
  };

  const ContactModal = () => (
    <Transition appear show={isContactModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsContactModalOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  {course.name} - İletişim Bilgileri
                </Dialog.Title>

                <div className="mt-2 space-y-4">
                  {course.schoolName && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dans Okulu</h4>
                      <p className="text-base text-gray-900 dark:text-white">{course.schoolName}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Eğitmen</h4>
                    <p className="text-base text-gray-900 dark:text-white">{course.instructorName}</p>
                  </div>

                  {course.phoneNumber && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefon</h4>
                      <a
                        href={`tel:${course.phoneNumber}`}
                        className="text-base text-brand-pink hover:text-indigo-800"
                      >
                        {course.phoneNumber}
                      </a>
                    </div>
                  )}

                  {course.email && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">E-posta</h4>
                      <a
                        href={`mailto:${course.email}`}
                        className="text-base text-brand-pink hover:text-indigo-800"
                      >
                        {course.email}
                      </a>
                    </div>
                  )}

                  {course.location?.address && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Adres</h4>
                      <p className="text-base text-gray-900 dark:text-white">{course.location.address}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      * Lütfen iletişime geçerken bu kursun adını belirtmeyi unutmayın.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-rose-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsContactModalOpen(false);
                    }}
                  >
                    Kapat
                  </button>
                  {course.phoneNumber && (
                    <a
                      href={`tel:${course.phoneNumber}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex justify-center rounded-md border border-transparent bg-brand-pink px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2"
                    >
                      Hemen Ara
                    </a>
                  )}
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

          {/* Zamanlama rozeti */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 px-3 py-1 text-sm font-medium rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSchedule()}
          </div>
        </div>

        {/* Kurs Bilgileri - flex-grow ile kalan alanı doldur */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Üst Kısım */}
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex space-x-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDanceStyleColor(course.danceStyle)} text-white`}>
                  {getDanceStyleName(course.danceStyle)}
                </span>
                {course.recurring && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    Periyodik
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-brand-pink">
                {formatPrice()}
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.name}</h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {course.instructorName}
              {course.schoolName && ` • ${course.schoolName}`}
            </p>

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
                          : 'bg-gradient-to-r from-emerald-500 to-green-600'
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
              <Link
                to={`/courses/${course.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-2 px-4 text-sm font-medium rounded-md text-brand-pink bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink text-center"
              >
                Detaylar
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsContactModalOpen(true);
                }}
                disabled={course.currentParticipants >= course.maxParticipants}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${course.currentParticipants >= course.maxParticipants
                  ? 'bg-gray-300 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
              >
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      </div >
      <ContactModal />
    </>
  );
};

export default CourseCard;