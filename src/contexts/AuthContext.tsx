"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useWallet } from "./WalletContext"
import { authenticateWithWallet } from "@/lib/walletAuth"
import type { User, Session } from "@supabase/supabase-js"

export type UserRole = "student" | "issuer" | "verifier" | "admin"

interface Profile {
  id: string
  wallet_address: string
  role: UserRole
  display_name: string | null
  institution: string | null
  onboarded: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: UserRole[]
  isLoading: boolean
  isAuthenticating: boolean
  error: string | null
  authenticateWallet: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  needsOnboarding: () => boolean
  onboardingComplete: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wallet, disconnect: disconnectWallet } = useWallet()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data as Profile | null
    } catch (err) {
      console.error("Profile fetch error:", err)
      return null
    }
  }

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId)

      if (error) {
        console.error("Error fetching roles:", error)
        return []
      }

      return (data || []).map((r) => r.role as UserRole)
    } catch (err) {
      console.error("Roles fetch error:", err)
      return []
    }
  }

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      setRoles([])
      return
    }

    setError(null)

    try {
      const [profileData, rolesData] = await Promise.all([fetchProfile(user.id), fetchRoles(user.id)])

      setProfile(profileData)
      setRoles(rolesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile")
    }
  }

  const authenticateWallet = async () => {
    if (!wallet.address) {
      throw new Error("Wallet not connected")
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      await authenticateWithWallet(wallet.address)
      // session handled by auth listener
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      setRoles([])
      setError(null)
    } catch (err) {
      console.error("Sign out error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role)
  }

  const needsOnboarding = (): boolean => {
    if (!user) {
      return false
    }

    // User needs onboarding if profile doesn't exist or onboarded is false
    return !profile || !profile.onboarded
  }

  const onboardingComplete = async () => {
    if (!user) {
      throw new Error("No authenticated user")
    }

    try {
      const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("user_id", user.id)

      if (error) throw error

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, onboarded: true })
      }
    } catch (err) {
      console.error("Failed to mark onboarding complete:", err)
      throw err
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // First, try to restore session from localStorage
        const {
          data: { session: restoredSession },
        } = await supabase.auth.getSession()

        if (mounted && restoredSession) {
          setSession(restoredSession)
          setUser(restoredSession.user)
          await refreshProfile()
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Auth initialization error:", err)
        setIsLoading(false)
      }
    }

    // Initialize on mount
    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return

      setSession(newSession)
      setUser(newSession?.user || null)

      if (!newSession?.user) {
        setProfile(null)
        setRoles([])
        setIsLoading(false)
        return
      }

      await refreshProfile()
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

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
        needsOnboarding,
        onboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
