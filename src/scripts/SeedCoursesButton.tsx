import React, { useState } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase/firebase';

interface SeedCoursesButtonProps {
  courseCount?: number;
}

const DANCE_STYLES = ['Salsa', 'Bachata', 'Kizomba', 'Tango', 'Vals'];
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const LEVELS = ['Başlangıç', 'Orta', 'İleri'];

async function seedDanceCourses(courseCount: number) {
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  const instructorsSnap = await getDocs(collection(db, 'instructors'));

  const schools = schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const instructors = instructorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (schools.length === 0) {
    return { success: false, message: 'Önce en az bir dans okulu eklemelisiniz.' };
  }

  let added = 0;
  for (let i = 0; i < courseCount; i++) {
    const style = DANCE_STYLES[Math.floor(Math.random() * DANCE_STYLES.length)];
    const school = schools[Math.floor(Math.random() * schools.length)] as any;
    const instructor = instructors.length > 0
      ? (instructors[Math.floor(Math.random() * instructors.length)] as any)
      : null;

    await addDoc(collection(db, 'courses'), {
      name: `${style} ${LEVELS[Math.floor(Math.random() * LEVELS.length)]} Kursu`,
      danceStyle: style,
      level: LEVELS[Math.floor(Math.random() * LEVELS.length)],
      schoolId: school.id,
      schoolName: school.name || school.ad || '',
      instructorId: instructor?.id || null,
      instructorName: instructor?.displayName || instructor?.name || null,
      day: DAYS[Math.floor(Math.random() * DAYS.length)],
      time: `${Math.floor(Math.random() * 6) + 17}:00`,
      duration: [45, 60, 90][Math.floor(Math.random() * 3)],
      capacity: Math.floor(Math.random() * 15) + 5,
      price: (Math.floor(Math.random() * 20) + 5) * 50,
      currency: '₺',
      status: 'active',
      createdAt: serverTimestamp(),
    });
    added++;
  }

  return { success: true, message: `${added} kurs başarıyla eklendi.` };
}

const SeedCoursesButton: React.FC<SeedCoursesButtonProps> = ({ courseCount = 20 }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeedCourses = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await seedDanceCourses(courseCount);
      setResult(res);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Kurs ekleme sırasında hata oluştu: ${error.message || 'Bilinmeyen hata'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-4 p-4 border rounded-lg bg-white dark:bg-slate-800">
      <h3 className="text-xl font-semibold mb-4">Örnek Dans Kursları Ekleme</h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Bu işlem, veritabanına {courseCount} adet örnek dans kursu ekleyecektir.
        Oluşturulacak kurslar Salsa, Bachata, Kizomba, Tango ve Vals stillerinde olacaktır.
        Ayrıca, kurslar için rastgele eğitmenler ve dans okulları seçilecektir.
      </p>

      <button
        onClick={handleSeedCourses}
        disabled={isLoading}
        className={`px-4 py-2 rounded font-medium ${isLoading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-brand-pink hover:bg-rose-700 text-white'
          }`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Kurslar Ekleniyor...
          </span>
        ) : 'Örnek Dans Kursları Ekle'}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
};

export default SeedCoursesButton;