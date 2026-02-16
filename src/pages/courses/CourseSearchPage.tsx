import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { DanceClass } from '../../types';
import { useNavigate } from 'react-router-dom';
import CourseCard from './components/CourseCard';

// Filtreleme bileşenini import ediyoruz
import SearchFilters from './components/SearchFilters';

// Filtre değerleri için interface
interface FilterValues {
  seviye: string;
  fiyatAralik: string;
  arama: string;
  dansTuru: string;
  gun: string;
}

const CourseSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<DanceClass[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<DanceClass[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<DanceClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const coursesPerPage = 15;
  const observer = useRef<IntersectionObserver | null>(null);
  const lastCourseElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreCourses();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    seviye: '',
    fiyatAralik: '',
    arama: '',
    dansTuru: '',
    gun: ''
  });

  // Kursları Firestore'dan çekiyoruz
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedCourses: DanceClass[] = [];

        querySnapshot.forEach((doc) => {
          fetchedCourses.push({
            id: doc.id,
            ...doc.data(),
          } as DanceClass);
        });

        setCourses(fetchedCourses);
        setFilteredCourses(fetchedCourses);
        setDisplayedCourses(fetchedCourses.slice(0, coursesPerPage));
        setHasMore(fetchedCourses.length > coursesPerPage);
      } catch (error) {
        console.error('Kursları getirirken hata oluştu:', error);
        setError('Kurslar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filtre değişikliklerini izliyoruz
  useEffect(() => {
    applyFilters();
  }, [activeFilters, courses]);

  // Filtre değişiklik handler'ı
  const handleFilterChange = (filters: FilterValues) => {
    setActiveFilters(filters);
  };

  // Filtreleri uygulama fonksiyonu
  const applyFilters = () => {
    let result = [...courses];

    // Dans türü filtreleme
    if (activeFilters.dansTuru) {
      result = result.filter(
        (course) => course.danceStyle?.toLowerCase() === activeFilters.dansTuru.toLowerCase()
      );
    }

    // Seviye filtreleme
    if (activeFilters.seviye) {
      result = result.filter(
        (course) => course.level?.toLowerCase() === activeFilters.seviye.toLowerCase()
      );
    }

    // Gün filtreleme
    if (activeFilters.gun) {
      result = result.filter((course) => {
        if (activeFilters.gun === 'Hafta İçi') {
          return ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].some(
            (day) => course.daysOfWeek?.includes(day)
          );
        } else if (activeFilters.gun === 'Hafta Sonu') {
          return ['Cumartesi', 'Pazar'].some(
            (day) => course.daysOfWeek?.includes(day)
          );
        } else {
          return course.daysOfWeek?.includes(activeFilters.gun);
        }
      });
    }

    // Fiyat aralığı filtreleme
    if (activeFilters.fiyatAralik) {
      const [min, max] = activeFilters.fiyatAralik.split('-').map(Number);
      result = result.filter(
        (course) => {
          const price = Number(course.price);
          return price >= min && (max === 0 || price <= max);
        }
      );
    }

    // Arama filtreleme
    if (activeFilters.arama) {
      const searchTerm = activeFilters.arama.toLowerCase();
      result = result.filter(
        (course) =>
          course.name?.toLowerCase().includes(searchTerm) ||
          course.description?.toLowerCase().includes(searchTerm) ||
          course.instructorName?.toLowerCase().includes(searchTerm) ||
          course.danceStyle?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredCourses(result);
    // Filtreleme sonrası ilk sayfayı göster
    setDisplayedCourses(result.slice(0, coursesPerPage));
    setPage(1);
    setHasMore(result.length > coursesPerPage);
  };

  // Tekil filtre temizleme
  const clearFilter = (filterType: keyof FilterValues) => {
    setActiveFilters({
      ...activeFilters,
      [filterType]: ''
    });
  };

  // Tüm filtreleri temizleme
  const clearAllFilters = () => {
    setActiveFilters({
      seviye: '',
      fiyatAralik: '',
      arama: '',
      dansTuru: '',
      gun: ''
    });
  };

  // Kursa kayıt handler'ı
  const handleEnroll = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  // Aktif filtre var mı kontrolü
  const hasActiveFilters = useMemo(() => {
    return Object.values(activeFilters).some(filter => filter !== '');
  }, [activeFilters]);

  // Sonuç mesajı
  const resultMessage = useMemo(() => {
    if (loading) return null;

    if (filteredCourses.length === 0) {
      return 'Arama kriterlerinize uygun kurs bulunamadı.';
    }

    if (hasActiveFilters) {
      return `${filteredCourses.length} kurs bulundu.`;
    }

    return null;
  }, [filteredCourses.length, hasActiveFilters, loading]);

  // Daha fazla kurs yükleme fonksiyonu
  const loadMoreCourses = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const newCourses = filteredCourses.slice(startIndex, endIndex);

    if (newCourses.length > 0) {
      setDisplayedCourses(prev => [...prev, ...newCourses]);
      setPage(nextPage);
      setHasMore(endIndex < filteredCourses.length);
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bölümü */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-rose-600 leading-tight inline-block">
              Dans Kursu Bul
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Türkiye'nin en kapsamlı dans kursu arama platformu
            </p>
          </div>

          {/* Arama ve Filtreleme Bölümü */}
          <div className="mt-10">
            <SearchFilters onFilterChange={handleFilterChange} />
          </div>
        </div>
      </div>

      {/* Ana İçerik Bölümü */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Aktif Filtreler */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Aktif filtreler:</span>

              {activeFilters.arama && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-rose-100 text-rose-700">
                  Arama: {activeFilters.arama}
                  <button
                    type="button"
                    onClick={() => clearFilter('arama')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-brand-pink focus:outline-none"
                  >
                    <span className="sr-only">Aramayı kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {activeFilters.dansTuru && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-purple-100 text-purple-700">
                  Dans Türü: {activeFilters.dansTuru}
                  <button
                    type="button"
                    onClick={() => clearFilter('dansTuru')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-rose-600 focus:outline-none"
                  >
                    <span className="sr-only">Dans türünü kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {activeFilters.seviye && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-blue-100 text-blue-700">
                  Seviye: {activeFilters.seviye}
                  <button
                    type="button"
                    onClick={() => clearFilter('seviye')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                  >
                    <span className="sr-only">Seviyeyi kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {activeFilters.fiyatAralik && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-green-100 text-green-700">
                  Fiyat: {activeFilters.fiyatAralik.replace('-0', '+')} TL
                  <button
                    type="button"
                    onClick={() => clearFilter('fiyatAralik')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none"
                  >
                    <span className="sr-only">Fiyat aralığını kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {activeFilters.gun && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-pink-100 text-pink-700">
                  Gün: {activeFilters.gun}
                  <button
                    type="button"
                    onClick={() => clearFilter('gun')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-pink-400 hover:bg-pink-200 hover:text-pink-600 focus:outline-none"
                  >
                    <span className="sr-only">Günü kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm text-brand-pink hover:text-indigo-800 font-medium"
              >
                Tüm filtreleri temizle
              </button>
            </div>
          </div>
        )}

        {/* Sonuç Mesajı */}
        {resultMessage && (
          <div className="mb-6 text-sm font-medium text-gray-700">
            {resultMessage}
          </div>
        )}

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Yükleniyor */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-700">Kurslar yükleniyor...</span>
          </div>
        )}

        {/* Kurslar Grid - güncellendi */}
        {!loading && displayedCourses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course, index) => {
              if (displayedCourses.length === index + 1) {
                return (
                  <div ref={lastCourseElementRef} key={course.id}>
                    <CourseCard
                      course={course}
                      onEnroll={handleEnroll}
                    />
                  </div>
                );
              } else {
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEnroll={handleEnroll}
                  />
                );
              }
            })}
          </div>
        )}

        {/* Yükleniyor göstergesi */}
        {loadingMore && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-600">Daha fazla kurs yükleniyor...</span>
          </div>
        )}

        {/* Sonuç Yok */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Sonuç bulunamadı</h3>
            <p className="mt-1 text-gray-500">Arama kriterlerinize uygun kurs bulunamadı.</p>
            <div className="mt-6">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-pink hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSearchPage; 