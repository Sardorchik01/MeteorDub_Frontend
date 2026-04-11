import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, Tariff } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  tariff: Tariff | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [tariff, setTariff] = React.useState<Tariff | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAuthReady, setIsAuthReady] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to profile changes
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setProfile(profileData);

            // Fetch tariff if exists
            if (profileData.tariffId) {
              const tariffDocRef = doc(db, 'tariffs', profileData.tariffId);
              onSnapshot(tariffDocRef, (tSnap) => {
                if (tSnap.exists()) {
                  setTariff({ id: tSnap.id, ...tSnap.data() } as Tariff);
                } else {
                  setTariff(null);
                }
              });
            } else {
              setTariff(null);
            }
          } else {
            // Create default profile if it doesn't exist
            // For Google users, we might need a default username or prompt for one
            // For now, we'll use a derived username from email if not present
            const baseUsername = firebaseUser.email?.split('@')[0] || 'user';
            const isAdminEmail = (firebaseUser.email || '').toLowerCase() === "abdulazizov0117@gmail.com";
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: baseUsername, // Default for Google users
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              role: isAdminEmail ? 'superadmin' : 'user',
              status: isAdminEmail ? 'premium' : 'standard',
              createdAt: Date.now()
            };
            
            // Also register the username
            const usernameDocRef = doc(db, 'usernames', baseUsername);
            setDoc(usernameDocRef, { email: firebaseUser.email, uid: firebaseUser.uid }, { merge: true });
            
            setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
          setIsAuthReady(true);
        });
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, tariff, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
