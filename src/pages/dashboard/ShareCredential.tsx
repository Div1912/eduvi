import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  LinkIcon, 
  Copy, 
  Check, 
  GraduationCap,
  Calendar
} from 'lucide-react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { toast } from 'sonner';

const ShareCredentialPage = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const navigate = useNavigate();
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | null>(7);

  // Generate verification link directly to the verify page
  const verificationLink = `${window.location.origin}/verify?id=${credentialId}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(verificationLink);
    setCopiedLink(true);
    toast.success('Verification link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

          {/* Share Credential */}
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
                <p className="text-muted-foreground text-sm">Generate a link for employers to verify</p>
              </div>
            </div>

            <div className="space-y-4">
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
                Share this link with employers or anyone who needs to verify your credential. 
                They can use it to instantly verify the authenticity on the blockchain.
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
