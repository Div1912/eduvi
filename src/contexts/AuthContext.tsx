"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { supabase } from "@/integrations/supabase/client"
import { authenticateWithWallet } from "@/lib/walletAuth"
import type { User, Session } from "@supabase/supabase-js"

export type UserRole = "student" | "issuer" | "verifier" | "admin"

interface Profile {
  id: string
  user_id: string
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
  profileLoaded: boolean
  isOnboarded: boolean
  authenticateWallet: (walletAddress: string) => Promise<void>
  refreshProfile: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  /* ---------------- PROFILE FETCH ---------------- */

  const refreshProfile = async () => {
    if (!user || !session) return

    setProfileLoaded(false)

    try {
      const [{ data: profileData }, { data: rolesData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id),
        ])

      setProfile(profileData ?? null)
      setRoles((rolesData ?? []).map((r) => r.role as UserRole))
    } finally {
      setProfileLoaded(true)
    }
  }

  /* ---------------- WALLET AUTH ---------------- */

  const authenticateWallet = async (walletAddress: string) => {
    if (!walletAddress) throw new Error("Wallet address missing")

    setIsAuthenticating(true)
    try {
      await authenticateWithWallet(walletAddress)
      // auth listener will update session + user
    } finally {
      setIsAuthenticating(false)
    }
  }

  /* ---------------- AUTH LIFECYCLE ---------------- */

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    init()

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        setProfileLoaded(false)
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isLoading && user && session) {
      refreshProfile()
    }
  }, [user, session, isLoading])

  /* ---------------- HELPERS ---------------- */

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])
    setProfileLoaded(false)
  }

  const hasRole = (role: UserRole) => roles.includes(role)
  const isOnboarded = profileLoaded && profile?.onboarded === true

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAuthenticating,
        profileLoaded,
        isOnboarded,
        authenticateWallet,
        refreshProfile,
        hasRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
