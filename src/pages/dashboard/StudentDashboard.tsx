import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatAddress } from '@/lib/web3';
import { supabase } from '@/integrations/supabase/client';
import { 
  GraduationCap, 
  FileCheck, 
  Share2, 
  Clock, 
  Download,
  ExternalLink,
  ArrowRight,
  Sparkles,
  FolderOpen,
  FileX,
  LinkIcon
} from 'lucide-react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getSafeIPFSUrl } from '@/lib/ipfsUtils';

interface Credential {
  id: string;
  token_id: number | null;
  degree: string;
  university: string;
  issued_at: string;
  status: string;
  ipfs_hash: string | null;
}

const StudentDashboard = () => {
  const { wallet } = useWallet();
  const { profile } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!wallet.address) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('credentials')
          .select('*')
          .eq('student_wallet', wallet.address.toLowerCase())
          .order('issued_at', { ascending: false });

        if (error) throw error;
        setCredentials(data || []);
      } catch (error) {
        console.error('Failed to fetch credentials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, [wallet.address]);

  const verifiedCount = credentials.filter(c => c.status === 'verified').length;
  const pendingCount = credentials.filter(c => c.status === 'pending').length;

  const stats = [
    { label: 'Total Credentials', value: credentials.length, icon: FileCheck },
    { label: 'Verified', value: verifiedCount, icon: GraduationCap },
    { label: 'Pending', value: pendingCount, icon: Clock },
  ];

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Welcome back, <span className="gradient-text">{profile?.display_name || 'Student'}</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : ''} • Manage your academic credentials
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Credentials</h2>
              {credentials.length > 0 && (
                <Link to="/dashboard/student/credentials" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className="glass-card p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading credentials...</p>
              </div>
            ) : credentials.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                  <FileX className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Credentials Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You don't have any academic credentials in your wallet yet. 
                  Credentials will appear here once an institution issues them to your wallet address.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/verify" className="btn-secondary">
                    <FileCheck className="w-5 h-5" />
                    Verify a Credential
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {credentials.slice(0, 4).map((credential, index) => (
                  <motion.div
                    key={credential.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="glass-card p-6 group hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">{credential.degree}</h3>
                        <p className="text-sm text-muted-foreground truncate">{credential.university}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        credential.status === 'verified' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {credential.status === 'verified' ? 'Verified' : 'Pending'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      {credential.token_id !== null && (
                        <div>
                          <p className="text-muted-foreground mb-1">Token ID</p>
                          <p className="font-mono">#{credential.token_id}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground mb-1">Issued</p>
                        <p>{new Date(credential.issued_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        to={`/dashboard/student/share/${credential.id}`}
                        className="flex-1 btn-secondary text-sm py-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Share
                      </Link>
                      <button className="btn-secondary text-sm py-2 px-3">
                        <Download className="w-4 h-4" />
                      </button>
                      {credential.ipfs_hash && getSafeIPFSUrl(credential.ipfs_hash) && (
                        <a
                          href={getSafeIPFSUrl(credential.ipfs_hash)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-sm py-2 px-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/dashboard/student/credentials" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">All Credentials</h3>
                  <p className="text-sm text-muted-foreground">View & manage</p>
                </div>
              </Link>

              <Link to="/dashboard/student/resume-builder" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">AI Resume Builder</h3>
                  <p className="text-sm text-muted-foreground">Generate resume</p>
                </div>
              </Link>
              
              <Link to="/verify" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Verify Credential</h3>
                  <p className="text-sm text-muted-foreground">Check any certificate</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
