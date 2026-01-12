import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { mintCertificate } from '@/lib/web3';
import { 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileUp
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { toast } from 'sonner';

const IssueCredential = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [isIssuing, setIsIssuing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    recipientAddress: '',
    studentName: '',
    degree: '',
    university: 'Massachusetts Institute of Technology',
    certificateFile: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      newErrors.recipientAddress = 'Invalid Ethereum address';
    }
    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }
    if (formData.studentName.length > 50) {
      newErrors.studentName = 'Student name must be 50 characters or less';
    }
    if (!formData.degree.trim()) {
      newErrors.degree = 'Degree is required';
    }
    if (!formData.university.trim()) {
      newErrors.university = 'University is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsIssuing(true);
    setTxHash(null);

    try {
      // In demo mode, simulate the transaction
      if (!wallet.isConnected) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTxHash('0x' + Math.random().toString(16).slice(2, 66));
        toast.success('Credential issued successfully! (Demo Mode)');
      } else {
        // Real blockchain transaction
        const certificateURI = 'ipfs://QmExample...'; // In production, upload to IPFS first
        const hash = await mintCertificate(
          formData.recipientAddress,
          formData.studentName,
          formData.degree,
          formData.university,
          certificateURI
        );
        setTxHash(hash);
        toast.success('Credential issued successfully!');
      }
    } catch (error) {
      console.error('Failed to issue credential:', error);
      toast.error('Failed to issue credential. Please try again.');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, certificateFile: file });
    }
  };

  if (txHash) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-2xl">
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
                The credential has been successfully minted on the blockchain.
              </p>
              
              <div className="bg-white/[0.02] rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                <code className="text-sm font-mono break-all">{txHash}</code>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setTxHash(null);
                    setFormData({
                      recipientAddress: '',
                      studentName: '',
                      degree: '',
                      university: 'Massachusetts Institute of Technology',
                      certificateFile: null,
                    });
                  }}
                  className="btn-secondary"
                >
                  Issue Another
                </button>
                <button
                  onClick={() => navigate('/issuer/dashboard')}
                  className="btn-primary"
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
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <BackButton to="/issuer/dashboard" label="Back to Dashboard" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Issue <span className="gradient-text">Credential</span>
            </h1>
            <p className="text-muted-foreground">
              Mint a new academic credential NFT on the blockchain
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recipient Wallet Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                  placeholder="0x..."
                  className={`input-glass ${errors.recipientAddress ? 'border-destructive' : ''}`}
                />
                {errors.recipientAddress && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.recipientAddress}
                  </p>
                )}
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Student Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Full legal name"
                  maxLength={50}
                  className={`input-glass ${errors.studentName ? 'border-destructive' : ''}`}
                />
                <div className="flex justify-between mt-1">
                  {errors.studentName ? (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.studentName}
                    </p>
                  ) : <span />}
                  <span className="text-xs text-muted-foreground">
                    {formData.studentName.length}/50
                  </span>
                </div>
              </div>

              {/* Degree */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Degree / Credential <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  className={`input-glass ${errors.degree ? 'border-destructive' : ''}`}
                />
                {errors.degree && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.degree}
                  </p>
                )}
              </div>

              {/* University */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className={`input-glass ${errors.university ? 'border-destructive' : ''}`}
                />
                {errors.university && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.university}
                  </p>
                )}
              </div>

              {/* Certificate File */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Certificate Document (Optional)
                </label>
                <label className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-colors">
                  <FileUp className="w-6 h-6 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formData.certificateFile 
                      ? formData.certificateFile.name 
                      : 'Click to upload PDF or image'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Will be uploaded to IPFS for permanent storage
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isIssuing}
                className="w-full btn-primary"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Issuing Credential...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Issue Credential
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default IssueCredential;