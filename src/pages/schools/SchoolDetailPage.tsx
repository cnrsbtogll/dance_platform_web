import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDanceSchoolById } from '../../api/services/schoolService';
import { getSchoolDanceCourses } from '../../api/services/courseService';
import { DanceSchool, DanceClass } from '../../types';

const SchoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<DanceSchool | null>(null);
  const [courses, setCourses] = useState<DanceClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'courses' | 'instructors' | 'gallery'>('about');
  const [coursesError, setCoursesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (!id) {
        setError("Okul ID'si bulunamadı");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Okul bilgilerini getir
        const schoolData = await getDanceSchoolById(id);
        if (!schoolData) {
          setError('Okul bulunamadı');
          setLoading(false);
          return;
        }
        setSchool(schoolData);

        try {
          // Okulun kurslarını getir
          const coursesData = await getSchoolDanceCourses(id);
          setCourses(coursesData);
          setCoursesError(null);
        } catch (coursesErr: any) {
          console.error('Okul kursları yüklenirken hata oluştu:', coursesErr);
          // Kurslar yüklenemese bile sayfayı gösterelim, sadece kurslar kısmında hata gösterilecek
          if (coursesErr.message && coursesErr.message.includes('index')) {
            setCoursesError('Kurslar yüklenirken bir sorun oluştu. Sistem yöneticisi bu sorunu çözene kadar bekleyin.');
          } else {
            setCoursesError('Okul kursları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
          }
        }
      } catch (err: any) {
        console.error('Okul detayları yüklenirken hata oluştu:', err);
        if (err.code === 'permission-denied') {
          setError('Bu okul bilgilerine erişim izniniz bulunmuyor');
        } else if (err.code === 'not-found') {
          setError('Aradığınız okul bulunamadı');
        } else {
          setError('Okul bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Okul bilgileri yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    Geri Dön
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Okul bulunamadı</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Aradığınız dans okulu bulunamadı.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-pink hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-12 pb-16">
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
                  <Link to="/schools" className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-pink md:ml-2">
                    Dans Okulları
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2">
                    {school.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Okul Başlık ve Görsel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="relative h-64 bg-gray-200">
            <img
              src={school.gorsel || school.logo || school.images?.[0] || `/assets/images/dance/school${Math.floor(Math.random() * 4) + 1}.jpg`}
              alt={school.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{school.name}</h1>
              <div className="flex items-center text-white/90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {school.konum || school.address?.city || 'İstanbul'}, {school.ulke || school.address?.country || 'Türkiye'}
              </div>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="border-b border-gray-200 dark:border-slate-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('about')}
              className={`${
                activeTab === 'about'
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Hakkında
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`${
                activeTab === 'courses'
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Kurslar ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('instructors')}
              className={`${
                activeTab === 'instructors'
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Eğitmenler
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`${
                activeTab === 'gallery'
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Galeri
            </button>
          </nav>
        </div>

        {/* Hakkında */}
        {activeTab === 'about' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Okul Hakkında</h2>
            <div className="prose max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                {school.aciklama || school.description || 'Bu dans okulu hakkında detaylı bilgi bulunmamaktadır.'}
              </p>
            </div>

            {/* Dans Stilleri */}
            {school.danceStyles && school.danceStyles.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Dans Stilleri</h3>
                <div className="flex flex-wrap gap-2">
                  {school.danceStyles.map((style, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-indigo-800">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* İletişim Bilgileri */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">İletişim Bilgileri</h3>
              <div className="space-y-2">
                {school.telefon && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {school.telefon}
                  </div>
                )}
                {(school.contactInfo?.email || school.iletisim) && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {school.contactInfo?.email || school.iletisim}
                  </div>
                )}
                {(school.contactInfo?.website) && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={school.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-brand-pink hover:text-indigo-800">
                      {school.contactInfo.website}
                    </a>
                  </div>
                )}
                {school.address && (
                  <div className="flex items-start text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      {school.address?.street && <div>{school.address?.street}</div>}
                      {school.address?.city && <div>{school.address?.city}, {school.address?.zipCode || ''}</div>}
                      {school.address?.country && <div>{school.address?.country}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kurslar */}
        {activeTab === 'courses' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Okulun Kursları</h2>
            
            {/* Kurslar yüklenirken hata olduysa */}
            {coursesError && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">{coursesError}</p>
                    {coursesError.includes('yöneticisi') && (
                      <div className="mt-2 text-xs text-amber-600">
                        <p>
                          <strong>Yöneticiler için not:</strong> Firebase konsolunda, "schoolId" ve "createdAt" alanları için bir bileşik indeks oluşturmanız gerekiyor.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!coursesError && courses.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Bu okul için henüz kayıtlı kurs bulunmuyor.</p>
              </div>
            ) : (
              !coursesError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
                        <img
                          src={course.imageUrl || `/assets/images/dance/class${Math.floor(Math.random() * 4) + 1}.jpg`}
                          alt={course.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 right-0 bg-brand-pink text-white text-xs font-bold px-2 py-1 m-2 rounded">
                          {course.level || 'Tüm Seviyeler'}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{course.name}</h3>
                        <p className="text-brand-pink font-medium mb-2">{course.danceStyle || 'Çeşitli'}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300 font-bold">{course.price || '?'} {course.currency || 'TRY'}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">{course.duration || 60} dk</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Eğitmenler */}
        {activeTab === 'instructors' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Okulun Eğitmenleri</h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Bu okul için eğitmen bilgileri henüz eklenmemiştir.</p>
            </div>
          </div>
        )}

        {/* Galeri */}
        {activeTab === 'gallery' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Fotoğraf Galerisi</h2>
            {!school.images || school.images.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Bu okul için henüz fotoğraf eklenmemiştir.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {school.images.map((image, index) => (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                    <img
                      src={image}
                      alt={`${school.name} - Resim ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDetailPage; 