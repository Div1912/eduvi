import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  Loader2, 
  Send,
  Wallet,
  Mail,
  User,
  FileText,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardNavbar from '@/components/DashboardNavbar';
import { z } from 'zod';
import { mintCertificate, switchToFlowTestnet, FLOW_EVM_TESTNET } from '@/lib/web3';
import { Progress } from '@/components/ui/progress';

const credentialSchema = z.object({
  studentName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be 50 characters or less'),
  studentWallet: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  studentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  degree: z.string().trim().min(2, 'Degree must be at least 2 characters').max(200, 'Degree name too long'),
  major: z.string().trim().max(100, 'Major name too long').optional(),
  graduationDate: z.string().min(1, 'Graduation date is required'),
});

interface MintProgress {
  stage: 'idle' | 'preparing' | 'minting' | 'saving' | 'complete';
  percent: number;
  message: string;
}

interface IssuedCredential {
  tokenId: number;
  txHash: string;
  ipfsHash: string | null;
}

const IssueCredentialPage = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedCredential, setIssuedCredential] = useState<IssuedCredential | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mintProgress, setMintProgress] = useState<MintProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
  });
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentWallet: '',
    studentEmail: '',
    degree: '',
    major: '',
    graduationDate: '',
  });

  const validateForm = () => {
    try {
      credentialSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (!user || !profile) {
      toast.error('Please sign in first');
      return;
    }

    setIsSubmitting(true);
    setMintProgress({ stage: 'preparing', percent: 10, message: 'Preparing credential...' });

    try {
      const institution = profile.institution || 'Unknown Institution';
      let tokenId: number;
      let txHash: string;

      // Check if wallet is connected for real minting
      if (wallet.isConnected && wallet.address) {
        // Ensure we're on Flow EVM Testnet
        if (wallet.chainId !== FLOW_EVM_TESTNET.chainId) {
          toast.info('Switching to Flow EVM Testnet...');
          await switchToFlowTestnet();
        }

        setMintProgress({ stage: 'minting', percent: 40, message: 'Minting on blockchain...' });

        // Create metadata URI (simple version without IPFS for now)
        const metadataUri = `data:application/json,${encodeURIComponent(JSON.stringify({
          name: `${formData.degree} - ${formData.studentName}`,
          description: `Academic credential issued by ${institution}`,
          attributes: [
            { trait_type: 'Degree', value: formData.degree },
            { trait_type: 'University', value: institution },
            { trait_type: 'Student', value: formData.studentName },
            { trait_type: 'Graduation Date', value: formData.graduationDate },
          ],
        }))}`;

        // Mint on blockchain
        const mintResult = await mintCertificate(
          formData.studentWallet.trim(),
          formData.studentName.trim(),
          formData.degree.trim(),
          institution,
          metadataUri
        );

        tokenId = mintResult.tokenId;
        txHash = mintResult.txHash;
      } else {
        // Demo mode - generate mock values
        setMintProgress({ stage: 'minting', percent: 40, message: 'Simulating blockchain transaction...' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        tokenId = Math.floor(Math.random() * 100000);
        txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      }

      setMintProgress({ stage: 'saving', percent: 75, message: 'Saving to database...' });

      // Save to database
      const { error } = await supabase
        .from('credentials')
        .insert({
          student_name: formData.studentName.trim(),
          student_wallet: formData.studentWallet.toLowerCase().trim(),
          degree: formData.degree.trim(),
          university: institution,
          issued_by: profile.id,
          status: 'verified',
          issued_at: new Date().toISOString(),
          token_id: tokenId,
          tx_hash: txHash,
        });

      if (error) throw error;

      setMintProgress({ stage: 'complete', percent: 100, message: 'Complete!' });
      setIssuedCredential({ tokenId, txHash, ipfsHash: null });
      toast.success('Credential issued successfully!');
      
    } catch (error: any) {
      console.error('Failed to issue credential:', error);
      toast.error(error.message || 'Failed to issue credential');
      setMintProgress({ stage: 'idle', percent: 0, message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const resetForm = () => {
    setIssuedCredential(null);
    setMintProgress({ stage: 'idle', percent: 0, message: '' });
    setFormData({
      studentName: '',
      studentWallet: '',
      studentEmail: '',
      degree: '',
      major: '',
      graduationDate: '',
    });
  };

  if (issuedCredential) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Credential Issued!</h2>
              <p className="text-muted-foreground mb-6">
                The credential has been minted and issued to {formData.studentName}.
              </p>

              {/* Token ID - Primary */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 mb-4">
                <p className="text-sm text-muted-foreground mb-1">Token ID (Use for Verification)</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-3xl font-bold text-primary">#{issuedCredential.tokenId}</code>
                  <button
                    onClick={() => copyToClipboard(issuedCredential.tokenId.toString(), 'Token ID')}
                    className="btn-secondary p-2"
                    title="Copy Token ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this Token ID with the student for verification
                </p>
              </div>

              {/* Transaction Hash */}
              <div className="bg-white/[0.02] rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1">{issuedCredential.txHash}</code>
                  <button
                    onClick={() => copyToClipboard(issuedCredential.txHash, 'Transaction hash')}
                    className="btn-secondary p-2 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a 
                    href={`https://evm-testnet.flowscan.io/tx/${issuedCredential.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary p-2 flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={resetForm} className="btn-primary">
                  Issue Another
                </button>
                <button
                  onClick={() => navigate('/dashboard/institution')}
                  className="btn-secondary"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <button 
            onClick={() => navigate('/dashboard/institution')} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Issue New Credential</h1>
                <p className="text-muted-foreground">
                  Issue a verifiable credential to a student
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Student Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => handleChange('studentName', e.target.value)}
                    placeholder="Enter student's full name"
                    className={`input-glass ${errors.studentName ? 'border-destructive' : ''}`}
                  />
                  {errors.studentName && (
                    <p className="text-sm text-destructive mt-1">{errors.studentName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Student Wallet Address <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentWallet}
                    onChange={(e) => handleChange('studentWallet', e.target.value)}
                    placeholder="0x..."
                    className={`input-glass font-mono ${errors.studentWallet ? 'border-destructive' : ''}`}
                  />
                  {errors.studentWallet && (
                    <p className="text-sm text-destructive mt-1">{errors.studentWallet}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    The credential will be issued to this wallet address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Student Email (Optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => handleChange('studentEmail', e.target.value)}
                    placeholder="student@email.com"
                    className={`input-glass ${errors.studentEmail ? 'border-destructive' : ''}`}
                  />
                  {errors.studentEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.studentEmail}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Optionally notify the student via email
                  </p>
                </div>
              </div>

              {/* Credential Details */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Credential Details
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Degree / Certificate <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => handleChange('degree', e.target.value)}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    className={`input-glass ${errors.degree ? 'border-destructive' : ''}`}
                  />
                  {errors.degree && (
                    <p className="text-sm text-destructive mt-1">{errors.degree}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Major / Specialization (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => handleChange('major', e.target.value)}
                    placeholder="e.g., Artificial Intelligence"
                    className="input-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Graduation Date <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formData.graduationDate}
                    onChange={(e) => handleChange('graduationDate', e.target.value)}
                    className={`input-glass ${errors.graduationDate ? 'border-destructive' : ''}`}
                  />
                  {errors.graduationDate && (
                    <p className="text-sm text-destructive mt-1">{errors.graduationDate}</p>
                  )}
                </div>
              </div>

              {/* Institution Info (Read Only) */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Issuing Institution</p>
                <p className="font-medium">{profile?.institution || 'Not configured'}</p>
              </div>

              {/* Minting Progress */}
              {isSubmitting && mintProgress.stage !== 'idle' && (
                <div className="space-y-2">
                  <Progress value={mintProgress.percent} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">{mintProgress.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {wallet.isConnected ? 'Minting on Blockchain...' : 'Issuing Credential...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {wallet.isConnected ? 'Mint & Issue Credential' : 'Issue Credential (Demo)'}
                  </>
                )}
              </button>

              {!wallet.isConnected && (
                <p className="text-xs text-muted-foreground text-center">
                  Connect your wallet to mint credentials on the blockchain
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default IssueCredentialPage;
