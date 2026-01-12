import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from './WalletContext';
import { authenticateWithWallet, signOutWallet } from '@/lib/walletAuth';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'student' | 'issuer' | 'verifier' | 'admin';

interface Profile {
  id: string;
  wallet_address: string;
  role: UserRole;
  display_name: string | null;
  institution: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  authenticateWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wallet, disconnect: disconnectWallet } = useWallet();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- FETCH PROFILE ----------------
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // allow no profile for first-time users

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile | null;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  // ---------------- FETCH ROLES ----------------
  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return (data || []).map(r => r.role as UserRole);
    } catch (err) {
      console.error('Roles fetch error:', err);
      return [];
    }
  };

  // ---------------- REFRESH PROFILE ----------------
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setRoles([]);
      return;
    }

    setError(null);

    try {
      const [profileData, rolesData] = await Promise.all([
        fetchProfile(user.id),
        fetchRoles(user.id),
      ]);

      setProfile(profileData);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  };

  // ---------------- AUTHENTICATE WALLET ----------------
  const authenticateWallet = async () => {
    if (!wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      await authenticateWithWallet(wallet.address);
      // session handled by auth listener
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ---------------- SIGN OUT ----------------
  const signOut = async () => {
    try {
      await signOutWallet();
      disconnectWallet();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // ---------------- ROLE CHECK ----------------
  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  // ---------------- AUTH STATE LISTENER ----------------
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (!newSession?.user) {
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
          return;
        }

        await refreshProfile();
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);

      if (!session?.user) {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAuthenticating,
        error,
        authenticateWallet,
        signOut,
        refreshProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
