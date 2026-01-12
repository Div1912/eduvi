import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { formatAddress, formatBalance } from '@/lib/web3';
import { Menu, X, ChevronDown, LogOut, Settings, GraduationCap } from 'lucide-react';

const DashboardNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const { wallet } = useWallet();
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setIsWalletDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const getDashboardLabel = (): string => {
    if (!roles.length) return 'Dashboard';
    const primaryRole = roles[0];
    const labels: Record<UserRole, string> = {
      student: 'Student Dashboard',
      issuer: 'Institution Dashboard',
      verifier: 'Verifier Portal',
      admin: 'Admin Dashboard',
    };
    return labels[primaryRole];
  };

  return (
    <nav className="navbar-glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Dashboard Label */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-primary">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground hidden sm:block">
                Edu<span className="gradient-text">Verify</span>
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">{getDashboardLabel()}</span>
            </div>
          </div>

          {/* Desktop Wallet Status */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium">
                  {profile?.display_name || formatAddress(wallet.address!)}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isWalletDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isWalletDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 glass-card p-4 z-50"
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
                        <p className="font-semibold">{profile?.display_name || 'User'}</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                        <p className="font-mono text-xs break-all">{wallet.address}</p>
                        {wallet.balance && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Balance: {formatBalance(wallet.balance)} ETH
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <Link
                          to="/settings"
                          onClick={() => setIsWalletDropdownOpen(false)}
                          className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors text-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {formatAddress(wallet.address!)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Link 
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button 
                  onClick={handleSignOut} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default DashboardNavbar;
