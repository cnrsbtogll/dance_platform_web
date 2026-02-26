import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../api/firebase/firebase';
import {
  signInWithGoogle as _signInWithGoogle,
  handleGoogleRedirectResult,
} from '../api/firebase/socialAuth';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ credential: UserCredential; isNewUser: boolean }>;
  loading: boolean;
  /** Redirect akışında yeni oluşturulan sosyal kullanıcıyı işaret eder */
  pendingRedirectResult: { credential: UserCredential; isNewUser: boolean } | null;
  clearPendingRedirect: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingRedirectResult, setPendingRedirectResult] = useState<{
    credential: UserCredential;
    isNewUser: boolean;
  } | null>(null);

  // Sign in with email and password
  async function login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Create new user and add to Firestore
  async function signup(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        role: 'student',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      console.error('Error in signup process:', error);
      throw error;
    }
  }

  // Google Sign-In (popup for desktop, redirect for mobile — handled in socialAuth.ts)
  async function signInWithGoogle(): Promise<{ credential: UserCredential; isNewUser: boolean }> {
    return _signInWithGoogle();
  }

  function logout(): Promise<void> {
    return signOut(auth);
  }

  function resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    if (!currentUser) throw new Error('No authenticated user');

    const updateData: { displayName?: string; photoURL?: string } = {};
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;

    await updateProfile(currentUser, updateData);

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { ...updateData, updatedAt: serverTimestamp() });
  }

  function clearPendingRedirect() {
    setPendingRedirectResult(null);
  }

  useEffect(() => {
    // Mobil redirect akışının sonucunu app yüklenince işle
    handleGoogleRedirectResult()
      .then((result) => {
        if (result) setPendingRedirectResult(result);
      })
      .catch((err) => console.error('Redirect result error:', err));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    signInWithGoogle,
    loading,
    pendingRedirectResult,
    clearPendingRedirect,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}