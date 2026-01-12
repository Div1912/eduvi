import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { 
  Settings,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { wallet } = useWallet();
  const [isContractPaused, setIsContractPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    maxStudentNameLength: '50',
    requireIPFSUpload: false,
    autoVerifyInstitutions: false,
    maintenanceMode: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully!');
  };

  const handleEmergencyStop = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // In production, this would call the contract's emergencyStop function
    setIsContractPaused(true);
    toast.warning('Contract paused! All operations are suspended.');
  };

  const handleResumeContract = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // In production, this would call the contract's resumeContract function
    setIsContractPaused(false);
    toast.success('Contract resumed! Operations are active again.');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Platform <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-muted-foreground">
              Configure platform and smart contract settings
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Contract Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Smart Contract Controls</h2>
                  <p className="text-sm text-muted-foreground">Emergency controls for the credential contract</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Caution</p>
                    <p className="text-sm text-muted-foreground">
                      These actions affect the live smart contract. Emergency stop will pause all credential operations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleEmergencyStop}
                  disabled={isContractPaused}
                  className={`flex-1 btn-secondary ${isContractPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Lock className="w-5 h-5" />
                  Emergency Stop
                </button>
                <button
                  onClick={handleResumeContract}
                  disabled={!isContractPaused}
                  className={`flex-1 btn-primary ${!isContractPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Unlock className="w-5 h-5" />
                  Resume Contract
                </button>
              </div>

              <div className="mt-4 text-center">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  isContractPaused 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-green-500/10 text-green-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isContractPaused ? 'bg-destructive' : 'bg-green-400'} animate-pulse`} />
                  Contract is {isContractPaused ? 'Paused' : 'Active'}
                </span>
              </div>
            </motion.div>

            {/* Platform Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Platform Settings</h2>
                  <p className="text-sm text-muted-foreground">General platform configuration</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Student Name Length
                  </label>
                  <input
                    type="number"
                    value={settings.maxStudentNameLength}
                    onChange={(e) => setSettings({ ...settings, maxStudentNameLength: e.target.value })}
                    className="input-glass w-full max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum characters allowed for student names (contract enforced)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require IPFS Upload</p>
                    <p className="text-sm text-muted-foreground">
                      Require certificate document upload when issuing
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, requireIPFSUpload: !settings.requireIPFSUpload })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.requireIPFSUpload ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.requireIPFSUpload ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-verify Institutions</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically verify new institution registrations
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, autoVerifyInstitutions: !settings.autoVerifyInstitutions })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.autoVerifyInstitutions ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.autoVerifyInstitutions ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Show maintenance message to users
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.maintenanceMode ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;