import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PublicNavbar from '@/components/PublicNavbar';

const InstitutionOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionType: '',
    displayName: '',
  });

  const institutionTypes = [
    'University',
    'College',
    'School',
    'Training Institute',
    'Certification Body',
    'Other',
  ];

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
        .upsert({
          user_id: user.id,
          wallet_address: wallet.address.toLowerCase(),
          role: 'issuer',
          display_name: formData.displayName,
          institution: formData.institutionName,
        });

      if (profileError) throw profileError;

      // Add issuer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'issuer',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      await refreshProfile();
      toast.success('Institution registered successfully!');
      navigate('/dashboard/institution');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete registration. Please try again.');
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Register Your <span className="gradient-text">Institution</span>
              </h1>
              <p className="text-muted-foreground">
                Set up your institution to start issuing credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="e.g., Massachusetts Institute of Technology"
                  className="input-glass"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.institutionType}
                  onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                  className="input-glass"
                  required
                >
                  <option value="">Select institution type</option>
                  {institutionTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your full name"
                  className="input-glass"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your name as the institution representative
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.institutionName || !formData.institutionType || !formData.displayName}
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering Institution...
                  </>
                ) : (
                  <>
                    Complete Registration
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

export default InstitutionOnboarding;
