import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  GraduationCap,
  Download,
  Loader2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CredentialData {
  id: string;
  token_id: number | null;
  degree: string;
  university: string;
  student_name: string;
}

const ShareCredentialPage = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [credential, setCredential] = useState<CredentialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredential = async () => {
      if (!credentialId) return;
      
      try {
        const { data, error } = await supabase
          .from('credentials')
          .select('id, token_id, degree, university, student_name')
          .eq('id', credentialId)
          .maybeSingle();

        if (error) throw error;
        setCredential(data);
      } catch (error) {
        console.error('Failed to fetch credential:', error);
        toast.error('Failed to load credential');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredential();
  }, [credentialId]);

  // Use token_id for verification if available, otherwise fall back to id
  const verificationParam = credential?.token_id !== null && credential?.token_id !== undefined 
    ? `tokenId=${credential.token_id}` 
    : `id=${credentialId}`;
  const verificationLink = `${window.location.origin}/verify?${verificationParam}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(verificationLink);
    setCopiedLink(true);
    toast.success('Verification link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, 300, 300);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `credential-${credentialId}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('QR code downloaded');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-2xl flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            onClick={() => navigate('/dashboard/student')} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Share Credential</h1>
                <p className="text-muted-foreground text-sm">
                  {credential?.degree} • {credential?.university}
                </p>
              </div>
            </div>

            {/* Token ID Display */}
            {credential?.token_id !== null && credential?.token_id !== undefined && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Token ID for Verification</p>
                <p className="text-2xl font-bold text-primary font-mono">#{credential.token_id}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* QR Code Section */}
              <div className="flex flex-col items-center p-6 bg-white rounded-xl">
                <div ref={qrRef} className="mb-4">
                  <QRCodeSVG 
                    value={verificationLink}
                    size={200}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Scan this QR code to verify the credential
                </p>
                <button
                  onClick={downloadQRCode}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>

              {/* Link Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Verification Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationLink}
                    readOnly
                    className="input-glass flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn-primary px-4"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Share the QR code or link with employers to instantly verify your credential on the blockchain.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <Link to="/dashboard/student" className="btn-secondary">
              Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ShareCredentialPage;
