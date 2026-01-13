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

/**
 * App-facing profile shape.
 * Note: generated DB types may lag behind schema changes, so we keep this permissive.
 */
interface Profile {
  id: string
  user_id: string
  wallet_address: string
  display_name: string | null
  institution: string | null
  onboarded?: boolean | null
  // Allow additional columns without breaking assignability.
  [key: string]: unknown
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: UserRole[]
  isLoading: boolean
  profileLoaded: boolean
  isOnboarded: boolean
  isAuthenticating: boolean
  error: string | null
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
  const [profileLoaded, setProfileLoaded] = useState(false)

  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- PROFILE ---------------- */

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      setRoles([])
      setProfileLoaded(true)
      return
    }

    setProfileLoaded(false)

    try {
      const [{ data: profileData, error: profileError }, { data: rolesData, error: rolesError }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
        ])

      if (profileError) throw profileError
      if (rolesError) throw rolesError

      setProfile((profileData as unknown as Profile) ?? null)
      setRoles((rolesData ?? []).map((r) => r.role as UserRole))
    } catch (e) {
      console.error("refreshProfile failed:", e)
      setProfile(null)
      setRoles([])
    } finally {
      setProfileLoaded(true)
    }
  }

  /* ---------------- WALLET AUTH ---------------- */

  const authenticateWallet = async (walletAddress: string) => {
    if (!walletAddress) throw new Error("Wallet address missing")

    setError(null)
    setIsAuthenticating(true)
    try {
      await authenticateWithWallet(walletAddress)
    } catch (e: any) {
      const message = e?.message || "Authentication failed"
      setError(message)
      throw e
    } finally {
      setIsAuthenticating(false)
    }
  }

  /* ---------------- AUTH BOOTSTRAP ---------------- */

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

      if (!session?.user) {
        setProfileLoaded(true)
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (!session?.user) {
        setProfile(null)
        setRoles([])
        setProfileLoaded(true)
      } else {
        setProfileLoaded(false)
      }
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isLoading && user) {
      refreshProfile()
    }
  }, [user, isLoading])

  /* ---------------- HELPERS ---------------- */

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])
    setProfileLoaded(true)
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
        profileLoaded,
        isOnboarded,
        isAuthenticating,
        error,
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
