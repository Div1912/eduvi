import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { mintCertificate, switchToFlowTestnet, FLOW_EVM_TESTNET } from '@/lib/web3';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileUp,
  Upload,
  ExternalLink,
  Copy
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface UploadProgress {
  stage: 'idle' | 'uploading-file' | 'uploading-metadata' | 'minting' | 'saving' | 'complete';
  percent: number;
  message: string;
}

const IssueCredential = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { profile } = useAuth();
  const [isIssuing, setIsIssuing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
  });

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

  const uploadFileToIPFS = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const { data, error } = await supabase.functions.invoke('ipfs-upload', {
      body: formDataUpload,
    });

    if (error) {
      throw new Error(error.message || 'Failed to upload file to IPFS');
    }

    return data.ipfsHash;
  };

  const uploadMetadataToIPFS = async (metadata: {
    name: string;
    description: string;
    image?: string;
    attributes: { trait_type: string; value: string }[];
    studentName: string;
    degree: string;
    university: string;
    issuedAt: string;
    issuerAddress: string;
  }): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('ipfs-upload', {
      body: { metadata },
    });

    if (error) {
      throw new Error(error.message || 'Failed to upload metadata to IPFS');
    }

    return data.ipfsHash;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsIssuing(true);
    setTxHash(null);
    setIpfsHash(null);
    setTokenId(null);

    try {
      // In demo mode, simulate the transaction
      if (!wallet.isConnected) {
        setUploadProgress({ stage: 'uploading-metadata', percent: 50, message: 'Simulating IPFS upload...' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUploadProgress({ stage: 'minting', percent: 75, message: 'Simulating blockchain transaction...' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const fakeHash = '0x' + Math.random().toString(16).slice(2, 66);
        const fakeIpfs = 'ipfs://Qm' + Math.random().toString(36).slice(2, 46);
        const fakeTokenId = Math.floor(Math.random() * 1000);
        
        setTxHash(fakeHash);
        setIpfsHash(fakeIpfs);
        setTokenId(fakeTokenId);
        setUploadProgress({ stage: 'complete', percent: 100, message: 'Complete!' });
        toast.success('Credential issued successfully! (Demo Mode)');
      } else {
        // Ensure we're on Flow EVM Testnet
        if (wallet.chainId !== FLOW_EVM_TESTNET.chainId) {
          toast.info('Switching to Flow EVM Testnet...');
          await switchToFlowTestnet();
        }

        let documentHash: string | undefined;

        // Upload file if provided
        if (formData.certificateFile) {
          setUploadProgress({ 
            stage: 'uploading-file', 
            percent: 20, 
            message: 'Uploading document to IPFS...' 
          });
          documentHash = await uploadFileToIPFS(formData.certificateFile);
          console.log('Document uploaded to IPFS:', documentHash);
        }

        // Create and upload metadata
        setUploadProgress({ 
          stage: 'uploading-metadata', 
          percent: 40, 
          message: 'Creating credential metadata...' 
        });

        const metadata = {
          name: `${formData.degree} - ${formData.studentName}`,
          description: `Academic credential issued by ${formData.university} to ${formData.studentName} for ${formData.degree}.`,
          image: documentHash,
          attributes: [
            { trait_type: 'Degree', value: formData.degree },
            { trait_type: 'University', value: formData.university },
            { trait_type: 'Student', value: formData.studentName },
            { trait_type: 'Issued Date', value: new Date().toISOString().split('T')[0] },
          ],
          studentName: formData.studentName,
          degree: formData.degree,
          university: formData.university,
          issuedAt: new Date().toISOString(),
          issuerAddress: wallet.address!,
        };

        const metadataHash = await uploadMetadataToIPFS(metadata);
        setIpfsHash(metadataHash);
        console.log('Metadata uploaded to IPFS:', metadataHash);

        // Mint on blockchain
        setUploadProgress({ 
          stage: 'minting', 
          percent: 60, 
          message: 'Minting credential on Flow EVM...' 
        });

        const mintResult = await mintCertificate(
          formData.recipientAddress,
          formData.studentName,
          formData.degree,
          formData.university,
          metadataHash
        );

        setTxHash(mintResult.txHash);
        setTokenId(mintResult.tokenId);

        // Save to Supabase database
        setUploadProgress({ 
          stage: 'saving', 
          percent: 85, 
          message: 'Saving credential to database...' 
        });

        const { error: dbError } = await supabase
          .from('credentials')
          .insert({
            student_name: formData.studentName,
            student_wallet: formData.recipientAddress,
            degree: formData.degree,
            university: formData.university,
            ipfs_hash: metadataHash,
            tx_hash: mintResult.txHash,
            token_id: mintResult.tokenId,
            issued_by: profile?.id || null,
            status: 'verified',
            issued_at: new Date().toISOString(),
          });

        if (dbError) {
          console.error('Failed to save credential to database:', dbError);
          toast.warning('Credential minted but failed to save to database');
        }

        setUploadProgress({ stage: 'complete', percent: 100, message: 'Complete!' });
        toast.success('Credential issued and saved successfully!');
      }
    } catch (error: any) {
      console.error('Failed to issue credential:', error);
      toast.error(error.message || 'Failed to issue credential. Please try again.');
      setUploadProgress({ stage: 'idle', percent: 0, message: '' });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, certificateFile: file });
    }
  };

  if (txHash) {
    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    };

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
                The credential has been successfully minted on Flow EVM Testnet and saved to the database.
              </p>
              
              <div className="space-y-4 mb-6 text-left">
                {/* Token ID - Important for verification */}
                {tokenId !== null && (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Token ID (Use for Verification)</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-2xl font-bold text-primary">{tokenId}</code>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(tokenId.toString(), 'Token ID')}
                          className="btn-secondary p-2"
                          title="Copy Token ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a 
                          href={`/verify?tokenId=${tokenId}`}
                          className="btn-primary p-2"
                          title="Verify Credential"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this Token ID with the student for verification
                    </p>
                  </div>
                )}

                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono break-all flex-1">{txHash}</code>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(txHash, 'Transaction hash')}
                        className="btn-secondary p-2"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a 
                        href={`https://evm-testnet.flowscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary p-2"
                        title="View on FlowScan"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {ipfsHash && (
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">IPFS Metadata</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono break-all flex-1">{ipfsHash}</code>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(ipfsHash, 'IPFS hash')}
                          className="btn-secondary p-2"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${ipfsHash.replace('ipfs://', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary p-2"
                          title="View on IPFS"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setTxHash(null);
                    setIpfsHash(null);
                    setTokenId(null);
                    setUploadProgress({ stage: 'idle', percent: 0, message: '' });
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
              Mint a new academic credential NFT on Flow EVM Testnet
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
                  {formData.certificateFile ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <FileUp className="w-6 h-6 text-muted-foreground" />
                  )}
                  <span className={formData.certificateFile ? 'text-green-400' : 'text-muted-foreground'}>
                    {formData.certificateFile 
                      ? formData.certificateFile.name 
                      : 'Click to upload PDF or image (max 10MB)'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Will be uploaded to IPFS for permanent decentralized storage
                </p>
              </div>

              {/* Upload Progress */}
              {isIssuing && uploadProgress.stage !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4 animate-pulse" />
                      {uploadProgress.message}
                    </span>
                    <span>{uploadProgress.percent}%</span>
                  </div>
                  <Progress value={uploadProgress.percent} className="h-2" />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isIssuing}
                className="w-full btn-primary"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadProgress.message || 'Processing...'}
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
