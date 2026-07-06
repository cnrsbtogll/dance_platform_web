import React, { useState } from 'react';
import Button from '../common/components/ui/Button';
import { 
  doc, 
  collection,
  setDoc, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../api/firebase/firebase';

// Sample data for creating users - only students, no instructors
const baseSampleUsers = [
  {
    displayName: "Ayla Yılmaz",
    email: "ayla.yilmaz@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/1.jpg",
    role: "student",
    gender: "Kadın",
    age: 24,
    city: "İstanbul, Kadıköy",
    level: "beginner",
    danceStyles: ["salsa", "bachata"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 165,
    weight: 55,
    rating: 4.2
  },
  {
    displayName: "Mehmet Kaya",
    email: "mehmet.kaya@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/2.jpg",
    role: "student",
    gender: "Erkek",
    age: 29,
    city: "İstanbul, Beşiktaş",
    level: "intermediate",
    danceStyles: ["tango", "vals"],
    availableTimes: ["Akşam"],
    height: 180,
    weight: 78,
    rating: 4.5
  },
  {
    displayName: "Zeynep Demir",
    email: "zeynep.demir@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/3.jpg",
    role: "student",
    gender: "Kadın",
    age: 22,
    city: "İstanbul, Beşiktaş",
    level: "beginner",
    danceStyles: ["hiphop", "modern-dans"],
    availableTimes: ["Öğlen", "Hafta Sonu"],
    height: 162,
    weight: 53,
    rating: 4.0
  },
  {
    displayName: "Burak Yıldız",
    email: "burak.yildiz@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "student",
    gender: "Erkek",
    age: 31,
    city: "Ankara, Çankaya",
    level: "intermediate",
    danceStyles: ["salsa", "bachata"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 185,
    weight: 82,
    rating: 4.7
  },
  {
    displayName: "Ayşe Öztürk",
    email: "ayse.ozturk@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/5.jpg",
    role: "student",
    gender: "Kadın",
    age: 26,
    city: "İzmir, Karşıyaka",
    level: "beginner",
    danceStyles: ["flamenko"],
    availableTimes: ["Hafta Sonu"],
    height: 168,
    weight: 57,
    rating: 3.9
  },
  {
    displayName: "Emre Çelik",
    email: "emre.celik@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/6.jpg",
    role: "student",
    gender: "Erkek",
    age: 27,
    city: "İstanbul, Şişli",
    level: "advanced",
    danceStyles: ["salsa", "bachata", "kizomba"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 178,
    weight: 75,
    rating: 4.8
  },
  {
    displayName: "Selin Aksoy",
    email: "selin.aksoy@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/7.jpg",
    role: "student",
    gender: "Kadın",
    age: 23,
    city: "İstanbul, Üsküdar",
    level: "intermediate",
    danceStyles: ["bale", "modern-dans"],
    availableTimes: ["Sabah", "Öğlen"],
    height: 170,
    weight: 56,
    rating: 4.3
  },
  {
    displayName: "Okan Koç",
    email: "okan.koc@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/8.jpg",
    role: "student",
    gender: "Erkek",
    age: 32,
    city: "Bursa, Nilüfer",
    level: "beginner",
    danceStyles: ["tango"],
    availableTimes: ["Hafta Sonu"],
    height: 182,
    weight: 85,
    rating: 4.0
  }
];

const SeedUsersButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // Generate a random suffix to add variation to users
  const generateRandomSuffix = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
  };

  // Create a clone of the sample users with randomized names and emails
  const createUniqueUsers = () => {
    const suffix = generateRandomSuffix();
    
    return baseSampleUsers.map(user => {
      const nameParts = user.displayName.split(' ');
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.join(' ');
      
      const uniqueDisplayName = `${firstName} ${lastName} ${suffix}`;
      const emailParts = user.email.split('@');
      const uniqueEmail = `${emailParts[0]}_${suffix}@${emailParts[1]}`;
      
      return {
        ...user,
        displayName: uniqueDisplayName,
        email: uniqueEmail,
        role: "student" // Ensure all users are students, not instructors
      };
    });
  };

  const seedUsers = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setCount(0);
    
    try {
      let seededCount = 0;
      const uniqueUsers = createUniqueUsers();
      
      for (const user of uniqueUsers) {
        // Generate a unique ID using Firestore's built-in ID generator
        const userId = doc(collection(db, 'users')).id;
        
        // Add timestamp to the user data
        const userData = {
          ...user,
          id: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Save the user to Firestore with the generated ID
        await setDoc(doc(db, 'users', userId), userData);
        seededCount++;
      }
      
      setCount(seededCount);
      setSuccess(true);
    } catch (err) {
      console.error('Error seeding users:', err);
      setError('Kullanıcı örnekleri eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seed-users-container">
      <div className="mb-3">
        <p>Bu buton Firestore'a {baseSampleUsers.length} adet örnek <strong>öğrenci</strong> kullanıcısı ekler (eğitmenler hariç). Her seferinde rastgele benzersiz kimliklerle <strong>yeni</strong> kullanıcılar eklenir. Her kullanıcı profili, dans partneri eşleştirme için gerekli olan boy, kilo ve diğer bilgileri içerir.</p>
        <p><strong>Not:</strong> Her tıklama ile farklı örnek kullanıcılar oluşturulur, böylece çeşitli test kullanıcılarını sisteme ekleyebilirsiniz.</p>
      </div>
      
      <Button 
        onClick={seedUsers} 
        disabled={true}
        loading={loading}
      >
        {loading ? 'Kullanıcılar Ekleniyor...' : 'Yeni Örnek Öğrenciler Ekle (Devre Dışı)'}
      </Button>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-3" role="alert">
          <span className="block sm:inline">Başarıyla {count} yeni örnek öğrenci eklendi!</span>
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

export default SeedUsersButton; 