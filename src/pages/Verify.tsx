import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Loader2, ExternalLink, Shield, GraduationCap, Calendar, Building } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { verifyCertificate, CertificateDetails, isContractConfigured, FLOW_EVM_TESTNET } from '@/lib/web3';
import { getSafeIPFSUrl, cleanIPFSHash } from '@/lib/ipfsUtils';
import { supabase } from '@/integrations/supabase/client';
import BackButton from '@/components/BackButton';

interface DatabaseCredential {
  id: string;
  student_name: string;
  degree: string;
  university: string;
  ipfs_hash: string | null;
  tx_hash: string | null;
  token_id: number | null;
  issued_at: string;
  status: string;
}

const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [tokenId, setTokenId] = useState(searchParams.get('tokenId') || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<CertificateDetails | null>(null);
  const [dbCredential, setDbCredential] = useState<DatabaseCredential | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationSource, setVerificationSource] = useState<'blockchain' | 'database' | 'demo'>('demo');

  // Auto-verify if tokenId is in URL
  useEffect(() => {
    const urlTokenId = searchParams.get('tokenId');
    if (urlTokenId) {
      setTokenId(urlTokenId);
      handleVerify(undefined, urlTokenId);
    }
  }, [searchParams]);

  const handleVerify = async (e?: React.FormEvent, overrideTokenId?: string) => {
    if (e) e.preventDefault();
    const idToVerify = overrideTokenId || tokenId;
    if (!idToVerify.trim()) return;

    setIsVerifying(true);
    setResult(null);
    setDbCredential(null);
    setError(null);

    try {
      // First try blockchain verification
      if (isContractConfigured() && window.ethereum) {
        try {
          const certificate = await verifyCertificate(parseInt(idToVerify));
          if (certificate && certificate.studentName) {
            setResult(certificate);
            setVerificationSource('blockchain');
            
            // Also fetch from database for additional info
            const { data: dbData } = await supabase
              .from('credentials')
              .select('*')
              .eq('token_id', parseInt(idToVerify))
              .maybeSingle();
            
            if (dbData) {
              setDbCredential(dbData as DatabaseCredential);
            }
            
            setIsVerifying(false);
            return;
          }
        } catch (blockchainError) {
          console.log('Blockchain verification failed, trying database:', blockchainError);
        }
      }

      // Try database lookup by token ID
      const { data: dbData, error: dbError } = await supabase
        .from('credentials')
        .select('*')
        .eq('token_id', parseInt(idToVerify))
        .eq('status', 'verified')
        .maybeSingle();

      if (dbData) {
        setDbCredential(dbData as DatabaseCredential);
        setResult({
          studentName: dbData.student_name,
          degree: dbData.degree,
          university: dbData.university,
          ipfsHash: dbData.ipfs_hash || '',
        });
        setVerificationSource('database');
        setIsVerifying(false);
        return;
      }

      // Demo mode fallback
      if (idToVerify === '1' || idToVerify === '0') {
        setResult({
          studentName: 'Jane Smith',
          degree: 'Bachelor of Science in Computer Science',
          university: 'Massachusetts Institute of Technology',
          ipfsHash: 'ipfs://QmXxxxxx...example',
        });
        setVerificationSource('demo');
      } else {
        setError('Certificate not found. The credential may not exist or has not been verified yet.');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Verification failed. Please check the Token ID and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        {/* Background effects */}
        <div className="hero-glow" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <BackButton label="Back" />
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Verify <span className="gradient-text">Credentials</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Enter a Token ID to instantly verify any academic credential on Flow EVM
              </p>
            </motion.div>

            {/* Search form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 mb-8"
            >
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label htmlFor="tokenId" className="block text-sm font-medium mb-2">
                    Certificate Token ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="tokenId"
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      placeholder="Enter Token ID (e.g., 0, 1, 2...)"
                      className="input-glass pl-12"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || !tokenId.trim()}
                  className="w-full btn-primary"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Verify Certificate
                    </>
                  )}
                </button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Credentials are verified on Flow EVM Testnet and stored permanently on IPFS
              </p>
            </motion.div>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8"
              >
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-400">Verified Authentic</h3>
                    <p className="text-sm text-muted-foreground">
                      {verificationSource === 'blockchain' && 'Verified directly from blockchain'}
                      {verificationSource === 'database' && 'Verified from database records'}
                      {verificationSource === 'demo' && 'Demo verification (connect wallet for live verification)'}
                    </p>
                  </div>
                  {verificationSource !== 'demo' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                      {verificationSource === 'blockchain' ? 'On-Chain' : 'Database'}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Student Name</p>
                      <p className="text-xl font-semibold">{result.studentName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Degree</p>
                        <p className="font-medium">{result.degree}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Institution</p>
                        <p className="font-medium">{result.university}</p>
                      </div>
                    </div>
                  </div>

                  {dbCredential?.issued_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Issued On</p>
                        <p className="font-medium">
                          {new Date(dbCredential.issued_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.ipfsHash && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">IPFS Metadata</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-white/5 px-3 py-2 rounded-lg flex-1 overflow-hidden text-ellipsis">
                          {cleanIPFSHash(result.ipfsHash)}
                        </code>
                        {getSafeIPFSUrl(result.ipfsHash) ? (
                          <a
                            href={getSafeIPFSUrl(result.ipfsHash)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary p-2"
                            title="View on IPFS"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="btn-secondary p-2 opacity-50 cursor-not-allowed" title="Invalid IPFS hash">
                            <ExternalLink className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {dbCredential?.tx_hash && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-white/5 px-3 py-2 rounded-lg flex-1 overflow-hidden text-ellipsis">
                          {dbCredential.tx_hash}
                        </code>
                        <a
                          href={`${FLOW_EVM_TESTNET.blockExplorerUrls[0]}/tx/${dbCredential.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary p-2"
                          title="View on FlowScan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 border-destructive/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-destructive">Verification Failed</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyPage;
