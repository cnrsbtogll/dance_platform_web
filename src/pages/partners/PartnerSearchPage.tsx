import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { useAuth } from '../../common/hooks/useAuth';
import { User } from '../../types';
import { Partner } from '../../types/partner';
import { motion } from 'framer-motion';
import { Pagination } from '@mui/material';
import { ChatDialog } from '../../features/chat/components/ChatDialog';
import LoginRequiredModal from '../../common/components/modals/LoginRequiredModal';
import PartnerCard from '../../common/components/partners/PartnerCard';
import PartnerFilterSidebar from '../../common/components/partners/PartnerFilterSidebar';
import Button from '../../common/components/ui/Button';

// Extended User interface
interface ExtendedUser extends User {
  city?: string;
  availableTimes?: string[];
  gender?: string;
  age?: number;
  rating?: number;
  height?: number;
  weight?: number;
}

// Firestore User interface
interface FirestoreUser {
  id: string;
  displayName: string;
  photoURL?: string;
  level?: string;
  danceStyles?: string[];
  city?: string;
  availableTimes?: string[];
  gender?: string;
  age?: number;
  rating?: number;
  createdAt?: any;
  role?: string | string[];
  height?: number;
  weight?: number;
}

interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

interface ContactStatus {
  partnerId: string;
  sent: boolean;
  message: string;
  contactId: string;
}

function PartnerSearchPage(): JSX.Element {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Filter States
  const [filters, setFilters] = useState({
    danceStyle: '',
    gender: '',
    level: '',
    location: '',
    availableTimes: [] as string[],
  });

  const [partnerler, setPartnerler] = useState<Partner[]>([]);
  const [allPartnerler, setAllPartnerler] = useState<Partner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [danceStyles, setDanceStyles] = useState<{ value: string, label: string }[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const [styleMapping, setStyleMapping] = useState<{ [key: string]: DanceStyle }>({});

  const convertUserToPartner = useCallback((user: FirestoreUser): Partner => {
    const standardizedDanceStyles = user.danceStyles?.map(style => {
      if (typeof style === 'string') {
        const styleLower = style.toLowerCase();
        const matchedStyle = styleMapping[styleLower];
        if (matchedStyle) return matchedStyle.label;
      }
      return style;
    }) || [];

    const convertGender = (gender: string | undefined): string => {
      if (!gender) return 'Belirtilmemiş';
      switch (gender.toLowerCase()) {
        case 'male': return 'Erkek';
        case 'female': return 'Kadın';
        case 'other': return 'Diğer';
        default: return gender;
      }
    };

    return {
      id: user.id,
      ad: user.displayName || 'İsimsiz Kullanıcı',
      yas: typeof user.age === 'number' ? user.age : 0,
      cinsiyet: convertGender(user.gender),
      seviye: user.level === 'beginner' ? 'Başlangıç' :
        user.level === 'intermediate' ? 'Orta' :
          user.level === 'advanced' ? 'İleri' :
            user.level === 'professional' ? 'Profesyonel' : 'Başlangıç',
      dans: standardizedDanceStyles,
      konum: user.city || 'Belirtilmemiş',
      saatler: user.availableTimes || [],
      foto: user.photoURL || '',
      puan: typeof user.rating === 'number' ? user.rating : 4.0,
      boy: typeof user.height === 'number' ? user.height : undefined,
      kilo: typeof user.weight === 'number' ? user.weight : undefined,
      role: user.role || 'student',
    };
  }, [styleMapping]);

  const calculateRelevanceScore = useCallback((partner: Partner, currentUserData: FirestoreUser | null): number => {
    if (!currentUserData) return 0;
    let score = 0;

    if (currentUserData.danceStyles && partner.dans) {
      const matchingStyles = currentUserData.danceStyles.filter(style =>
        partner.dans.includes(style)
      );
      score += matchingStyles.length * 20;
    }

    if (currentUserData.level && partner.seviye) {
      const currentUserLevel = currentUserData.level;
      const partnerLevel = partner.seviye === 'Başlangıç' ? 'beginner' :
        partner.seviye === 'Orta' ? 'intermediate' :
          partner.seviye === 'İleri' ? 'advanced' :
            partner.seviye === 'Profesyonel' ? 'professional' : '';

      if (currentUserLevel === partnerLevel) score += 15;
      else if (
        (currentUserLevel === 'beginner' && partnerLevel === 'intermediate') ||
        (currentUserLevel === 'intermediate' && (partnerLevel === 'beginner' || partnerLevel === 'advanced')) ||
        (currentUserLevel === 'advanced' && (partnerLevel === 'intermediate' || partnerLevel === 'professional')) ||
        (currentUserLevel === 'professional' && partnerLevel === 'advanced')
      ) {
        score += 10;
      }
    }

    if (currentUserData.city && partner.konum) {
      if (partner.konum.includes(currentUserData.city)) score += 15;
    }

    if (currentUserData.availableTimes && partner.saatler) {
      const matchingTimes = currentUserData.availableTimes.filter(time =>
        partner.saatler.includes(time)
      );
      score += matchingTimes.length * 5;
    }

    return score;
  }, []);

  const fetchAndSetDanceStyles = useCallback(async () => {
    if (Object.keys(styleMapping).length > 0) return;

    setLoadingStyles(true);
    try {
      const danceStylesRef = collection(db, 'danceStyles');
      const q = query(danceStylesRef, orderBy('label'));
      const querySnapshot = await getDocs(q);

      const styles: DanceStyle[] = [];
      const mapping: { [key: string]: DanceStyle } = {};
      const options: { value: string, label: string }[] = [];

      querySnapshot.forEach((doc) => {
        const styleData = doc.data();
        const style = {
          id: doc.id,
          label: styleData.label,
          value: styleData.value
        };
        styles.push(style);
        mapping[style.id.toLowerCase()] = style;
        mapping[style.value.toLowerCase()] = style;
        mapping[style.label.toLowerCase()] = style;
        options.push({ value: style.value, label: style.label });
      });

      setStyleMapping(mapping);

      if (styles.length === 0) {
        const defaultStyles = [
          { id: '1', label: 'Salsa', value: 'salsa' },
          { id: '2', label: 'Bachata', value: 'bachata' },
          { id: '3', label: 'Tango', value: 'tango' },
          { id: '4', label: 'Kizomba', value: 'kizomba' },
          { id: '5', label: 'Vals', value: 'vals' },
          { id: '6', label: 'Hip Hop', value: 'hiphop' },
          { id: '7', label: 'Modern Dans', value: 'modern-dans' },
          { id: '8', label: 'Bale', value: 'bale' },
          { id: '9', label: 'Flamenko', value: 'flamenko' },
          { id: '10', label: 'Zeybek', value: 'zeybek' },
          { id: '11', label: 'Jazz', value: 'jazz' }
        ];

        const defaultMapping: any = {};
        const defaultOptions: any = [];
        defaultStyles.forEach(s => {
          defaultMapping[s.value] = s;
          defaultOptions.push({ value: s.value, label: s.label });
        });
        setStyleMapping(defaultMapping);
        setDanceStyles(defaultOptions);
      } else {
        setDanceStyles(options);
      }

    } catch (err) {
      console.error('Error fetching dance styles:', err);
    } finally {
      setLoadingStyles(false);
    }
  }, [styleMapping]);

  useEffect(() => {
    fetchAndSetDanceStyles();
  }, [fetchAndSetDanceStyles]);

  const fetchAndProcessUsers = useCallback(async () => {
    if (Object.keys(styleMapping).length === 0) return;

    setInitialLoading(true);
    try {
      const extendedCurrentUser = currentUser as ExtendedUser | null;
      const currentUserData: FirestoreUser | null = extendedCurrentUser ? {
        id: extendedCurrentUser.id,
        displayName: extendedCurrentUser.displayName,
        photoURL: extendedCurrentUser.photoURL,
        level: extendedCurrentUser.level,
        danceStyles: extendedCurrentUser.danceStyles || [],
        city: extendedCurrentUser.city || '',
        availableTimes: extendedCurrentUser.availableTimes || [],
        gender: extendedCurrentUser.gender || '',
        age: extendedCurrentUser.age || 0,
        role: extendedCurrentUser.role,
        height: extendedCurrentUser.height,
        weight: extendedCurrentUser.weight,
      } : null;

      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      const users: FirestoreUser[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as DocumentData;

        let isValidUser = false;
        if (Array.isArray(userData.role)) {
          isValidUser = (userData.role.includes('student') || userData.role.includes('instructor')) && !userData.role.includes('admin');
        } else {
          isValidUser = userData.role === 'student' || userData.role === 'instructor';
        }

        if ((!currentUser || doc.id !== currentUser.id) && isValidUser) {
          users.push({
            id: doc.id,
            displayName: userData.displayName || '',
            photoURL: userData.photoURL,
            level: userData.level,
            danceStyles: userData.danceStyles || [],
            city: userData.city || '',
            availableTimes: userData.availableTimes || [],
            gender: userData.gender || '',
            age: userData.age || 0,
            rating: userData.rating || 4.0,
            role: userData.role,
            height: userData.height,
            weight: userData.weight,
          });
        }
      });

      const partners = users.map(user => {
        const partner = convertUserToPartner(user);
        if (currentUserData) {
          partner.relevanceScore = calculateRelevanceScore(partner, currentUserData);
        } else {
          partner.relevanceScore = 0;
        }
        return partner;
      });

      const sortedPartners = currentUserData
        ? [...partners].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        : [...partners].sort(() => Math.random() - 0.5);

      setAllPartnerler(sortedPartners);
      setPartnerler(sortedPartners);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [currentUser, styleMapping, convertUserToPartner, calculateRelevanceScore]);

  useEffect(() => {
    if (Object.keys(styleMapping).length > 0) {
      fetchAndProcessUsers();
    }
  }, [fetchAndProcessUsers, styleMapping]);

  // Filtering Logic
  const applyFilters = (newFilters: typeof filters) => {
    setLoading(true);

    let filteredResults = [...allPartnerler];

    if (newFilters.danceStyle) {
      const selectedDanceStyle = Object.values(styleMapping).find(s => s.value === newFilters.danceStyle);
      if (selectedDanceStyle) {
        filteredResults = filteredResults.filter(p => {
          const pStylesLower = p.dans.map(d => d.toLowerCase());
          return pStylesLower.includes(selectedDanceStyle.label.toLowerCase()) ||
            pStylesLower.includes(selectedDanceStyle.value.toLowerCase());
        });
      }
    }

    if (newFilters.gender) {
      filteredResults = filteredResults.filter(p => p.cinsiyet === newFilters.gender);
    }

    if (newFilters.level) {
      filteredResults = filteredResults.filter(p => p.seviye === newFilters.level);
    }

    if (newFilters.location && newFilters.location.trim() !== '') {
      const searchLoc = newFilters.location.toLowerCase();
      filteredResults = filteredResults.filter(p => p.konum.toLowerCase().includes(searchLoc));
    }

    if (newFilters.availableTimes.length > 0) {
      filteredResults = filteredResults.filter(p =>
        newFilters.availableTimes.some(t => p.saatler.includes(t))
      );
    }

    setPartnerler(filteredResults);
    setCurrentPage(1);
    setLoading(false);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      danceStyle: '',
      gender: '',
      level: '',
      location: '',
      availableTimes: [],
    };
    setFilters(emptyFilters);
    setPartnerler(allPartnerler);
    setCurrentPage(1);
  };

  const handleContact = (partner: Partner) => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedPartner(partner);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const partnersPerPage = 12;
  const totalPages = Math.ceil(partnerler.length / partnersPerPage);

  const getCurrentPagePartners = () => {
    const startIndex = (currentPage - 1) * partnersPerPage;
    return partnerler.slice(startIndex, startIndex + partnersPerPage);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-20 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <LoginRequiredModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="Partner ile iletişime geçmek için giriş yapmanız gerekmektedir."
        />

        {/* Hero / Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold tracking-wide mb-4">
            Dans Partneri Bul
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Mükemmel <span className="text-brand-primary">Dans Eşini</span> Bul
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Seninle aynı ritmi paylaşan dansçıları keşfet. Seviyene, stiline ve konumuna en uygun partneri bulmak artık çok kolay.
          </p>
        </motion.div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            }
          >
            {isFilterVisible ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <div className={`lg:w-1/4 w-full ${isFilterVisible ? 'block' : 'hidden lg:block'}`}>
            <PartnerFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              danceStyles={danceStyles}
              loading={loading}
            />
          </div>

          {/* Grid Content */}
          <div className="lg:w-3/4 w-full">
            {initialLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : partnerler.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xl">
                <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Partner bulunamadı</h3>
                <p className="text-gray-500 mb-6">Seçtiğiniz kriterlere uygun dans partneri şu anda mevcut değil. Filtreleri değiştirerek tekrar deneyebilirsiniz.</p>
                <Button variant="ghost" onClick={resetFilters}>Tüm Partnerleri Göster</Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-500 text-sm font-medium">Bu kriterlerde <span className="text-gray-900 font-bold">{partnerler.length}</span> dansçı bulundu</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getCurrentPagePartners().map(partner => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <PartnerCard
                        partner={partner}
                        onContact={handleContact}
                        isAuthenticated={!!currentUser}
                      />
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: '#E63946',
                          '&.Mui-selected': {
                            backgroundColor: '#E63946',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: '#9B2226',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {selectedPartner && (
          <ChatDialog
            open={!!selectedPartner}
            onClose={() => setSelectedPartner(null)}
            partner={{
              id: selectedPartner.id,
              displayName: selectedPartner.ad,
              photoURL: selectedPartner.foto,
              role: 'partner'
            }}
            chatType="partner-partner"
          />
        )}
      </div>
    </div>
  );
}

export default PartnerSearchPage;