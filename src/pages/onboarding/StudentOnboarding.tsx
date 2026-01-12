import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PublicNavbar from '@/components/PublicNavbar';

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    educationLevel: '',
  });

  const educationLevels = [
    'High School',
    'Undergraduate',
    'Graduate',
    'Doctorate',
    'Professional Certificate',
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
          role: 'student',
          display_name: formData.displayName,
        });

      if (profileError) throw profileError;

      // Add student role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'student',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      await refreshProfile();
      toast.success('Welcome to EduVerify!');
      navigate('/dashboard/student');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Complete Your <span className="gradient-text">Profile</span>
              </h1>
              <p className="text-muted-foreground">
                Tell us a bit about yourself to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your full name"
                  className="input-glass"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Education Level <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="input-glass"
                  required
                >
                  <option value="">Select your education level</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.displayName || !formData.educationLevel}
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
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

export default StudentOnboarding;
