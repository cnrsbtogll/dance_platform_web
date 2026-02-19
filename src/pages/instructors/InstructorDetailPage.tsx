import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { Instructor, UserWithProfile, DanceClass } from '../../types';
import { fetchAllInstructors } from '../../api/services/userService';
import { ChatDialog } from '../../features/chat/components/ChatDialog';
import { useAuth } from '../../contexts/AuthContext';
import LoginRequiredModal from '../../common/components/modals/LoginRequiredModal';
import ContactButton from '../../common/components/ui/ContactButton';

// Eğitmen ve kullanıcı bilgisini birleştiren tip tanımı
interface InstructorWithUser extends Omit<Instructor, 'specialties' | 'experience'> {
  id: string;
  user: UserWithProfile;
  experience?: number;
  tecrube?: number;
  specialties?: string[];
  uzmanlık?: string | string[];
  rating?: number;
  reviewCount?: number;
  certifications?: string[];
  socialMediaLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
  biography?: string;
}

type InstructorParams = {
  id: string;
}

const InstructorDetailPage: React.FC = () => {
  const { id } = useParams<InstructorParams>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [instructor, setInstructor] = useState<InstructorWithUser | null>(null);
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchInstructorDetails = async () => {
      if (!id) {
        setError('Eğitmen ID\'si bulunamadı');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // İlk olarak instructor ID'si ile Firestore'dan doğrudan sorgulama yapabiliriz
        const instructorDoc = await getDoc(doc(db, 'instructors', id));
        
        if (instructorDoc.exists()) {
          const instructorData = instructorDoc.data() as Instructor;
          
          // Eğitmenin kullanıcı bilgilerini de alıyoruz
          const userDoc = await getDoc(doc(db, 'users', instructorData.userId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserWithProfile;
            
            setInstructor({
              ...instructorData,
              id: instructorDoc.id,
              user: userData
            });
          } else {
            setError('Eğitmen kullanıcı bilgileri bulunamadı');
          }
        } else {
          // Eğer doğrudan belge bulunamadıysa, tüm eğitmenleri çekip ID'ye göre filtreleme yapabiliriz
          const instructors = await fetchAllInstructors();
          const foundInstructor = instructors.find(inst => inst.id === id);
          
          if (foundInstructor) {
            setInstructor(foundInstructor);
          } else {
            setError('Eğitmen bulunamadı');
          }
        }
        
        // Eğitmenin verdiği dersleri bulalım
        const classesQuery = query(
          collection(db, 'courses'),
          where('instructorId', '==', id)
        );
        
        const classesSnapshot = await getDocs(classesQuery);
        const classesData: DanceClass[] = [];
        
        classesSnapshot.forEach((doc) => {
          classesData.push({ ...doc.data(), id: doc.id } as DanceClass);
        });
        
        setClasses(classesData);
      } catch (err) {
        console.error('Eğitmen detayları yüklenirken hata oluştu:', err);
        setError('Eğitmen bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorDetails();
  }, [id]);

  const handleContactClick = () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setIsChatOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-10">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Eğitmen bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 pt-10">
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="mt-4 bg-brand-pink text-white py-2 px-4 rounded hover:bg-brand-pink transition"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="container mx-auto px-4 pt-10">
        <div className="bg-amber-50 p-4 rounded-lg text-center">
          <p className="text-amber-600">Eğitmen bilgisi bulunamadı.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="mt-4 bg-brand-pink text-white py-2 px-4 rounded hover:bg-brand-pink transition"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 flex items-center">
        <Link to="/" className="hover:text-brand-pink">Anasayfa</Link>
        <span className="mx-2">/</span>
        <Link to="/instructors" className="hover:text-brand-pink">Eğitmenler</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-300">{instructor.user.displayName || 'Eğitmen'}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        {/* Eğitmen Üst Bölüm */}
        <div className="md:flex">
          <div className="md:w-1/3 p-6">
            <div className="rounded-lg overflow-hidden shadow-md aspect-square">
              <img 
                src={instructor.user.photoURL || '/assets/images/dance/egitmen1.jpg'} 
                alt={instructor.user.displayName || 'Eğitmen'} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="md:w-2/3 p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">{instructor.user.displayName}</h1>
            <p className="text-brand-pink font-medium text-lg mb-4">Dans Eğitmeni</p>
            
            {/* Değerlendirme */}
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className="w-5 h-5 text-yellow-500" 
                  fill={i < Math.floor(instructor.rating || 0) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              ))}
              <span className="text-gray-600 dark:text-gray-400 ml-2">{(instructor.rating || 0).toFixed(1)}</span>
              <span className="text-gray-400 text-sm ml-1">({instructor.reviewCount || 0} değerlendirme)</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Tecrübe:</span> {instructor.experience || instructor.tecrube || 0} yıl</p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Uzmanlık:</span> {
                    Array.isArray(instructor.uzmanlık) ? instructor.uzmanlık.join(', ') : 
                    Array.isArray(instructor.specialties) ? instructor.specialties.join(', ') : 
                    instructor.uzmanlık ? String(instructor.uzmanlık) :
                    instructor.specialties ? String(instructor.specialties) :
                    "Çeşitli Dans Stilleri"
                  }
                </p>
                
                {instructor.user.danceStyles && Array.isArray(instructor.user.danceStyles) && instructor.user.danceStyles.length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Dans Stilleri:</span> {instructor.user.danceStyles.join(', ')}</p>
                )}
              </div>

              <div>
                {instructor.certifications && Array.isArray(instructor.certifications) && instructor.certifications.length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Sertifikalar:</span> {instructor.certifications.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Sosyal Medya Linkleri */}
            {instructor.socialMediaLinks && Object.values(instructor.socialMediaLinks).some(link => !!link) && (
              <div className="flex space-x-3 mb-6">
                {instructor.socialMediaLinks.instagram && (
                  <a 
                    href={instructor.socialMediaLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                
                {instructor.socialMediaLinks.facebook && (
                  <a 
                    href={instructor.socialMediaLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                
                {instructor.socialMediaLinks.youtube && (
                  <a 
                    href={instructor.socialMediaLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                
                {instructor.socialMediaLinks.tiktok && (
                  <a 
                    href={instructor.socialMediaLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:text-white"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
            
            {/* Biyografi */}
            {instructor.biography && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Biyografi</h3>
                <p className="text-gray-600 dark:text-gray-400">{instructor.biography}</p>
              </div>
            )}

            {/* İletişim / Rezervasyon Butonları */}
            <div className="flex flex-wrap gap-3">
              <button 
                className="bg-brand-pink text-white py-2 px-6 rounded-md hover:bg-rose-700 transition"
                onClick={handleContactClick}
              >
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Eğitmenin Dersleri */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Eğitmenin Dersleri</h2>
        
        {classes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-900 p-8 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400">Bu eğitmene ait aktif dans dersi bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((danceClass) => (
              <Link 
                key={danceClass.id}
                to={`/courses/${danceClass.id}`}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img 
                    src={danceClass.imageUrl || '/assets/images/dance/class-default.jpg'} 
                    alt={danceClass.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 bg-brand-pink text-white text-xs font-bold px-2 py-1 m-2 rounded">
                    {danceClass.level}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{danceClass.name}</h3>
                  <p className="text-brand-pink font-medium mb-2">{danceClass.danceStyle}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-bold">{danceClass.price} {danceClass.currency}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{danceClass.duration} dk</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Eğitmen ile iletişime geçmek için giriş yapmanız gerekmektedir."
      />

      {/* Chat Dialog */}
      {instructor && (
        <ChatDialog
          open={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          partner={{
            id: instructor.id,
            displayName: instructor.user.displayName,
            photoURL: instructor.user.photoURL,
            role: 'instructor'
          }}
          chatType="student-instructor"
        />
      )}
    </div>
  );
};

export default InstructorDetailPage; 