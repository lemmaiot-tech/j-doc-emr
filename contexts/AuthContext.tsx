import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../pages/patients/firebase';
import { UserProfile, Role } from '../types';
import { localDB } from '../services/localdb';
import { useLiveQuery } from 'dexie-react-hooks';
import { fetchAllDataAndSeedLocalDB } from '../services/syncService';

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
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          await localDB.users.put(profileData);
        } else {
            console.warn("User profile not found in Firestore for UID:", firebaseUser.uid, ". Creating a default profile.");
            const defaultProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || 'no-email@example.com',
                displayName: firebaseUser.email?.split('@')[0] || 'New User',
                role: Role.Nurse,
                departments: [],
            };
            await setDoc(userDocRef, defaultProfile);
            await localDB.users.put(defaultProfile);
        }
        
        // Fetch all cloud data and populate local DB
        await fetchAllDataAndSeedLocalDB();

      } else {
        setUser(null);
        await localDB.clearAllData(); // Clear ALL local data on logout
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

    if (data.displayName && data.displayName !== userProfile.displayName) {
        await updateFirebaseProfile(user, { displayName: data.displayName });
    }

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });

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