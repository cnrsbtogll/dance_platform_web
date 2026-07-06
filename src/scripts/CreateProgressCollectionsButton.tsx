import React, { useState } from 'react';
import Button from '../common/components/ui/Button';
import { 
  doc, 
  collection,
  setDoc, 
  getDocs,
  getDoc,
  serverTimestamp,
  query,
  limit as firestoreLimit,
  where
} from 'firebase/firestore';
import { db, auth } from '../api/firebase/firebase';
import useAuth from '../common/hooks/useAuth';

// Platform kullanımını teşvik eden rozetler
const sampleAchievements = [
  {
    id: 'welcome-dancer',
    name: 'Hoş Geldin Dansçı',
    description: 'Dans Platformu\'na üye oldunuz ve dans yolculuğunuza ilk adımı attınız!',
    danceStyle: 'all',
    level: 'beginner',
    iconUrl: '/assets/images/rozet1.jpg',
    requiredAction: 'signup',
    points: 10
  },
  {
    id: 'profile-completed',
    name: 'Tanışalım',
    description: 'Profil bilgilerinizi eksiksiz doldurdunuz',
    danceStyle: 'all',
    level: 'beginner',
    iconUrl: '/assets/images/rozet2.jpg',
    requiredAction: 'complete_profile',
    points: 15
  },
  {
    id: 'course-explorer',
    name: 'Meraklı Dansçı',
    description: 'En az 5 farklı dans kursunu inceleyerek seçenekleri keşfettiniz',
    danceStyle: 'all',
    level: 'beginner',
    iconUrl: '/assets/images/rozet3.jpg',
    requiredAction: 'view_courses',
    requiredCount: 5,
    points: 20
  },
  {
    id: 'instructor-researcher',
    name: 'Eğitmen Araştırmacısı',
    description: 'Dans eğitmenlerini inceleyerek en az 3 eğitmen profilini ziyaret ettiniz',
    danceStyle: 'all',
    level: 'beginner',
    iconUrl: '/assets/images/rozet4.jpg',
    requiredAction: 'view_instructors',
    requiredCount: 3,
    points: 20
  },
  {
    id: 'school-visitor',
    name: 'Okul Gezgini',
    description: 'Dans okullarını keşfederek en az 3 okul profilini ziyaret ettiniz',
    danceStyle: 'all',
    level: 'beginner',
    iconUrl: '/assets/images/rozet5.jpg',
    requiredAction: 'view_schools',
    requiredCount: 3,
    points: 20
  },
  {
    id: 'social-butterfly',
    name: 'Sosyal Kelebek',
    description: 'Partner arama özelliğini kullanarak potansiyel dans partnerlerini incelediniz',
    danceStyle: 'all',
    level: 'beginner',
    iconUrl: '/assets/images/rozet6.jpg',
    requiredAction: 'search_partners',
    points: 25
  },
  {
    id: 'connection-maker',
    name: 'İlk Adım',
    description: 'İlk dans partner talebinizi göndererek iletişim kurdunuz',
    danceStyle: 'all',
    level: 'intermediate',
    iconUrl: '/assets/images/rozet7.jpg',
    requiredAction: 'send_partner_request',
    points: 30
  },
  {
    id: 'dancing-duo',
    name: 'Dans İkilisi',
    description: 'Bir dans partnerinizle bir dansa katılım planladınız',
    danceStyle: 'all',
    level: 'intermediate',
    iconUrl: '/assets/images/rozet8.jpg',
    requiredAction: 'plan_dance_event',
    points: 40
  },
  {
    id: 'active-member',
    name: 'Aktif Üye',
    description: 'Platform üzerinde 30 gün boyunca aktif kaldınız',
    danceStyle: 'all',
    level: 'intermediate',
    iconUrl: '/assets/images/rozet9.jpg',
    requiredAction: 'active_days',
    requiredCount: 30,
    points: 35
  },
  {
    id: 'dance-enthusiast',
    name: 'Dans Tutkunu',
    description: 'Dans platformunu düzenli olarak ziyaret ederek topluluğun aktif bir üyesi oldunuz',
    danceStyle: 'all',
    level: 'intermediate',
    iconUrl: '/assets/images/rozet10.jpg',
    requiredAction: 'regular_visits',
    requiredCount: 10,
    points: 45
  },
  {
    id: 'salsa-beginner',
    name: 'Salsa Başlangıç',
    description: 'İlk Salsa dersini tamamladınız',
    danceStyle: 'salsa',
    level: 'intermediate',
    iconUrl: '/assets/images/rozet11.jpg',
    requiredAction: 'complete_first_lesson',
    danceType: 'salsa',
    points: 50
  },
  {
    id: 'bachata-beginner',
    name: 'Bachata Başlangıç',
    description: 'İlk Bachata dersini tamamladınız',
    danceStyle: 'bachata',
    level: 'intermediate',
    iconUrl: '/assets/images/rozet12.jpg',
    requiredAction: 'complete_first_lesson',
    danceType: 'bachata',
    points: 50
  },
  {
    id: 'multi-dancer',
    name: 'Çok Yönlü Dansçı',
    description: 'Farklı dans stillerini deneyerek dans yelpazesini genişleten meraklı dansçı',
    danceStyle: 'all',
    level: 'advanced',
    iconUrl: '/assets/images/rozet13.jpg',
    requiredAction: 'explore_dance_styles',
    requiredCount: 3,
    points: 75
  },
  {
    id: 'dance-promoter',
    name: 'Dans Elçisi',
    description: 'Dans Platformu\'nu arkadaşlarınızla paylaşarak topluluğun büyümesine katkıda bulundunuz',
    danceStyle: 'all',
    level: 'advanced',
    iconUrl: '/assets/images/rozet14.jpg',
    requiredAction: 'share_platform',
    points: 60
  },
  {
    id: 'event-participant',
    name: 'Etkinlik Katılımcısı',
    description: 'Platform üzerinden bir dans etkinliğine kayıt oldunuz',
    danceStyle: 'all',
    level: 'advanced',
    iconUrl: '/assets/images/rozet15.jpg',
    requiredAction: 'register_event',
    points: 55
  }
];

// Örnek ilerleme durumu kayıtları için şablon
const createSampleProgress = (userId: string, courseId: string) => {
  // Platform kullanımıyla ilgili rozetlerden rastgele 3-5 tane seçelim
  const platformBadges = sampleAchievements
    .filter(badge => badge.level === 'beginner' || badge.requiredAction === 'signup' || badge.requiredAction === 'complete_profile')
    .map(badge => badge.id);
  
  // Rastgele 3-5 rozet seç
  const selectedBadges = platformBadges
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 3) + 3);
  
  return {
    userId,
    courseId,
    completedLessons: Math.floor(Math.random() * 10),
    totalLessons: 10,
    lastAttendance: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
    startDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
    achievements: selectedBadges,
    platformActions: {
      signup: true,
      complete_profile: Math.random() > 0.2,
      view_courses: Math.floor(Math.random() * 10) + 1,
      view_instructors: Math.floor(Math.random() * 5) + 1,
      view_schools: Math.floor(Math.random() * 5) + 1,
      search_partners: Math.random() > 0.3,
      send_partner_request: Math.random() > 0.5,
      active_days: Math.floor(Math.random() * 40) + 1,
      regular_visits: Math.floor(Math.random() * 15) + 1
    },
    notes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

// Örnek kurs katılım kayıtları için şablon
const createSampleAttendance = (userId: string, courseId: string) => {
  const attendances = [];
  const today = new Date();
  
  // Son 4 haftanın rastgele günlerinde katılım oluştur
  for (let i = 0; i < 4; i++) {
    if (Math.random() > 0.3) { // %70 ihtimalle katılım gerçekleşmiş
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7));
      
      attendances.push({
        userId,
        courseId,
        date,
        status: Math.random() > 0.2 ? 'attended' : 'late', // %80 zamanında, %20 geç kalma
        notes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
  
  return attendances;
};

// Örnek platform aktivitelerini oluştur
const createPlatformActivities = (userId: string) => {
  const today = new Date();
  const activities = [];
  
  // Üyelik kaydı (signup)
  activities.push({
    userId,
    type: 'signup',
    date: new Date(today.getTime() - (Math.floor(Math.random() * 60) + 30) * 24 * 60 * 60 * 1000), // 30-90 gün önce üye olmuş
    details: {
      method: Math.random() > 0.5 ? 'email' : 'google'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // Profil tamamlama
  if (Math.random() > 0.2) { // %80 ihtimalle profili tamamlamış
    activities.push({
      userId,
      type: 'complete_profile',
      date: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Son 30 gün içinde
      details: {
        completionRate: 100
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  // Kurs inceleme
  const courseViewCount = Math.floor(Math.random() * 15) + 1; // 1-15 kurs incelemiş
  for (let i = 0; i < courseViewCount; i++) {
    activities.push({
      userId,
      type: 'view_course',
      date: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Son 30 gün içinde
      details: {
        courseId: `course_${Math.floor(Math.random() * 100) + 1}`,
        courseType: Math.random() > 0.5 ? 'salsa' : (Math.random() > 0.5 ? 'bachata' : 'kizomba')
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  // Eğitmen inceleme
  const instructorViewCount = Math.floor(Math.random() * 8) + 1; // 1-8 eğitmen incelemiş
  for (let i = 0; i < instructorViewCount; i++) {
    activities.push({
      userId,
      type: 'view_instructor',
      date: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Son 30 gün içinde
      details: {
        instructorId: `instructor_${Math.floor(Math.random() * 20) + 1}`
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  // Dans okulu inceleme
  const schoolViewCount = Math.floor(Math.random() * 5) + 1; // 1-5 dans okulu incelemiş
  for (let i = 0; i < schoolViewCount; i++) {
    activities.push({
      userId,
      type: 'view_school',
      date: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Son 30 gün içinde
      details: {
        schoolId: `school_${Math.floor(Math.random() * 10) + 1}`
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  // Partner arama
  if (Math.random() > 0.3) { // %70 ihtimalle partner aramış
    const searchCount = Math.floor(Math.random() * 5) + 1; // 1-5 kez partner aramış
    for (let i = 0; i < searchCount; i++) {
      activities.push({
        userId,
        type: 'search_partners',
        date: new Date(today.getTime() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000), // Son 20 gün içinde
        details: {
          filters: {
            danceStyle: Math.random() > 0.5 ? 'salsa' : 'bachata',
            level: Math.random() > 0.6 ? 'beginner' : (Math.random() > 0.5 ? 'intermediate' : 'advanced')
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
  
  // Partner iletişim talebi
  if (Math.random() > 0.5) { // %50 ihtimalle partner iletişim talebi göndermiş
    activities.push({
      userId,
      type: 'send_partner_request',
      date: new Date(today.getTime() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000), // Son 15 gün içinde
      details: {
        partnerId: `user_${Math.floor(Math.random() * 100) + 1}`,
        message: 'Merhaba, birlikte dans etmek ister misiniz?'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  // Partner ile dans planlaması
  if (Math.random() > 0.7) { // %30 ihtimalle partner ile dans planlamış
    activities.push({
      userId,
      type: 'plan_dance_event',
      date: new Date(today.getTime() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000), // Son 10 gün içinde
      details: {
        partnerId: `user_${Math.floor(Math.random() * 100) + 1}`,
        eventType: Math.random() > 0.5 ? 'social_dancing' : 'practice',
        location: 'Dans Gecesi @ Salsa Club'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  return activities;
};

const CreateProgressCollectionsButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCollections, setCreatedCollections] = useState<string[]>([]);
  const { user } = useAuth();
  
  console.log("CreateProgressCollectionsButton: Kullanıcı bilgisi", { user: user?.displayName, userId: user?.id });
  
  const createProgressCollections = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setCreatedCollections([]);
    
    // Kullanıcının giriş yapmış olduğunu kontrol et
    if (!user) {
      setError('Veri oluşturmak için giriş yapmalısınız.');
      setLoading(false);
      return;
    }
    
    // Kullanıcının ID'sini logla
    console.log('Koleksiyonlar şu kullanıcı için oluşturuluyor:', user.id);
    
    try {
      const collections = ['achievements', 'progress', 'attendance', 'platform_activities'];
      const createdColls = [];
      
      // Achievements koleksiyonunu oluştur
      for (const achievement of sampleAchievements) {
        await setDoc(doc(db, 'achievements', achievement.id), {
          ...achievement,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      createdColls.push('achievements');
      
      // Örnek kursları al
      const coursesQuery = query(collection(db, 'courses'), firestoreLimit(5));
      const coursesSnapshot = await getDocs(coursesQuery);
      
      if (coursesSnapshot.empty) {
        console.log('Kurs bulunamadı, sadece platform aktiviteleri oluşturulacak');
      }
      
      // Giriş yapan kullanıcı için progress ve attendance verileri oluştur
      const progressPromises: Promise<void>[] = [];
      const attendancePromises: Promise<void>[] = [];
      
      // Kullanıcı ID'sini al - doğrudan giriş yapmış kullanıcının ID'si
      const userId = user.id;
      
      // Platform aktivitelerini oluştur
      const platformActivities = createPlatformActivities(userId);
      const platformActivityPromises: Promise<void>[] = [];
      
      platformActivities.forEach((activity, index) => {
        const activityId = `${userId}_${activity.type}_${index}`;
        platformActivityPromises.push(setDoc(doc(db, 'platform_activities', activityId), activity));
      });
      
      // Platform aktivitelerini kaydet
      await Promise.all(platformActivityPromises);
      createdColls.push('platform_activities');
      
      // Kurslar varsa, progress ve attendance kayıtlarını oluştur
      if (!coursesSnapshot.empty) {
        coursesSnapshot.forEach(courseDoc => {
          const courseId = courseDoc.id;
          
          // İlerleme oluştur (%70 ihtimalle)
          if (Math.random() > 0.3) {
            const progressId = `${userId}_${courseId}`;
            const progress = createSampleProgress(userId, courseId);
            progressPromises.push(setDoc(doc(db, 'progress', progressId), progress));
            
            // Katılım kayıtları oluştur
            const attendances = createSampleAttendance(userId, courseId);
            attendances.forEach((attendance, index) => {
              const attendanceId = `${userId}_${courseId}_${index}`;
              attendancePromises.push(setDoc(doc(db, 'attendance', attendanceId), attendance));
            });
          }
        });
        
        // İlerleme verilerini kaydet
        await Promise.all(progressPromises);
        createdColls.push('progress');
        
        // Katılım verilerini kaydet
        await Promise.all(attendancePromises);
        createdColls.push('attendance');
      }
      
      // Kullanıcı profili güncellemesi - ilerleme takibi için
      await setDoc(doc(db, 'user_progress', userId), {
        userId,
        level: Math.floor(Math.random() * 3) + 1, // 1-3 arası seviye
        points: Math.floor(Math.random() * 200) + 50, // 50-250 arası puan
        nextLevelPoints: 300, // Bir sonraki seviye için gereken puan
        earnedAchievements: sampleAchievements
          .filter(ach => ach.level === 'beginner' || ach.id === 'welcome-dancer')
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 4) + 3) // 3-6 rozet kazanmış
          .map(ach => ach.id),
        platformStats: {
          signupDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
          lastLoginDate: new Date(),
          totalLogins: Math.floor(Math.random() * 30) + 5,
          viewedCourses: Math.floor(Math.random() * 15) + 1,
          viewedInstructors: Math.floor(Math.random() * 8) + 1,
          viewedSchools: Math.floor(Math.random() * 5) + 1,
          searchedPartners: Math.random() > 0.3,
          sentPartnerRequests: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0,
          plannedDanceEvents: Math.random() > 0.7 ? 1 : 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      createdColls.push('user_progress');
      
      setCreatedCollections(createdColls);
      setSuccess(true);
    } catch (err: any) {
      console.error('İlerleme koleksiyonları oluşturulurken hata:', err);
      setError(`İlerleme koleksiyonları oluşturulurken bir hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-progress-collections-container">
      <div className="mb-3">
        <p>Bu buton, platform kullanımını teşvik eden rozetler ve ilerleme durumu için gerekli Firebase koleksiyonlarını oluşturur:</p>
        <ul className="list-disc pl-5 mt-2 mb-2">
          <li><strong>achievements</strong> - Platform kullanımını teşvik eden rozetler</li>
          <li><strong>platform_activities</strong> - Kullanıcının platform üzerindeki aktiviteleri</li>
          <li><strong>progress</strong> - Kullanıcıların kurslardaki ilerleme durumları</li>
          <li><strong>attendance</strong> - Kurslara katılım kayıtları</li>
          <li><strong>user_progress</strong> - Kullanıcının genel ilerleme durumu</li>
        </ul>
        <p>
          <strong>Not:</strong> Bu işlem, <u>mevcut oturum açmış kullanıcı için</u> platform kullanımını teşvik eden örnek rozetler ve aktiviteler oluşturur.
          Böylece "İlerleme Durumum" sayfasını test edebilirsiniz.
        </p>
        {!user && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 my-3">
            <p className="text-amber-700">
              <strong>Uyarı:</strong> Veri oluşturmak için giriş yapmalısınız. Sayfayı yenileyip giriş yapın, ardından bu butonu kullanın.
            </p>
          </div>
        )}
      </div>
      
      <Button 
        onClick={createProgressCollections} 
        disabled={true}
        loading={loading}
        variant="primary"
      >
        {loading ? 'Koleksiyonlar Güncelleniyor...' : 'Platform Rozetleri ve İlerleme Verileri Oluştur (Devre Dışı)'}
      </Button>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-3" role="alert">
          <span className="block sm:inline">
            Başarılı! Şu koleksiyonlar oluşturuldu/güncellendi: {createdCollections.join(', ')}.<br/>
            Artık <a href="/progress" className="underline">İlerleme Durumum</a> sayfasını ziyaret edebilirsiniz.
          </span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-3" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default CreateProgressCollectionsButton; 