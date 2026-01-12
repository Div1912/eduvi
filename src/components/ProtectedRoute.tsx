import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute component that enforces authentication and role-based access control.
 * 
 * @param children - The component to render if access is granted
 * @param requiredRole - The role required to access this route (optional)
 * @param requireAuth - Whether authentication is required (default: true)
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, hasRole, isLoading, roles, profile } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If auth is required and user is not authenticated
  if (requireAuth && !user) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If a specific role is required
  if (requiredRole && user) {
    // Check if user has the required role
    if (!hasRole(requiredRole)) {
      // User doesn't have the required role
      // If user has no profile yet, they need to complete onboarding
      if (!profile || roles.length === 0) {
        return <Navigate to="/role-select" state={{ from: location }} replace />;
      }
      
      // User has a profile but wrong role - redirect to their actual dashboard
      const primaryRole = roles[0];
      const dashboardPaths: Record<UserRole, string> = {
        student: '/dashboard/student',
        issuer: '/dashboard/institution',
        verifier: '/dashboard/verifier',
        admin: '/dashboard/admin',
      };
      return <Navigate to={dashboardPaths[primaryRole]} replace />;
    }
  }
  
  // Access granted
  return <>{children}</>;
};

export default ProtectedRoute;
