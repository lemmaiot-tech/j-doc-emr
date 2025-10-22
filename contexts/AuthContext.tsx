
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../pages/patients/firebase';
import { UserProfile, Role } from '../types';
import { localDB } from '../services/localdb';
import { useLiveQuery } from 'dexie-react-hooks';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, 'displayName' | 'role' | 'departments'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const userProfile = useLiveQuery(
    () => user ? localDB.users.get(user.uid) : undefined,
    [user]
  ) as UserProfile | null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // On auth change, fetch profile from Firestore and sync to local DB
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          await localDB.users.put(profileData);
        } else {
            // This case handles first-time login for a pre-created user
            // Or can be used to create a default profile
            console.warn("User profile not found in Firestore for UID:", firebaseUser.uid);
        }
      } else {
        setUser(null);
        await localDB.users.clear(); // Clear user data on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass:string, remember = false) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<Pick<UserProfile, 'displayName' | 'role' | 'departments'>>) => {
    if (!user || !userProfile) throw new Error("User not authenticated");

    // 1. Update Firebase Auth Profile (only displayName supported directly)
    if (data.displayName && data.displayName !== userProfile.displayName) {
        await updateFirebaseProfile(user, { displayName: data.displayName });
    }

    // 2. Update Firestore document
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });

    // 3. Update local Dexie DB
    await localDB.users.update(user.uid, data);
  };

  const value = { user, userProfile, loading, login, logout, updateProfile };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};