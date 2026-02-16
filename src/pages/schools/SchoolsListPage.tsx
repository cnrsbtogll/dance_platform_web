import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DanceSchool } from '../../types';
import { getAllDanceSchools } from '../../api/services/schoolService';
import SchoolCard from '../../common/components/schools/SchoolCard';

const SchoolsListPage: React.FC = () => {
  const [schools, setSchools] = useState<DanceSchool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'courseCount'>('name');

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        const schoolsData = await getAllDanceSchools();

        // Sıralama işlemi
        const sortedSchools = [...schoolsData].sort((a, b) => {
          switch (sortBy) {
            case 'name':
              // İsim undefined ise boş string olarak değerlendir
              const nameA = a.name || '';
              const nameB = b.name || '';
              return nameA.localeCompare(nameB);
            case 'rating':
              return (b.rating || 0) - (a.rating || 0);
            case 'courseCount':
              return (b.courseCount || 0) - (a.courseCount || 0);
            default:
              return 0;
          }
        });

        setSchools(sortedSchools);
      } catch (err) {
        console.error('Dans okulları yüklenirken hata oluştu:', err);
        setError('Dans okulları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-brand-pink">
                  <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Ana Sayfa
                </Link>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Dans Okulları</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight inline-block mb-4">
            Dans Okulları
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            Türkiye'nin dört bir yanından kaliteli dans okullarını keşfedin ve size en uygun olanı bulun.
          </p>
        </div>

        {/* Sıralama Seçenekleri */}
        <div className="mb-8">
          <div className="flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'courseCount')}
              className="block w-48 px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-pink focus:border-brand-pink sm:text-sm rounded-md"
            >
              <option value="name">İsme Göre</option>
              <option value="rating">Puana Göre</option>
              <option value="courseCount">Kurs Sayısına Göre</option>
            </select>
          </div>
        </div>

        {/* Yükleniyor */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-600">Dans okulları yükleniyor...</span>
          </div>
        )}

        {/* Hata */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Okul Listesi */}
        {!loading && !error && schools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        )}

        {/* Sonuç Yok */}
        {!loading && !error && schools.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Dans Okulu Bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Henüz sistemde kayıtlı dans okulu bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolsListPage; 