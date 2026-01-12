import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Search, Shield, ArrowRight, Lock } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { user, roles, hasRole, isLoading } = useAuth();

  const roleConfigs = [
    {
      id: 'student' as UserRole,
      icon: GraduationCap,
      title: 'Student',
      description: 'View and manage your academic credentials. Share them with employers and institutions.',
      path: '/student/dashboard',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'issuer' as UserRole,
      icon: Building2,
      title: 'Institution',
      description: 'Issue and manage academic credentials for your students. Track all issued certificates.',
      path: '/issuer/dashboard',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'verifier' as UserRole,
      icon: Search,
      title: 'Verifier',
      description: 'Verify academic credentials instantly. Perfect for employers and background checks.',
      path: '/verifier/dashboard',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'admin' as UserRole,
      icon: Shield,
      title: 'Admin',
      description: 'Platform administration. Manage institutions, users, and system settings.',
      path: '/admin/dashboard',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const handleRoleClick = (role: typeof roleConfigs[0]) => {
    // If user is authenticated, check if they have the role
    if (user) {
      if (hasRole(role.id) || roles.length === 0) {
        // User has the role or is a new user (default student)
        navigate(role.path);
      }
      // Otherwise, do nothing (role is locked)
    } else {
      // Demo mode - allow navigation but with limited functionality
      navigate(role.path);
    }
  };

  const isRoleLocked = (roleId: UserRole): boolean => {
    // If not authenticated, nothing is locked (demo mode)
    if (!user) return false;
    // If user has no roles yet, only student is unlocked (default role)
    if (roles.length === 0) return roleId !== 'student';
    // Otherwise, check if user has the role
    return !hasRole(roleId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4">
        {/* Background effects */}
        <div className="hero-glow" />
        
        <div className="w-full max-w-4xl mx-auto">
          <BackButton to="/login" label="Back to Login" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Select Your <span className="gradient-text">Role</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {user 
                ? 'Access your authorized dashboards'
                : 'Choose how you want to explore EduVerify (Demo Mode)'
              }
            </p>
            {!user && (
              <p className="text-sm text-yellow-500 mt-2">
                ⚠️ You're in demo mode. Sign in to access full functionality.
              </p>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roleConfigs.map((role, index) => {
              const locked = isRoleLocked(role.id);
              
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleRoleClick(role)}
                  disabled={locked}
                  className={`glass-card p-6 text-left group transition-all duration-500 ${
                    locked 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:-translate-y-2 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center flex-shrink-0 ${
                      locked ? '' : 'group-hover:scale-110'
                    } transition-transform`}>
                      {locked ? (
                        <Lock className="w-7 h-7 text-white" />
                      ) : (
                        <role.icon className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold">{role.title}</h3>
                        {locked ? (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            Not Authorized
                          </span>
                        ) : (
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            {user 
              ? 'Roles are managed by platform administrators.'
              : 'Sign in with your wallet to access your authorized roles.'
            }
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectPage;
