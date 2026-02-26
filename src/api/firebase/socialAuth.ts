import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  OAuthCredential,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export const googleProvider = new GoogleAuthProvider();
// Her girişte account seç ekranını göster
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Mobil tarayıcı tespiti.
 * Popup'lar mobil tarayıcılarda güvenilmez olduğundan redirect kullanılır.
 */
function isMobileBrowser(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Firestore'da kullanıcı belgesi yoksa oluşturur. Varsa dokunmaz.
 * Yeni kullanıcılar için `isNewUser: true` döner.
 */
export async function ensureUserDocument(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null
): Promise<{ isNewUser: boolean }> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: email ?? '',
      displayName: displayName ?? '',
      photoURL: photoURL ?? '',
      phoneNumber: '',
      role: 'student',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { isNewUser: true };
  }

  return { isNewUser: false };
}

/**
 * Google ile giriş/kayıt.
 * - Desktop → signInWithPopup
 * - Mobil → signInWithRedirect (getRedirectResult ile birlikte kullanılmalı)
 *
 * account-exists-with-different-credential → mevcut provider'a link eder (sadece popup'ta).
 *
 * Returns: { credential, isNewUser }
 */
export async function signInWithGoogle(): Promise<{
  credential: UserCredential;
  isNewUser: boolean;
}> {
  if (isMobileBrowser()) {
    // Redirect akışı: bu fonksiyon hemen dönmez, sayfa redirect olur.
    // Sonuç handleGoogleRedirectResult() ile alınır.
    await signInWithRedirect(auth, googleProvider);
    // Bu satıra normalde ulaşılmaz ama TypeScript için:
    throw new Error('Redirect initiated');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const { isNewUser } = await ensureUserDocument(
      result.user.uid,
      result.user.email,
      result.user.displayName,
      result.user.photoURL
    );
    return { credential: result, isNewUser };
  } catch (err) {
    const error = err as AuthError;

    // Aynı e-posta farklı provider'da kayıtlı → link et
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = (error as any).customData?.email as string;
      const pendingCred = GoogleAuthProvider.credentialFromError(error) as OAuthCredential;

      if (!email || !pendingCred) throw error;

      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) throw error;

      // Bu noktada kullanıcıya mevcut provider ile giriş yaptırıp ardından link etmek gerekir.
      // Basit flow: hatayı özel bir yapıyla fırlat, UI handle eder.
      const linkError = new Error(
        `Bu e-posta adresi (${email}) zaten "${methods[0]}" ile kayıtlı. Önce o yöntemle giriş yapın, ardından Google hesabınızı bağlayabilirsiniz.`
      ) as any;
      linkError.code = 'auth/account-exists-with-different-credential';
      linkError.email = email;
      linkError.pendingCredential = pendingCred;
      linkError.existingMethods = methods;
      throw linkError;
    }

    throw error;
  }
}

/**
 * Mobil redirect akışının sonucunu işler.
 * App mount / SignIn sayfası yüklenirken çağrılmalı.
 * Sonuç yoksa null döner (normal durum).
 */
export async function handleGoogleRedirectResult(): Promise<{
  credential: UserCredential;
  isNewUser: boolean;
} | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const { isNewUser } = await ensureUserDocument(
      result.user.uid,
      result.user.email,
      result.user.displayName,
      result.user.photoURL
    );
    return { credential: result, isNewUser };
  } catch (err) {
    const error = err as AuthError;
    if (
      error.code === 'auth/account-exists-with-different-credential' ||
      error.code === 'auth/redirect-cancelled-by-user'
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Mevcut kullanıcıya Google credential'ı link eder.
 * (provider linking senaryosu için yardımcı)
 */
export async function linkGoogleCredential(
  pendingCred: OAuthCredential
): Promise<UserCredential> {
  if (!auth.currentUser) throw new Error('Aktif kullanıcı yok');
  return linkWithCredential(auth.currentUser, pendingCred);
}