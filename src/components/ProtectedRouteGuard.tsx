"use client"

import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAuth, type UserRole } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

/**
 * ProtectedRoute
 *
 * Enforces:
 * 1. Authentication
 * 2. Onboarding completion (single source of truth: isOnboarded)
 * 3. Role-based authorization (after onboarding only)
 *
 * IMPORTANT:
 * - NEVER infer onboarding from profile existence or roles
 * - ONLY use isOnboarded
 */
const ProtectedRoute = ({
  children,
  requiredRole,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const {
    user,
    isLoading,
    isOnboarded,
    roles,
    hasRole,
  } = useAuth()

  const location = useLocation()

  /* ------------------------------------------------------------------
   * 1️⃣ Loading state
   * ------------------------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  /* ------------------------------------------------------------------
   * 2️⃣ Authentication guard
   * ------------------------------------------------------------------ */
  if (requireAuth && !user) {
    return (
      <Navigate
        to="/auth/sign-in"
        state={{ from: location }}
        replace
      />
    )
  }

  /* ------------------------------------------------------------------
   * 3️⃣ Onboarding guard
   * ------------------------------------------------------------------ */
  if (user && !isOnboarded) {
    // Allow ONLY onboarding routes
    if (!location.pathname.startsWith("/onboarding")) {
      return <Navigate to="/onboarding/select-role" replace />
    }

    return <>{children}</>
  }

  /* ------------------------------------------------------------------
   * 4️⃣ Block onboarded users from onboarding routes
   * ------------------------------------------------------------------ */
  if (user && isOnboarded && location.pathname.startsWith("/onboarding")) {
    const primaryRole = roles[0]
    return <Navigate to={`/dashboard/${primaryRole}`} replace />
  }

  /* ------------------------------------------------------------------
   * 5️⃣ Role-based access (AFTER onboarding)
   * ------------------------------------------------------------------ */
  if (requiredRole && user) {
    if (!hasRole(requiredRole)) {
      const primaryRole = roles[0]
      return <Navigate to={`/dashboard/${primaryRole}`} replace />
    }
  }

  /* ------------------------------------------------------------------
   * ✅ Access granted
   * ------------------------------------------------------------------ */
  return <>{children}</>
}

export default ProtectedRoute
