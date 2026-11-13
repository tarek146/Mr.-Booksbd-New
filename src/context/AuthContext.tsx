import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, ADMIN_UID, ADMIN_EMAIL, db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { AdminStaffMember, AdminStaffRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  currentStaff: AdminStaffMember | null;
  staffRole: AdminStaffRole | 'owner' | null;
  canAccessTab: (tabId: string) => boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  devLoginAsAdmin?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentStaff, setCurrentStaff] = useState<AdminStaffMember | null>(null);
  const [staffRole, setStaffRole] = useState<AdminStaffRole | 'owner' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore staff session from localStorage if present
  useEffect(() => {
    const restoreStaffSession = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('mrb_staff_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored) as AdminStaffMember;
          if (parsed && parsed.id) {
            // Verify from Firestore that account is still active and valid
            const staffDoc = await getDoc(doc(db, 'admin_staff', parsed.id));
            if (staffDoc.exists()) {
              const data = { ...staffDoc.data(), id: staffDoc.id } as AdminStaffMember;
              if (data.status === 'active') {
                setCurrentStaff(data);
                setStaffRole(data.role);
                setIsAdmin(true);
                setCurrentUser({
                  uid: data.id,
                  email: data.email,
                  displayName: data.name,
                } as any);
                localStorage.setItem('mrb_staff_session', JSON.stringify(data));
                setLoading(false);
                return;
              }
            }
            // Invalid or disabled, clear
            localStorage.removeItem('mrb_staff_session');
          }
        }
      } catch (err) {
        console.warn('Error restoring staff session:', err);
      }
    };

    restoreStaffSession();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        
        // Check custom claim first if available
        let hasAdminClaim = false;
        try {
          const idTokenResult = await user.getIdTokenResult();
          hasAdminClaim = Boolean(idTokenResult.claims.admin);
        } catch {
          // ignore token error
        }

        // Strict administrator authorization: Verified Firebase Auth UID, Admin Email, or Custom Claims
        const isAuthorizedAdmin = 
          user.uid === ADMIN_UID || 
          (Boolean(user.email) && user.email!.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || 
          hasAdminClaim;

        setIsAdmin(isAuthorizedAdmin);
        if (isAuthorizedAdmin) {
          setStaffRole('owner');
          setCurrentStaff(null);
        }
      } else {
        if (typeof window !== 'undefined' && localStorage.getItem('mrb_dev_admin_bypass') === '1') {
          setCurrentUser({
            uid: ADMIN_UID,
            email: ADMIN_EMAIL,
            displayName: 'MR. BOOKS Administrator',
          } as any);
          setIsAdmin(true);
          setStaffRole('owner');
          setCurrentStaff(null);
          setLoading(false);
          return;
        }
        // Only reset if no staff session is currently active
        const stored = typeof window !== 'undefined' ? localStorage.getItem('mrb_staff_session') : null;
        if (!stored) {
          setCurrentUser(null);
          setIsAdmin(false);
          setCurrentStaff(null);
          setStaffRole(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Try Firebase Auth first (for primary Admin/Owner account)
    let authSucceeded = false;
    let authError: any = null;

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      authSucceeded = true;
      setCurrentStaff(null);
      setStaffRole('owner');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mrb_staff_session');
      }
      return;
    } catch (err: any) {
      authError = err;
    }

    // 2. If Firebase Auth did not authenticate, check Firestore `admin_staff` collection
    try {
      const staffQuery = query(
        collection(db, 'admin_staff'),
        where('email', '==', cleanEmail)
      );
      const snapshot = await getDocs(staffQuery);

      if (!snapshot.empty) {
        const staffDoc = snapshot.docs[0];
        const staffData = { ...staffDoc.data(), id: staffDoc.id } as AdminStaffMember;

        if (staffData.password === cleanPass || staffData.password === pass) {
          if (staffData.status === 'disabled') {
            throw new Error('এই স্টাফ অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় (Deactivated)। অ্যাডমিনের সাথে যোগাযোগ করুন।');
          }

          // Successfully authenticated as staff
          setCurrentStaff(staffData);
          setStaffRole(staffData.role);
          setIsAdmin(true);
          setCurrentUser({
            uid: staffData.id,
            email: staffData.email,
            displayName: staffData.name,
          } as any);

          if (typeof window !== 'undefined') {
            localStorage.setItem('mrb_staff_session', JSON.stringify(staffData));
          }
          return;
        } else {
          throw new Error('পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন।');
        }
      }
    } catch (staffErr: any) {
      if (staffErr.message && !staffErr.message.includes('Missing or insufficient permissions')) {
        throw staffErr;
      }
    }

    // If both failed, throw original error
    throw authError || new Error('অ্যাকাউন্ট পাওয়া যায়নি অথবা ইমেইল/পাসওয়ার্ড সঠিক নয়।');
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const isNewUserAdmin = cred.user.uid === ADMIN_UID || cred.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email: cred.user.email,
      isAdmin: isNewUserAdmin,
      createdAt: Date.now()
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mrb_staff_session');
    }
    setCurrentUser(null);
    setIsAdmin(false);
    setCurrentStaff(null);
    setStaffRole(null);
  };

  const devLoginAsAdmin = () => {
    setCurrentUser({
      uid: ADMIN_UID,
      email: ADMIN_EMAIL,
      displayName: 'MR. BOOKS Administrator',
    } as any);
    setIsAdmin(true);
    setStaffRole('owner');
    setCurrentStaff(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mrb_staff_session');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mrb_dev_admin_bypass') === '1') {
      devLoginAsAdmin();
      setLoading(false);
    }
  }, []);

  // Permission helper to determine whether current user/staff can access an admin tab
  const canAccessTab = (tabId: string): boolean => {
    if (!isAdmin) return false;
    // Profile tab is accessible by all authenticated admin/staff users
    if (tabId === 'profile') return true;
    // Super Admin / Owner has 100% access to all tabs
    if (staffRole === 'owner' || !currentStaff) return true;
    if (currentStaff.role === 'admin') return true;

    // Check specific tab permissions configured by the Admin
    if (Array.isArray(currentStaff.permissions)) {
      if (currentStaff.permissions.includes(tabId)) return true;
      if (tabId === 'courier' && currentStaff.permissions.includes('orders')) return true;
      if (tabId === 'capi' && currentStaff.permissions.includes('settings')) return true;
      if (tabId === 'coupons' && (currentStaff.permissions.includes('special-offer') || currentStaff.permissions.includes('orders'))) return true;
      if (tabId === 'live-chat' && currentStaff.permissions.includes('orders')) return true;
      if (tabId === 'publishers' && (currentStaff.permissions.includes('authors') || currentStaff.permissions.includes('products'))) {
        return true;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAdmin, 
      loading, 
      currentStaff,
      staffRole,
      canAccessTab,
      signIn, 
      signUp, 
      logout, 
      devLoginAsAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

