import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from './WalletContext';

export type UserRole = 'student' | 'issuer' | 'verifier' | 'admin';

interface Profile {
  id: string;
  wallet_address: string;
  role: UserRole;
  display_name: string | null;
  institution: string | null;
}

interface AuthContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  setRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wallet } = useWallet();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (walletAddress: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
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

  const refreshProfile = async () => {
    if (!wallet.address) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const existingProfile = await fetchProfile(wallet.address);
      setProfile(existingProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const setRole = async (role: UserRole) => {
    if (!wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const existingProfile = await fetchProfile(wallet.address);

      if (existingProfile) {
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('wallet_address', wallet.address.toLowerCase())
          .select()
          .single();

        if (updateError) throw updateError;
        setProfile(data as Profile);
      } else {
        // Create new profile
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({
            wallet_address: wallet.address.toLowerCase(),
            role,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(data as Profile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.address) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [wallet.address]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        error,
        setRole,
        refreshProfile,
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