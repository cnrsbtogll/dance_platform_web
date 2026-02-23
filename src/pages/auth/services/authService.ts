import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
  updateProfile,
  AuthError,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../../api/firebase/firebase';
import { User, UserRole } from '../../../types';

// Kullanıcı kaydı işlemini gerçekleştiren fonksiyon
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string,
  role: UserRole = 'student'
): Promise<User> => {
  try {
    // Firebase Authentication ile kullanıcı oluştur
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Kullanıcı profiline displayName ekle
    await updateProfile(userCredential.user, { displayName });
    
    // User modeli oluştur
    const newUser: User = {
      id: userCredential.user.uid,
      email: email,
      displayName: displayName,
      photoURL: userCredential.user.photoURL || '',
      phoneNumber: userCredential.user.phoneNumber || '',
      role: role,
      createdAt: new Date(),
    };
    
    // Firestore'a kullanıcı bilgilerini kaydet
    await setDoc(doc(db, 'users', newUser.id), {
      ...newUser,
      createdAt: Timestamp.fromDate(newUser.createdAt)
    });
    
    return newUser;
  } catch (error) {
    throw error;
  }
};

// Kullanıcı girişi işlemini gerçekleştiren fonksiyon
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Şifre sıfırlama maili gönderme fonksiyonu
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Çıkış yapma fonksiyonu
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Firebase hata mesajlarını kullanıcı dostu hale getiren yardımcı fonksiyon
export const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanımda.';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.';
    case 'auth/weak-password':
      return 'Şifre çok zayıf. En az 6 karakter kullanın.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
    case 'auth/wrong-password':
      return 'Hatalı şifre.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';
    default:
      return error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}; 