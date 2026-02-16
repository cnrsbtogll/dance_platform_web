import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { fetchAllInstructors } from '../../api/services/userService';
import { Instructor, UserWithProfile } from '../../types';
import InstructorCard from '../../common/components/instructors/InstructorCard';
import CustomSelect from '../../common/components/ui/CustomSelect';

// Eğitmen ve kullanıcı bilgisini birleştiren tip tanımı
interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

const InstructorsListPage: React.FC = () => {
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [danceStyles, setDanceStyles] = useState<{ label: string; value: string; }[]>([]);
  const [loadingStyles, setLoadingStyles] = useState<boolean>(true);

  const loadInstructors = async () => {
    try {
      const fetchedInstructors = await fetchAllInstructors();

      console.log('Raw Fetched Instructors Data:', JSON.stringify(fetchedInstructors, null, 2));

      console.log('Instructor Details:', fetchedInstructors.map(instructor => ({
        id: instructor.id,
        name: instructor.user?.displayName || 'İsimsiz',
        email: instructor.user?.email,
        specialties: instructor.specialties || [],
        experience: instructor.experience,
        level: instructor.level,
        schoolId: instructor.schoolId,
        schoolName: instructor.schoolName,
        userId: instructor.userId,
        photoURL: instructor.user?.photoURL,
        availability: instructor.availability
      })));

      // Eğitmenleri tecrübeye göre sıralayalım (yüksekten düşüğe)
      const sortedInstructors = [...fetchedInstructors].sort((a, b) => {
        const experienceA = Number(a.experience) || 0;
        const experienceB = Number(b.experience) || 0;
        return experienceB - experienceA;
      });

      setInstructors(sortedInstructors);
    } catch (err) {
      console.error('Eğitmenler yüklenirken hata oluştu:', err);
      throw err;
    }
  };

  // Dans stillerini getir
  const fetchDanceStyles = async () => {
    try {
      const stylesRef = collection(db, 'danceStyles');
      const q = query(stylesRef, orderBy('label'));
      const querySnapshot = await getDocs(q);

      const styles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          label: data.label || data.name || '',
          value: data.value || doc.id
        };
      });

      console.log('Fetched Dance Styles:', styles);
      setDanceStyles(styles);
    } catch (error) {
      console.error('Dans stilleri yüklenirken hata:', error);
      // Hata durumunda varsayılan stiller
      const defaultStyles = [
        { label: 'Salsa', value: 'salsa' },
        { label: 'Bachata', value: 'bachata' },
        { label: 'Kizomba', value: 'kizomba' },
        { label: 'Tango', value: 'tango' },
        { label: 'Vals', value: 'vals' }
      ];
      console.log('Using default styles:', defaultStyles);
      setDanceStyles(defaultStyles);
    } finally {
      setLoadingStyles(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadInstructors(),
          fetchDanceStyles()
        ]);
      } catch (err) {
        console.error('Veriler yüklenirken hata:', err);
        setError('Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search ve filtreleme işlemleri
  const filteredInstructors = instructors.filter(instructor => {
    // İsme göre filtreleme
    const matchesSearch = searchTerm === '' ||
      (instructor.user.displayName && instructor.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Dans stiline göre filtreleme
    const matchesStyle = selectedStyle === '' ||
      (instructor.specialties && instructor.specialties.some(specialty =>
        specialty.toLowerCase() === selectedStyle.toLowerCase()
      ));

    // Log filtreleme detayları
    if (selectedStyle) {
      console.log('Filtering details for instructor:', {
        instructorId: instructor.id,
        name: instructor.user.displayName,
        specialties: instructor.specialties,
        selectedStyle,
        matchesStyle
      });
    }

    return matchesSearch && matchesStyle;
  });

  // Log filtered results
  useEffect(() => {
    if (selectedStyle) {
      console.log('Current filter state:', {
        selectedStyle,
        totalInstructors: instructors.length,
        filteredCount: filteredInstructors.length,
        allInstructors: instructors.map(instructor => ({
          id: instructor.id,
          name: instructor.user.displayName,
          specialties: instructor.specialties
        }))
      });
    }
  }, [selectedStyle, filteredInstructors.length, instructors]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
          <span className="ml-3 text-gray-600">Eğitmenler yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-brand-pink text-white py-2 px-4 rounded hover:bg-brand-pink transition"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 flex items-center">
        <Link to="/" className="hover:text-brand-pink">Anasayfa</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Eğitmenler</span>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight inline-block">
          Dans Eğitmenlerimiz
        </h1>
        <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
          Türkiye'nin en deneyimli dans eğitmenleri ile tanışın ve öğrenmeye başlayın.
        </p>
      </div>

      {/* Filtreleme ve Arama */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <div className="md:flex justify-between">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <input
              type="text"
              id="search"
              placeholder="Eğitmen adı ara..."
              className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-pink focus:border-brand-pink"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="md:w-1/3">
            {loadingStyles ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-pink"></div>
                <span className="text-sm text-gray-500">Dans stilleri yükleniyor...</span>
              </div>
            ) : (
              <CustomSelect
                name="danceStyle"
                label="Dans Stiline Göre Filtrele"
                value={selectedStyle}
                onChange={(value) => setSelectedStyle(value as string)}
                options={danceStyles}
                placeholder="Tüm Dans Stilleri"
                allowEmpty={true}
              />
            )}
          </div>
        </div>
      </div>

      {filteredInstructors.length === 0 ? (
        <div className="bg-gray-50 p-10 rounded-lg text-center">
          <p className="text-gray-500">Aradığınız kriterlere uygun eğitmen bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInstructors.map((instructor, index) => (
            <InstructorCard
              key={instructor.id}
              instructor={instructor}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorsListPage; 