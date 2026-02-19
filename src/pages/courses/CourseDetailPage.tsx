import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { DanceClass } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ContactButton from '../../common/components/ui/ContactButton';
import { getCourseImage } from '../../common/utils/imageUtils';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<Record<string, string | undefined>>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<DanceClass | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!id) {
        setError("Kurs ID'si bulunamadı");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const courseRef = doc(db, 'courses', id);
        const courseDoc = await getDoc(courseRef);

        if (courseDoc.exists()) {
          setCourse({
            id: courseDoc.id,
            ...courseDoc.data()
          } as DanceClass);
        } else {
          setError('Kurs bulunamadı');
        }
      } catch (err) {
        console.error('Kurs bilgisi çekilirken hata oluştu:', err);
        setError('Kurs bilgisi yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  // Seviyeye göre Türkçe adı
  const getLevelName = (level?: string) => {
    if (!level) return '';

    switch (level.toLowerCase()) {
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

  // Dans stiline göre Türkçe adı
  const getDanceStyleName = (style?: string) => {
    if (!style) return '';

    switch (style.toLowerCase()) {
      case 'salsa':
        return 'Salsa';
      case 'bachata':
        return 'Bachata';
      case 'kizomba':
        return 'Kizomba';
      case 'tango':
        return 'Tango';
      default:
        return style;
    }
  };

  // Tarihi formatla
  const formatDate = (date: any) => {
    if (!date) return '';

    const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Kursa kaydol
  const handleEnroll = async () => {
    if (!currentUser) {
      navigate('/signin', { state: { returnUrl: `/courses/${id}` } });
      return;
    }

    // Burada kursa kaydolma işlemi yapılacak
    alert('Kursa kaydolma işlevi henüz eklenmedi. Yakında aktifleşecek!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-pink">
                  <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link to="/courses" className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-pink md:ml-2">
                    Kurslar
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2">
                    {loading ? 'Yükleniyor...' : course?.name || 'Kurs Detayı'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Yükleniyor */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Kurs detayları yükleniyor...</span>
          </div>
        )}

        {/* Hata */}
        {error && !loading && (
          <div className="max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 my-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <Link
                    to="/courses"
                    className="text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    Kurslara Geri Dön
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kurs Detayları */}
        {!loading && !error && course && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden">
              {/* Kurs Resmi */}
              <div className="relative h-64 sm:h-80 bg-gray-200">
                <img
                  src={getCourseImage(course.imageUrl, course.danceStyle)}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-slate-800 shadow-md text-gray-800 dark:text-gray-200">
                    {getDanceStyleName(course.danceStyle)}
                  </span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-slate-800 shadow-md text-gray-800 dark:text-gray-200">
                    {getLevelName(course.level)}
                  </span>
                </div>
              </div>

              {/* Kurs İçeriği */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{course.name}</h1>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>Eğitmen: {course.instructorName}</span>
                    </div>
                    {course.schoolName && (
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4z" clipRule="evenodd" />
                        </svg>
                        <span>Okul: {course.schoolName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-initial mt-6 lg:mt-0">
                    <div className="text-2xl font-bold text-brand-pink">
                      {course.price.toLocaleString('tr-TR')} {course.currency === 'TRY' ? '₺' : course.currency === 'USD' ? '$' : '€'}
                    </div>
                    <ContactButton
                      course={course}
                      variant="primary"
                      fullWidth
                      disabled={course.currentParticipants >= course.maxParticipants}
                      className="mt-4"
                    />
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {course.currentParticipants >= course.maxParticipants
                        ? 'Kontenjan Dolu'
                        : `${course.maxParticipants - course.currentParticipants} kişilik kontenjan kaldı`}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Kurs Bilgileri</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-400">Süre: {course.duration} dakika</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-400">
                        {course.recurring ? 'Periyodik Ders' : formatDate(course.date)}
                      </span>
                    </div>
                    {course.recurring && course.daysOfWeek && (
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400">Günler: {course.daysOfWeek.join(', ')}</span>
                      </div>
                    )}
                    {course.time && (
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400">Saat: {course.time}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Açıklama</h2>
                  <div className="mt-2 text-gray-600 dark:text-gray-400">
                    <p>{course.description || 'Bu kurs için henüz detaylı bir açıklama eklenmemiştir.'}</p>
                  </div>
                </div>

                {course.location && (
                  <div className="mt-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Lokasyon</h2>
                    <div className="mt-2 text-gray-600 dark:text-gray-400">
                      <p>{course.location.address}</p>
                      <p>{course.location.city}, {course.location.state} {course.location.zipCode}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Diğer Kursları Keşfet */}
            <div className="mt-10 flex justify-center">
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-pink hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
              >
                <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Diğer Kursları Keşfet
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage; 