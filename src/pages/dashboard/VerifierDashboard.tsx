import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Shield, FileCheck, History, ExternalLink } from 'lucide-react';
import DashboardNavbar from '@/components/DashboardNavbar';

const VerifierDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome, <span className="gradient-text">{profile?.display_name || 'Verifier'}</span>
            </h1>
            <p className="text-muted-foreground">
              Verify academic credentials instantly with blockchain-backed verification
            </p>
          </motion.div>

          {/* Main Verification Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 md:p-12 text-center mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Verify a Credential</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Enter a credential ID, token ID, or verification link to instantly verify the authenticity of an academic credential.
            </p>

            <Link 
              to="/verify" 
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              <Search className="w-5 h-5" />
              Start Verification
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Instant Verification</h3>
              <p className="text-sm text-muted-foreground">
                Verify credentials in seconds with blockchain-backed authenticity
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Tamper-Proof</h3>
              <p className="text-sm text-muted-foreground">
                All credentials are secured on the blockchain and cannot be altered
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">IPFS Storage</h3>
              <p className="text-sm text-muted-foreground">
                Credential data is stored on decentralized IPFS for permanence
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default VerifierDashboard;
