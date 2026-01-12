import { Navigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth, UserRole } from "@/contexts/AuthContext"

interface Props {
  children: React.ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requireAuth = true,
}: Props) => {
  const {
    user,
    isLoading,
    profileLoaded,
    isOnboarded,
    roles,
    hasRole,
  } = useAuth()

  const location = useLocation()
  const path = location.pathname

  /* WAIT UNTIL AUTH + PROFILE ARE READY */
  if (isLoading || !profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  /* AUTH */
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  /* FORCE ONBOARDING */
  if (user && !isOnboarded) {
    if (!path.startsWith("/onboarding")) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /* BLOCK ONBOARDING AFTER COMPLETE */
  if (user && isOnboarded && path.startsWith("/onboarding")) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  /* ROLE CHECK */
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
