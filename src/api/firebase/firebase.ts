// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

console.log('🔍 Firebase modülleri import edildi');

// Firebase yapılandırma bilgilerini kontrol et ve varsayılan değerler ata
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔍 Firebase yapılandırması yüklendi');

let app;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let secondaryApp;
let secondaryAuth: Auth;

try {
  console.log('🔄 Firebase başlatılıyor...');
  
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase başlatıldı');
  
  auth = getAuth(app);
  console.log('✅ Firebase Auth başlatıldı');

  // Create a secondary app purely for creating new users
  // This prevents the current admin user from being logged out when creating a new instructor/student
  secondaryApp = initializeApp(firebaseConfig, "SecondaryAdminApp");
  secondaryAuth = getAuth(secondaryApp);
  console.log('✅ Firebase Secondary Auth başlatıldı (User Creation için)');
  
  db = getFirestore(app);
  console.log('✅ Firebase Firestore başlatıldı');
  
  storage = getStorage(app);
  console.log('✅ Firebase Storage başlatıldı');
  
} catch (error: any) {
  console.error('❌ Firebase başlatma hatası:', error);
  
  // Hata durumunda boş nesneler oluştur
  app = {} as any;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
  secondaryAuth = {} as Auth;
  
  console.warn('⚠️ Firebase servisleri boş nesneler olarak ayarlandı (fallback)');
}

console.log('🔍 Firebase servisleri export ediliyor');
export { auth, db, storage, secondaryAuth };
export default app;