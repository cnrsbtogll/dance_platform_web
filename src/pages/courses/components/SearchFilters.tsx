import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

// Props için interface tanımı
interface SearchFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

// Filtre değerleri için interface tanımı
interface FilterValues {
  seviye: string;
  fiyatAralik: string;
  arama: string;
  dansTuru: string;
  gun: string;
}

// Dans stili interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

function SearchFilters({ onFilterChange }: SearchFiltersProps): JSX.Element {
  const [seviye, setSeviye] = useState<string>('');
  const [fiyatAralik, setFiyatAralik] = useState<string>('');
  const [arama, setArama] = useState<string>('');
  const [dansTuru, setDansTuru] = useState<string>('');
  const [gun, setGun] = useState<string>('');
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const q = query(danceStylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);
        
        const styles: DanceStyle[] = [];
        querySnapshot.forEach((doc) => {
          styles.push({
            id: doc.id,
            ...doc.data()
          } as DanceStyle);
        });
        
        if (styles.length === 0) {
          // If no styles in Firestore, use default styles
          setDanceStyles([
            { id: 'default-1', label: 'Salsa', value: 'salsa' },
            { id: 'default-2', label: 'Bachata', value: 'bachata' },
            { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
            { id: 'default-4', label: 'Tango', value: 'tango' },
            { id: 'default-5', label: 'Vals', value: 'vals' },
            { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
            { id: 'default-7', label: 'Modern Dans', value: 'modern-dans' },
            { id: 'default-8', label: 'Bale', value: 'bale' },
            { id: 'default-9', label: 'Flamenko', value: 'flamenko' },
            { id: 'default-10', label: 'Zeybek', value: 'zeybek' },
            { id: 'default-11', label: 'Jazz', value: 'jazz' },
            { id: 'default-12', label: 'Breakdance', value: 'breakdance' }
          ]);
        } else {
          setDanceStyles(styles);
        }
      } catch (err) {
        console.error('Error fetching dance styles:', err);
        // Fallback to default styles on error
        setDanceStyles([
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Vals', value: 'vals' },
          { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
          { id: 'default-7', label: 'Modern Dans', value: 'modern-dans' },
          { id: 'default-8', label: 'Bale', value: 'bale' },
          { id: 'default-9', label: 'Flamenko', value: 'flamenko' },
          { id: 'default-10', label: 'Zeybek', value: 'zeybek' },
          { id: 'default-11', label: 'Jazz', value: 'jazz' },
          { id: 'default-12', label: 'Breakdance', value: 'breakdance' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

  // Günler
  const gunler: string[] = [
    'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar', 'Hafta İçi', 'Hafta Sonu'
  ];

  // Fiyat aralıkları
  const fiyatAraliklari = [
    { label: '0 - 1000 TL', value: '0-1000' },
    { label: '1000 - 1500 TL', value: '1000-1500' },
    { label: '1500 - 2000 TL', value: '1500-2000' },
    { label: '2000 TL ve üzeri', value: '2000-10000' }
  ];

  // Seviye seçenekleri
  const seviyeler: string[] = ['Başlangıç', 'Orta', 'İleri'];

  const filterTemizle = (): void => {
    setSeviye('');
    setFiyatAralik('');
    setArama('');
    setDansTuru('');
    setGun('');
    onFilterChange({
      seviye: '',
      fiyatAralik: '',
      arama: '',
      dansTuru: '',
      gun: ''
    });
  };

  const handleClearSearch = () => {
    setArama('');
    if (arama) {
      onFilterChange({
        ...{ seviye, fiyatAralik, dansTuru, gun },
        arama: ''
      });
    }
  };

  return (
    <form className="max-w-4xl mx-auto">
      {/* Modern Search Bar */}
      <div className="mb-6">
        <div 
          className={`relative transition-all duration-300 ${
            searchFocused 
              ? 'shadow-lg rounded-2xl transform -translate-y-1' 
              : 'shadow-md rounded-xl hover:shadow-lg'
          }`}
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg 
              className={`h-5 w-5 transition-colors duration-300 ${
                searchFocused ? 'text-brand-pink' : 'text-gray-400'
              }`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Dans kursu veya eğitmen ara..."
            className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-pink focus:border-brand-pink bg-white transition-all duration-300"
          />
          {arama && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-all duration-150"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Quick Search Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-500 self-center">Popüler aramalar:</span>
          {['Salsa', 'Bachata', 'Tango', 'Hip Hop'].map(term => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setArama(term);
                onFilterChange({
                  ...{ seviye, fiyatAralik, dansTuru, gun },
                  arama: term
                });
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors duration-200"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          {loadingStyles ? (
            <div className="p-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-pink mr-2"></div>
              <span className="text-gray-600">Yükleniyor...</span>
            </div>
          ) : (
            <CustomSelect
              options={danceStyles.map(style => ({
                label: style.label,
                value: style.value
              }))}
              value={dansTuru}
              onChange={(value) => {
                setDansTuru(value);
                onFilterChange({
                  seviye,
                  fiyatAralik,
                  arama,
                  dansTuru: value,
                  gun
                });
              }}
              placeholder="Tüm dans türleri"
              label="Dans Türü"
            />
          )}
        </div>

        <div>
          <CustomSelect
            options={seviyeler.map(sev => ({
              label: sev,
              value: sev
            }))}
            value={seviye}
            onChange={(value) => {
              setSeviye(value);
              onFilterChange({
                seviye: value,
                fiyatAralik,
                arama,
                dansTuru,
                gun
              });
            }}
            placeholder="Tüm seviyeler"
            label="Seviye"
          />
        </div>

        <div>
          <CustomSelect
            options={fiyatAraliklari}
            value={fiyatAralik}
            onChange={(value) => {
              setFiyatAralik(value);
              onFilterChange({
                seviye,
                fiyatAralik: value,
                arama,
                dansTuru,
                gun
              });
            }}
            placeholder="Tüm fiyatlar"
            label="Fiyat Aralığı"
          />
        </div>

        <div>
          <CustomSelect
            options={gunler.map(g => ({
              label: g,
              value: g
            }))}
            value={gun}
            onChange={(value) => {
              setGun(value);
              onFilterChange({
                seviye,
                fiyatAralik,
                arama,
                dansTuru,
                gun: value
              });
            }}
            placeholder="Tüm günler"
            label="Gün"
          />
        </div>
      </div>
    </form>
  );
}

export default SearchFilters; 