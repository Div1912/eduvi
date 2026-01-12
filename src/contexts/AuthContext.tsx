import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        return null;
      }

      return data as Profile | null;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  // Fetch user roles from database
  const fetchRoles = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error fetching roles:', fetchError);
        return [];
      }

      return (data || []).map(r => r.role as UserRole);
    } catch (err) {
      console.error('Roles fetch error:', err);
      return [];
    }
  };

  // Refresh profile and roles
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setRoles([]);
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate with wallet signature
  const authenticateWallet = async () => {
    if (!wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      await authenticateWithWallet(wallet.address);
      // Session will be updated via onAuthStateChange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Sign out
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

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  // Set up auth state listener
  useEffect(() => {
    // Set up auth state change listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          // Defer profile fetch to avoid blocking
          setTimeout(() => {
            refreshProfile();
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      
      if (initialSession?.user) {
        refreshProfile();
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh profile when user changes
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, [user?.id]);

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
