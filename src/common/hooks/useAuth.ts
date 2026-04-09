import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp, enableNetwork, disableNetwork, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../api/firebase/firebase';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  setUser: (user: User) => void;
}

// Yeniden deneme mekanizması için yardımcı fonksiyon
const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  onError?: (error: any, attempt: number) => void
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (onError) onError(error, attempt + 1);

      if (attempt < retries - 1) {
        // console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Her denemede gecikmeyi artır (exponential backoff)
        delay *= 1.5;
      }
    }
  }

  throw lastError;
};

// Firestore'dan veya local cache'den gelen tarih verisini güvenli bir şekilde Date nesnesine çevirir
const parseDateSafe = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') {
    try {
      return val.toDate();
    } catch (e) {
      console.warn('Error extracting date via toDate():', e);
    }
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return new Date(val.seconds * 1000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isOffline: false,
    setUser: () => { }
  });

  // Debug işlemleri için oluşturulmuş log mesajı
  // console.log('🔍 useAuth hook başlatılıyor');

  // İşlem durumunu takip eden ref
  const isAuthProcessingRef = useRef(false);
  const userProfileCreatedRef = useRef(false);
  const firebaseCheckedRef = useRef(false);
  const snapshotUnsubscribeRef = useRef<(() => void) | null>(null);

  // Snapshot listener'ı temizleme fonksiyonu
  const clearSnapshot = useCallback(() => {
    if (snapshotUnsubscribeRef.current) {
      snapshotUnsubscribeRef.current();
      snapshotUnsubscribeRef.current = null;
    }
  }, []);

  // Firebase bağlantı durumunu kontrol et - sadece bir kez çalışması için ref kullanıldı
  useEffect(() => {
    // Eğer daha önce kontrol edildiyse tekrar kontrol etme
    if (firebaseCheckedRef.current) return;
    firebaseCheckedRef.current = true;

    // console.log('🔍 Firebase bağlantı kontrol useEffect çalıştı');

    const checkFirebaseConnection = async () => {
      // console.log('🔍 Firebase bağlantısı kontrol ediliyor...');

      // Firestore nesnesini kontrol et
      if (!db || Object.keys(db).length === 0) {
        console.error('❌ Firestore nesnesi boş veya başlatılmamış');
        setState(prev => ({
          ...prev,
          isOffline: false,
          error: 'Firebase Firestore başlatılmamış. Lütfen sayfayı yenileyin.'
        }));
        return;
      }

      try {
        // console.log('🔍 Firestore koleksiyon testi başlatılıyor...');
        // Firestore koleksiyonlarını listeleyerek bağlantı testi yap
        await retry(
          async () => {
            // console.log('🔍 Collection referansı alınıyor: users');
            const testQuery = collection(db, 'users');
            // console.log('🔍 getDocs çağrılıyor...');
            await getDocs(testQuery);
            // console.log('✅ getDocs başarılı');
          },
          3,
          1000,
          (error, attempt) => {
            console.error(`❌ Bağlantı testi denemesi ${attempt} başarısız:`, error);
            console.error('Hata kodu:', error.code);
            console.error('Hata mesajı:', error.message);
          }
        );

        // console.log('✅ Firebase bağlantı testi başarılı');
        setState(prev => ({ ...prev, isOffline: false, error: null }));
      } catch (error: any) {
        console.error('❌ Firebase bağlantı testi başarısız (tüm denemeler sonrası):', error);
        console.error('Hata kodu:', error.code);
        console.error('Hata mesajı:', error.message);
        console.error('Hata stack:', error.stack);

        // Bağlantı hatalarını daha detaylı sınıflandır
        if (error.code === 'unavailable' ||
          error.code === 'failed-precondition' ||
          error.message?.includes('client is offline')) {
          console.log('⚠️ Offline durum tespit edildi');
          setState(prev => ({
            ...prev,
            isOffline: true,
            error: 'Firebase bağlantı hatası. İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.'
          }));
        } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
          console.log('⚠️ Yetki hatası tespit edildi');
          setState(prev => ({
            ...prev,
            isOffline: false,
            error: 'Firebase erişim hatası. Bu verilere erişmek için yetkiniz bulunmuyor.'
          }));
        } else if (error.code === 'resource-exhausted') {
          console.log('⚠️ Kota sınırı aşıldı');
          setState(prev => ({
            ...prev,
            isOffline: false,
            error: 'Firebase kota sınırı aşıldı. Kısa bir süre sonra tekrar deneyin.'
          }));
        } else {
          console.log('⚠️ Bilinmeyen Firebase hatası');
          setState(prev => ({
            ...prev,
            isOffline: false,
            error: `Firebase bağlantı hatası: ${error.message || 'Bilinmeyen bir hata oluştu'}`
          }));
        }
      }
    };

    checkFirebaseConnection();

    // Periyodik olarak bağlantı durumunu kontrol et - 1 dakika aralıklarla
    // console.log('🔍 Periyodik bağlantı kontrolü başlatılıyor (60 saniye)');
    const connectionCheckInterval = setInterval(checkFirebaseConnection, 60000); // Her 1 dakikada bir

    return () => {
      // console.log('🔍 Firebase bağlantı kontrol useEffect temizleniyor');
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // User state update function - memoize this for stability
  const setUser = useCallback((user: User) => {
    setState(prevState => ({
      ...prevState,
      user
    }));
  }, []);

  // Network durumunu izleme
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network is online, enabling Firestore');
      enableNetwork(db).catch(err => console.error('Failed to enable network:', err));
      setState(prev => ({ ...prev, isOffline: false, error: null }));
    };

    const handleOffline = () => {
      console.log('🔴 Network is offline, disabling Firestore');
      disableNetwork(db).catch(err => console.error('Failed to disable network:', err));
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // İlk yükleme durumunu kontrol et
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth durumunu izleme - useCallback ile fonksiyonları memolayarak render performansını arttıralım
  const handleUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    // console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');

    // Halihazırda işleniyor ise çık
    if (isAuthProcessingRef.current) {
      // console.log('⚠️ Auth state change is already being processed, skipping...');
      return;
    }

    isAuthProcessingRef.current = true;

    try {
      if (firebaseUser) {
        // Offline durumunu kontrol et
        if (!navigator.onLine) {
          console.log('Cannot fetch user data: Device is offline');
          setState(prevState => ({
            ...prevState,
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'student', // Varsayılan rol
              createdAt: new Date(),
            } as User,
            loading: false,
            error: null,
            isOffline: true
          }));
          isAuthProcessingRef.current = false;
          return;
        }

        try {
          // console.log(`Fetching user data for UID: ${firebaseUser.uid}`);

          // Firestore'dan kullanıcı verilerini çek - yeniden deneme mekanizması ile
          const fetchUserData = async () => {
            return await getDoc(doc(db, 'users', firebaseUser.uid));
          };

          const userDoc = await retry(
            fetchUserData,
            2, // Daha az deneme
            800, // Daha kısa ilk gecikme
            (error, attempt) => console.log(`User data fetch attempt ${attempt} failed:`, error)
          );

          if (userDoc.exists()) {
            // console.log('User document found in Firestore');
            const userData = userDoc.data() as Omit<User, 'createdAt'> & { createdAt: Timestamp };

            // Kullanıcı verilerini ayarla
            setState(prevState => ({
              ...prevState,
              user: {
                ...userData,
                id: firebaseUser.uid,
                createdAt: userData.createdAt ? (typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate() : new Date(userData.createdAt as any)) : new Date(),
                // Auth verilerinden eksik bilgileri tamamla
                displayName: userData.displayName || firebaseUser.displayName || '',
                email: userData.email || firebaseUser.email || '',
                photoURL: userData.photoURL || firebaseUser.photoURL || ''
              } as User,
              loading: false,
              error: null,
              isOffline: false
            }));
          } else {
            // Döküman bulunamadı — signup sırasında setDoc henüz tamamlanmamış olabilir.
            // Hemen yeni doküman oluşturmak yerine, onSnapshot ile bekliyoruz.
            // Bu, createUserWithEmailAndPassword'dan gelen Auth callback'i ile
            // authService.signUp'daki setDoc arasındaki race condition'ı çözer.
            console.log('User document not found — waiting for Firestore write via onSnapshot...');

            // Önce geçici olarak loading: true kalacak, snapshot gelince güncellenecek
            // Loading'i false yapmadan snapshot bekle
            clearSnapshot();

            const MAX_WAIT_MS = 8000;
            const waitTimer = setTimeout(() => {
              // 8 saniye sonra hala gelmezse fallback: student rolü ile minimal profil
              console.warn('onSnapshot timeout — creating minimal fallback profile');
              clearSnapshot();
              setState(prevState => ({
                ...prevState,
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  photoURL: firebaseUser.photoURL || '',
                  role: 'student',
                  createdAt: new Date(),
                } as User,
                loading: false,
                error: null,
                isOffline: false
              }));
              isAuthProcessingRef.current = false;
              return;
            }, MAX_WAIT_MS);

            console.log('User document NOT found in Firestore — waiting briefly for race condition...');

            // Race condition: signUp/setDoc henüz tamamlanmamış olabilir.
            // 600ms bekleyip tekrar dene; hala yoksa yeni belge oluştur.
            await new Promise(resolve => setTimeout(resolve, 600));

            const retryDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (retryDoc.exists()) {
              console.log('✅ User document found on retry (race condition resolved)');
              const userData = retryDoc.data() as Omit<User, 'createdAt'> & { createdAt: Timestamp };
              setState(prevState => ({
                ...prevState,
                user: {
                  ...userData,
                  id: firebaseUser.uid,
                  createdAt: userData.createdAt ? userData.createdAt.toDate() : new Date(),
                  displayName: userData.displayName || firebaseUser.displayName || '',
                  email: userData.email || firebaseUser.email || '',
                  photoURL: userData.photoURL || firebaseUser.photoURL || ''
                } as User,
                loading: false,
                error: null,
                isOffline: false
              }));
              isAuthProcessingRef.current = false;
              return;
            }

            // Gerçekten yeni kullanıcı — profil oluştur
            userProfileCreatedRef.current = true; // Profil oluşturma girişimini işaretle

            try {
              // Yeni kullanıcı belgesi oluştur
              const newUserData = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || '',
                role: 'student', // Varsayılan rol
                createdAt: new Date()
              };

              // Firestore'a kaydet
              await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
              console.log('✅ User profile created successfully');

              // Kullanıcı durumunu güncelle - hata olmadan
              setState(prevState => ({
                ...prevState,
                user: newUserData as User,
                loading: false,
                error: null,
                isOffline: false
              }));
            } catch (createError: any) {
              console.error('❌ Error creating user profile:', createError);

              // Firestore'da kullanıcı verisi yoksa, sadece Firebase Authentication'dan gelen temel bilgileri kullan
              setState(prevState => ({
                ...prevState,
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  photoURL: firebaseUser.photoURL || '',
                  role: 'student', // Varsayılan rol
                  createdAt: new Date(),
                } as User,
                loading: false,
                error: `Kullanıcı profili oluşturulamadı: ${createError.message || 'Bilinmeyen hata'}`,
                isOffline: false
              }));
            }
          }
        } catch (error: any) {
          console.error('Error fetching user document:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);

          let errorMessage = 'Kullanıcı verileri çekilemedi.';
          let isOfflineStatus = false;

          // Hata türüne göre özel mesajlar
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            errorMessage += ' Çevrimdışı modda çalışıyor olabilirsiniz.';
            isOfflineStatus = true;
          } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            errorMessage += ' Kullanıcı verilerine erişim izniniz bulunmuyor.';
          } else if (error.code === 'not-found') {
            errorMessage += ' Kullanıcı profili bulunamadı.';
          } else if (error.code === 'resource-exhausted') {
            errorMessage += ' Kota sınırına ulaşıldı, daha sonra tekrar deneyin.';
          }

          // Firestore erişim hatası - Authentication verilerini kullan
          setState(prevState => ({
            ...prevState,
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'student',
              createdAt: new Date(),
            } as User,
            loading: false,
            error: errorMessage,
            isOffline: isOfflineStatus
          }));
        }
      } else {
        // Kullanıcı giriş yapmamış
        clearSnapshot();
        setState(prevState => ({
          ...prevState,
          user: null,
          loading: false,
          error: null,
          isOffline: !navigator.onLine
        }));
      }
    } catch (err: any) {
      console.error('Error processing auth state change:', err);

      // Hata mesajını daha net hale getir
      let errorMessage = 'Kimlik doğrulama işlemi sırasında bir hata oluştu';
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Geçersiz kimlik bilgileri. Lütfen tekrar giriş yapın.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
      } else if (err.code) {
        errorMessage += `: ${err.code}`;
      }

      setState(prevState => ({
        ...prevState,
        user: null,
        loading: false,
        error: errorMessage,
        isOffline: !navigator.onLine
      }));
    } finally {
      // İşlem tamamlandı
      isAuthProcessingRef.current = false;
    }
  }, []);

  // Auth state listener setup
  useEffect(() => {
    // console.log('Setting up auth state listener...');

    try {
      const unsubscribe = onAuthStateChanged(auth, handleUser);

      return () => {
        // console.log('Cleaning up auth state and snapshot listeners');
        unsubscribe();
        clearSnapshot();
      };
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Authentication service error'
      }));
      return () => { };
    }
  }, [handleUser]);

  return { ...state, setUser };
}

export default useAuth; 