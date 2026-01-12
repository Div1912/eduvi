"use client"

import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth, type UserRole } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

/**
 * ProtectedRoute
 *
 * RESPONSIBILITY:
 * - Routing decisions ONLY
 *
 * DOES NOT:
 * - Handle loading
 * - Fetch data
 * - Wait for async operations
 *
 * SINGLE SOURCE OF TRUTH:
 * - isOnboarded
 */
const ProtectedRoute = ({
  children,
  requiredRole,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, isOnboarded, roles, hasRole } = useAuth()
  const { pathname } = useLocation()

  /* --------------------------------------------------
   * 1️⃣ Authentication
   * -------------------------------------------------- */
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  /* --------------------------------------------------
   * 2️⃣ FORCE onboarding for new users
   * -------------------------------------------------- */
  if (user && !isOnboarded) {
    if (!pathname.startsWith("/onboarding")) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /* --------------------------------------------------
   * 3️⃣ Block onboarding once completed
   * -------------------------------------------------- */
  if (user && isOnboarded && pathname.startsWith("/onboarding")) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  /* --------------------------------------------------
   * 4️⃣ Role-based authorization (AFTER onboarding)
   * -------------------------------------------------- */
  if (requiredRole && user && !hasRole(requiredRole)) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  /* --------------------------------------------------
   * ✅ Access granted
   * -------------------------------------------------- */
  return <>{children}</>
}

export default ProtectedRoute
