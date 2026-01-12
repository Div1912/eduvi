import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Building2, Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { toast } from 'sonner';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, profile, roles, refreshProfile, isLoading: authLoading } = useAuth();
  const { wallet } = useWallet();
  
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setInstitution(profile.institution || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (profile) {
      const nameChanged = displayName !== (profile.display_name || '');
      const institutionChanged = institution !== (profile.institution || '');
      setHasChanges(nameChanged || institutionChanged);
    }
  }, [displayName, institution, profile]);

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          institution: institution.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth/sign-in');
    return null;
  }

  const primaryRole = roles[0];

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and profile settings</p>
          </motion.div>

          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-6"
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="input-glass w-full"
                />
              </div>

              {(primaryRole === 'issuer' || primaryRole === 'verifier') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Organization / Institution
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Enter your organization name"
                    className="input-glass w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="input-glass w-full opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email address is linked to your wallet and cannot be changed
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {hasChanges && (
                <span className="text-sm text-muted-foreground">Unsaved changes</span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Wallet Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 mb-6"
          >
            <h2 className="text-lg font-semibold mb-6">Wallet Connection</h2>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Connected Wallet</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{wallet.address}</p>
              </div>
            </div>
          </motion.div>

          {/* Role Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold mb-6">Your Role</h2>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                primaryRole === 'student' ? 'bg-blue-500/20' :
                primaryRole === 'issuer' ? 'bg-purple-500/20' :
                primaryRole === 'verifier' ? 'bg-green-500/20' :
                'bg-primary/20'
              }`}>
                <User className={`w-5 h-5 ${
                  primaryRole === 'student' ? 'text-blue-400' :
                  primaryRole === 'issuer' ? 'text-purple-400' :
                  primaryRole === 'verifier' ? 'text-green-400' :
                  'text-primary'
                }`} />
              </div>
              <div>
                <p className="font-medium capitalize">{primaryRole}</p>
                <p className="text-xs text-muted-foreground">
                  {primaryRole === 'student' && 'Manage and share your credentials'}
                  {primaryRole === 'issuer' && 'Issue credentials to students'}
                  {primaryRole === 'verifier' && 'Verify academic credentials'}
                  {primaryRole === 'admin' && 'Platform administration'}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Need to change your role? Contact support for assistance.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
