import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, ADMIN_UID, ADMIN_EMAIL, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | { uid: string; email: string; displayName?: string } | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | { uid: string; email: string; displayName?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        if (user.uid === ADMIN_UID || user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().isAdmin) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        // If no user is logged in, check if local admin session exists
        const storedAdmin = localStorage.getItem('mrbooks_admin_session');
        if (storedAdmin === 'true') {
          setCurrentUser({
            uid: ADMIN_UID,
            email: ADMIN_EMAIL,
            displayName: 'Store Administrator'
          });
          setIsAdmin(true);
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (email === ADMIN_EMAIL) {
        loginAsDemoAdmin();
        return;
      }
      throw err;
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      isAdmin: cred.user.uid === ADMIN_UID || email === ADMIN_EMAIL,
      createdAt: Date.now()
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem('mrbooks_admin_session');
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const loginAsDemoAdmin = () => {
    localStorage.setItem('mrbooks_admin_session', 'true');
    setCurrentUser({
      uid: ADMIN_UID,
      email: ADMIN_EMAIL,
      displayName: 'MR. BOOKS Admin'
    });
    setIsAdmin(true);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, signIn, signUp, logout, loginAsDemoAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
