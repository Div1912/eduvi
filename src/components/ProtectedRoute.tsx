import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
  allowDemo?: boolean;
}

/**
 * ProtectedRoute component that enforces authentication and role-based access control.
 * 
 * @param children - The component to render if access is granted
 * @param requiredRole - The role required to access this route (optional)
 * @param requireAuth - Whether authentication is required (default: true)
 * @param allowDemo - Whether to allow demo/unauthenticated access with limited functionality (default: false)
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAuth = true,
  allowDemo = false,
}: ProtectedRouteProps) => {
  const { user, hasRole, isLoading, roles } = useAuth();
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
    // Allow demo mode if enabled
    if (allowDemo) {
      return <>{children}</>;
    }
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If a specific role is required
  if (requiredRole && user) {
    // Check if user has the required role
    // New users with no roles default to student access
    const hasAccess = hasRole(requiredRole) || 
      (roles.length === 0 && requiredRole === 'student');
    
    if (!hasAccess) {
      // User doesn't have the required role - redirect to role select with message
      return <Navigate to="/role-select" state={{ 
        unauthorized: true, 
        requiredRole,
        from: location 
      }} replace />;
    }
  }
  
  // Access granted
  return <>{children}</>;
};

export default ProtectedRoute;
