import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Instructor, UserWithProfile, DanceClass, DanceSchool } from '../../types';
import { motion } from 'framer-motion';
import { fetchAllInstructors } from '../../api/services/userService';
import InstructorCard from '../../common/components/instructors/InstructorCard';
import { getFeaturedDanceCourses } from '../../api/services/courseService';
import { getFeaturedDanceSchools } from '../../api/services/schoolService';
import { generateInitialsAvatar } from '../../common/utils/imageUtils';
import SchoolCard from '../../common/components/schools/SchoolCard';

interface HomePageProps {
  isAuthenticated: boolean;
  user?: User | null;
}

// Birleştirilmiş eğitmen verisi için tip tanımı
interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

function HomePage({ isAuthenticated, user }: HomePageProps) {
  const hasInstructorRole = user?.role?.includes('instructor');
  const hasSchoolAdminRole = user?.role?.includes('school_admin');
  const hasSuperAdminRole = user?.role?.includes('admin');

  // Eğitmen verilerini saklamak için state tanımlayalım
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [schools, setSchools] = useState<DanceSchool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Component yüklendiğinde verileri çekelim
  useEffect(() => {
    const loadData = async () => {
      // Yükleme durumunu başlat
      setLoading(true);
      setError(null);

      try {
        // 1. Önce eğitmenleri çek
        const fetchedInstructors = await fetchAllInstructors();
        console.log("Tüm eğitmenler:", fetchedInstructors);

        // Eğitmenleri tecrübeye göre sıralayalım (yüksekten düşüğe)
        const sortedInstructors = [...fetchedInstructors].sort((a, b) => {
          const experienceA = a.experience || 0;
          const experienceB = b.experience || 0;
          return Number(experienceB) - Number(experienceA);
        });

        // Eğitmenleri set et
        setInstructors(sortedInstructors);
      } catch (instructorError) {
        console.error('Eğitmenler yüklenirken hata:', instructorError);
        setInstructors([]);
      }

      try {
        // 2. Dans kurslarını çek
        const featuredClasses = await getFeaturedDanceCourses();
        console.log("Öne çıkan dans kursları:", featuredClasses);
        setClasses(featuredClasses);
      } catch (classError) {
        console.error('Dans kursları yüklenirken hata:', classError);
        setClasses([]);
      }

      try {
        // 3. Dans okullarını çek
        const featuredSchools = await getFeaturedDanceSchools();
        console.log("Öne çıkan dans okulları:", featuredSchools);
        setSchools(featuredSchools);
      } catch (schoolError) {
        console.error('Dans okulları yüklenirken hata:', schoolError);
        setSchools([]);
      }

      // Her durumda yüklemeyi tamamla
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 relative bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight py-2 inline-block max-w-full">
            Feriha'ya Hoş Geldiniz
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Dans tutkunuzu geliştirin, yeni partnerler bulun ve yeteneklerinizi sergileyin. Dansın her adımında yanınızdayız.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Partner Bul Kartı */}
            <Link
              to="/partners"
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-red-100"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-28 w-28 rounded-full bg-red-500 opacity-10 group-hover:opacity-20 transition-all duration-300 group-hover:scale-110"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-500 mb-4 group-hover:scale-110 transform transition-transform duration-300 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Partner Bul</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Dans partnerinizi bulun ve birlikte dans etmeye başlayın.</p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-red-500 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Keşfet →</span>
              </div>
            </Link>

            {/* Kurs Bul Kartı */}
            <Link
              to="/courses"
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-violet-100"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-28 w-28 rounded-full bg-violet-500 opacity-10 group-hover:opacity-20 transition-all duration-300 group-hover:scale-110"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mb-4 group-hover:scale-110 transform transition-transform duration-300 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Dans Kursu Bul</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Size en uygun dans kursunu keşfedin ve hemen başlayın.</p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-violet-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Keşfet →</span>
              </div>
            </Link>

            {/* Festivaller Kartı */}
            <Link
              to="/festivals"
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-amber-100"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-28 w-28 rounded-full bg-amber-400 opacity-10 group-hover:opacity-20 transition-all duration-300 group-hover:scale-110"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mb-4 group-hover:scale-110 transform transition-transform duration-300 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Festivaller</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Dans festivallerini keşfedin ve unutulmaz deneyimler yaşayın.</p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-amber-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Keşfet →</span>
              </div>
            </Link>

            {/* Geceler Kartı */}
            <Link
              to="/nights"
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-teal-100"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-28 w-28 rounded-full bg-teal-600 opacity-10 group-hover:opacity-20 transition-all duration-300 group-hover:scale-110"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mb-4 group-hover:scale-110 transform transition-transform duration-300 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Dans Geceleri</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Özel dans gecelerinde eğlenceye katılın ve dans edin.</p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-teal-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Keşfet →</span>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Instructors Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Öne Çıkan Eğitmenler</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Uzman eğitmenlerimizle dans becerilerinizi geliştirin ve profesyonel teknikler öğrenin.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-600">Eğitmenler yükleniyor...</span>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Henüz eğitmen bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {instructors.slice(0, 4).map((instructor, index) => (
              <InstructorCard
                key={instructor.id}
                instructor={instructor}
                index={index}
              />
            ))}
          </div>
        )}

        {instructors.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/instructors"
              className="inline-flex items-center justify-center rounded-md bg-brand-pink px-6 py-3 text-base font-medium text-white shadow-md hover:bg-rose-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2"
            >
              Tüm Eğitmenleri Keşfet
            </Link>
          </div>
        )}
      </div>

      {/* Featured Dance Classes */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Öne Çıkan Dans Kursları</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            En popüler dans kurslarımızı keşfedin ve dans yolculuğunuza hemen başlayın.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-600">Dans kursları yükleniyor...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Henüz dans kursu bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {classes.map((danceClass) => (
              <Link
                key={danceClass.id}
                to={`/courses/${danceClass.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={danceClass.imageUrl || `/assets/images/dance/class${Math.floor(Math.random() * 4) + 1}.jpg`}
                    alt={danceClass.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 bg-brand-pink text-white text-xs font-bold px-2 py-1 m-2 rounded">
                    {danceClass.level || 'Tüm Seviyeler'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{danceClass.name}</h3>
                  <p className="text-brand-pink font-medium mb-2">{danceClass.danceStyle || 'Çeşitli'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-bold">{danceClass.price || '?'} {danceClass.currency || 'TRY'}</span>
                    <span className="text-gray-500 text-sm">{danceClass.duration || 60} dk</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-md bg-brand-pink px-6 py-3 text-base font-medium text-white shadow-md hover:bg-rose-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2"
          >
            Tüm Kursları Keşfet
          </Link>
        </div>
      </div>

      {/* Featured Dance Schools */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Öne Çıkan Dans Okulları</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Türkiye'nin her yerindeki kaliteli dans okullarını keşfedin ve size uygun olanı bulun.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-gray-600">Dans okulları yükleniyor...</span>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Henüz dans okulu bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/schools"
            className="inline-flex items-center justify-center rounded-md bg-brand-pink px-6 py-3 text-base font-medium text-white shadow-md hover:bg-rose-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2"
          >
            Tüm Dans Okullarını Keşfet
          </Link>
        </div>
      </div>

      {/* Call to Action */}
      {!isAuthenticated && (
        <div className="bg-rose-700 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Dans Topluluğumuza Katılın</h2>
              <p className="text-indigo-200 mb-8">
                Hemen kayıt olun ve dans dünyasının tüm avantajlarından yararlanmaya başlayın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-rose-700 shadow-md hover:bg-rose-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rose-700"
                >
                  Ücretsiz Kayıt Ol
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center rounded-md bg-brand-pink border border-white px-6 py-3 text-base font-medium text-white hover:bg-indigo-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rose-700"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage; 