import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Instructor, UserWithProfile, DanceClass, DanceSchool } from '../../types';
import { motion } from 'framer-motion';
import { fetchAllInstructors } from '../../api/services/userService';
import InstructorCard from '../../common/components/instructors/InstructorCard';
import { getFeaturedDanceCourses } from '../../api/services/courseService';
import { getFeaturedDanceSchools } from '../../api/services/schoolService';
import SchoolCard from '../../common/components/schools/SchoolCard';
import Button from '../../common/components/ui/Button';
import Card from '../../common/components/ui/Card';

interface HomePageProps {
  isAuthenticated: boolean;
  user?: User | null;
}

interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

function HomePage({ isAuthenticated, user }: HomePageProps) {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [schools, setSchools] = useState<DanceSchool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedInstructors, featuredClasses, featuredSchools] = await Promise.all([
          fetchAllInstructors(),
          getFeaturedDanceCourses(),
          getFeaturedDanceSchools()
        ]);

        const sortedInstructors = [...fetchedInstructors].sort((a, b) => (Number(b.experience) || 0) - (Number(a.experience) || 0));
        setInstructors(sortedInstructors);
        setClasses(featuredClasses);
        setSchools(featuredSchools);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const HeroSection = () => (
    <div className="relative overflow-hidden bg-brand-bg pt-16 pb-32">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-brand-secondary/5 blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mt-12 md:mt-20"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold tracking-wide mb-6">
            Türkiye'nin En Kapsamlı Dans Platformu
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-text mb-8 leading-tight">
            Dans Tutkunuzu <br />
            <span className="bg-gradient-to-r from-brand-primary to-rose-500 bg-clip-text text-transparent">Hareketlendirin</span>
          </h1>
          <p className="text-xl text-brand-lightText mb-10 max-w-2xl mx-auto leading-relaxed">
            En iyi eğitmenleri keşfedin, size uygun dans partnerini bulun ve şehrinizdeki en heyecanlı dans etkinliklerine katılın.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/courses')} rightIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }>
              Kurs Ara
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/partners')}>
              Partner Bul
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const CategoryCard = ({ title, desc, icon, to, color }: any) => (
    <Link to={to} className="block group">
      <Card hoverEffect className="h-full flex flex-col items-center text-center p-8 border-transparent hover:border-gray-100 transition-colors">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${color}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-brand-text mb-3">{title}</h3>
        <p className="text-brand-lightText text-sm leading-relaxed">{desc}</p>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <HeroSection />

      {/* Main Categories */}
      <div className="container mx-auto px-4 -mt-20 relative z-20 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CategoryCard
            to="/partners"
            title="Partner Bul"
            desc="Seviyenize uygun dans partneri ile pratik yapın ve gelişin."
            color="bg-gradient-to-br from-brand-primary to-rose-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <CategoryCard
            to="/courses"
            title="Kurs Keşfet"
            desc="Başlangıçtan ileri seviyeye kadar yüzlerce kursu inceleyin."
            color="bg-gradient-to-br from-indigo-500 to-purple-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <CategoryCard
            to="/festivals"
            title="Festivaller"
            desc="Dünyaca ünlü dans festivallerini ve workshopları kaçırmayın."
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          />
          <CategoryCard
            to="/nights"
            title="Dans Geceleri"
            desc="Sosyal dans gecelerinde yeteneklerinizi sergileyin."
            color="bg-gradient-to-br from-cyan-500 to-teal-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          />
        </div>
      </div>

      {/* Featured Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-brand-text mb-2">Öne Çıkan Eğitmenler</h2>
            <p className="text-brand-lightText">Alanında uzman eğitmenlerden ders alın.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/instructors')} rightIcon={<span>&rarr;</span>}>
            Tümünü Gör
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.slice(0, 4).map((instructor, index) => (
              <InstructorCard key={instructor.id} instructor={instructor} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="container mx-auto px-4 py-20">
          <div className="bg-brand-dark-card rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Dans Dünyasına Adım Atın</h2>
              <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                Binlerce dans tutkunu arasına katılın. Ücretsiz profilinizi oluşturun ve dansın ritmine kapılın.
              </p>
              <Button variant="white" size="lg" onClick={() => navigate('/signup')}>
                Hemen Ücretsiz Katıl
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schools Section */}
      <div className="container mx-auto px-4 py-16 mb-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-brand-text mb-2">Popüler Dans Okulları</h2>
            <p className="text-brand-lightText">Size en yakın kaliteli dans okullarını keşfedin.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/schools')} rightIcon={<span>&rarr;</span>}>
            Tümünü Gör
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">Henüz listelenen okul yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default HomePage;