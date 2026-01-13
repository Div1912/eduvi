import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Wallet, Shield, AlertCircle, GraduationCap, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const LoginPage = () => {
  const navigate = useNavigate();
  const { wallet, connect, isConnecting, error: walletError, isMetaMaskAvailable } = useWallet();
  const { user, profile, roles, isAuthenticating, authenticateWallet, error: authError, isLoading } = useAuth();
  const [showMetaMaskWarning, setShowMetaMaskWarning] = useState(false);
  const [authStep, setAuthStep] = useState<'connect' | 'sign' | 'complete'>('connect');

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && user) {
      // If user has profile and roles, go to dashboard
      if (profile && roles.length > 0) {
        const primaryRole = roles[0];
        const dashboardPaths: Record<UserRole, string> = {
          student: '/student/dashboard',
          issuer: '/issuer/dashboard',
          verifier: '/verify',
          admin: '/admin/dashboard',
        };
        navigate(dashboardPaths[primaryRole], { replace: true });
      } else {
        // New user - needs role selection
        navigate('/role-select', { replace: true });
      }
    }
  }, [user, profile, roles, isLoading, navigate]);

  const handleConnect = async () => {
    if (!isMetaMaskAvailable) {
      setShowMetaMaskWarning(true);
      return;
    }
    
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleAuthenticate = async () => {
    if (!wallet.address) return;
    
    setAuthStep('sign');
    try {
      await authenticateWallet(wallet.address);
      setAuthStep('complete');
      // Redirect will be handled by useEffect
    } catch (err) {
      setAuthStep('connect');
      console.error('Authentication failed:', err);
    }
  };

  const error = walletError || authError;
  const isProcessing = isConnecting || isAuthenticating;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <BackButton to="/" label="Back to Home" />
        </div>
        <div className="hero-glow" />
        <div className="flex-1 flex items-center justify-center">
        <div className="glow-orb w-96 h-96 -top-48 -right-48 opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Sign in to <span className="gradient-text">EduVerify</span>
              </h1>
              <p className="text-muted-foreground">
                {wallet.isConnected 
                  ? 'Sign the message to verify wallet ownership'
                  : 'Connect your wallet to access the platform'
                }
              </p>
            </div>

            {showMetaMaskWarning && !isMetaMaskAvailable && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6"
              >
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">MetaMask Required</p>
                  <p className="text-sm text-muted-foreground">
                    Please install{' '}
                    <a 
                      href="https://metamask.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      MetaMask
                    </a>
                    {' '}to continue.
                  </p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            {wallet.isConnected ? (
              <>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30 mb-6">
                  <Wallet className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Wallet Connected</p>
                    <p className="text-xs text-muted-foreground truncate">{wallet.address}</p>
                  </div>
                </div>

                <button
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating}
                  className="w-full btn-primary mb-6"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {authStep === 'sign' ? 'Sign the message in MetaMask...' : 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Sign to Authenticate
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground mb-6">
                  You'll be asked to sign a message to prove wallet ownership. This is free and doesn't cost any gas.
                </p>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full btn-primary mb-6"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect with MetaMask
                  </>
                )}
              </button>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span>Cryptographic signature verifies wallet ownership</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span>No passwords needed - your wallet is your identity</span>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
