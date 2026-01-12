import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, ArrowRight, Shield, AlertCircle, GraduationCap, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const LoginPage = () => {
  const navigate = useNavigate();
  const { wallet, connect, isConnecting, error: walletError, isMetaMaskAvailable } = useWallet();
  const { user, isAuthenticating, authenticateWallet, error: authError } = useAuth();
  const [showMetaMaskWarning, setShowMetaMaskWarning] = useState(false);
  const [authStep, setAuthStep] = useState<'connect' | 'sign' | 'complete'>('connect');

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      navigate('/role-select');
    }
  }, [user, navigate]);

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
      await authenticateWallet();
      setAuthStep('complete');
      navigate('/role-select');
    } catch (err) {
      setAuthStep('connect');
      console.error('Authentication failed:', err);
    }
  };

  const error = walletError || authError;
  const isProcessing = isConnecting || isAuthenticating;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <BackButton to="/" label="Back to Home" />
        </div>
        {/* Background effects */}
        <div className="hero-glow" />
        <div className="flex-1 flex items-center justify-center">
        <div className="glow-orb w-96 h-96 -top-48 -right-48 opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome to <span className="gradient-text">EduVerify</span>
              </h1>
              <p className="text-muted-foreground">
                {wallet.isConnected 
                  ? 'Sign the message to verify wallet ownership'
                  : 'Connect your wallet to access the platform'
                }
              </p>
            </div>

            {/* MetaMask Warning */}
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

            {/* Error */}
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

            {/* Auth Steps */}
            {wallet.isConnected ? (
              <>
                {/* Connected wallet info */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30 mb-6">
                  <Wallet className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Wallet Connected</p>
                    <p className="text-xs text-muted-foreground truncate">{wallet.address}</p>
                  </div>
                </div>

                {/* Sign Button */}
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
              /* Connect Button */
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

            {/* Alternative options */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Demo Mode */}
            <button
              onClick={() => navigate('/role-select')}
              className="w-full btn-secondary mb-6"
            >
              <Shield className="w-5 h-5" />
              Demo Mode (Read Only)
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Info */}
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
