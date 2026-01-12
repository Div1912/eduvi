import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PublicNavbar from '@/components/PublicNavbar';

const VerifierOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    organization: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet.address) {
      toast.error('Please connect your wallet and sign in first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            wallet_address: wallet.address.toLowerCase(),
            role: 'verifier',
            display_name: formData.displayName,
            institution: formData.organization || null,
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      // Add verifier role (idempotent)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: user.id,
            role: 'verifier',
          },
          { onConflict: 'user_id,role' }
        );

      if (roleError) throw roleError;

      await refreshProfile();
      toast.success('Verifier account created!');
      navigate('/dashboard/verifier');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        <div className="hero-glow" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Set Up <span className="gradient-text">Verification</span>
              </h1>
              <p className="text-muted-foreground">
                Get started verifying academic credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Enter your full name"
                  className="input-glass"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                  placeholder="e.g., HR Department, Recruiting Agency"
                  className="input-glass"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The organization you represent (if any)
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.displayName}
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  <>
                    Start Verifying
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default VerifierOnboarding;
