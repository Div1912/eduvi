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
 * 2. Mandatory onboarding (single source of truth: isOnboarded)
 * 3. Role-based authorization (AFTER onboarding only)
 *
 * RULES:
 * - New users MUST select a role
 * - Onboarded users CANNOT access onboarding
 * - Dashboard access requires onboarding + role
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
  const path = location.pathname

  /* --------------------------------------------------
   * 1️⃣ Loading
   * -------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  /* --------------------------------------------------
   * 2️⃣ Authentication
   * -------------------------------------------------- */
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  /* --------------------------------------------------
   * 3️⃣ FORCE onboarding for new users
   * -------------------------------------------------- */
  if (user && !isOnboarded) {
    // Root or dashboard → onboarding
    if (
      path === "/" ||
      path.startsWith("/dashboard") ||
      !path.startsWith("/onboarding")
    ) {
      return <Navigate to="/onboarding/select-role" replace />
    }

    // Allow onboarding routes
    return <>{children}</>
  }

  /* --------------------------------------------------
   * 4️⃣ Block onboarding once completed
   * -------------------------------------------------- */
  if (user && isOnboarded && path.startsWith("/onboarding")) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  /* --------------------------------------------------
   * 5️⃣ Role-based authorization
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
