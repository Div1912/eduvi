import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatAddress } from '@/lib/web3';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileCheck, 
  Users, 
  Clock, 
  Plus,
  Search,
  CheckCircle,
  TrendingUp,
  FileX
} from 'lucide-react';
import DashboardNavbar from '@/components/DashboardNavbar';

interface IssuedCredential {
  id: string;
  token_id: number | null;
  student_name: string;
  degree: string;
  student_wallet: string;
  issued_at: string;
  status: string;
}

const InstitutionDashboard = () => {
  const { wallet } = useWallet();
  const { profile } = useAuth();
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('credentials')
          .select('*')
          .eq('issued_by', profile.id)
          .order('issued_at', { ascending: false });

        if (error) throw error;
        setIssuedCredentials(data || []);
      } catch (error) {
        console.error('Failed to fetch credentials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, [profile?.id]);

  const verifiedCount = issuedCredentials.filter(c => c.status === 'verified').length;
  const pendingCount = issuedCredentials.filter(c => c.status === 'pending').length;
  const uniqueStudents = new Set(issuedCredentials.map(c => c.student_wallet)).size;

  const stats = [
    { label: 'Total Issued', value: issuedCredentials.length, icon: FileCheck },
    { label: 'Students', value: uniqueStudents, icon: Users },
    { label: 'Pending', value: pendingCount, icon: Clock },
    { label: 'Verified', value: verifiedCount, icon: CheckCircle },
  ];

  const filteredCredentials = issuedCredentials.filter(c => 
    c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.degree.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <span className="gradient-text">{profile?.institution || 'Institution'}</span> Dashboard
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : ''} • Issue and manage credentials
                </p>
              </div>
              <Link
                to="/dashboard/institution/issue"
                className="btn-primary w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />
                Issue Credential
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/dashboard/institution/issue" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Issue New</h3>
                  <p className="text-sm text-muted-foreground">Create credential</p>
                </div>
              </Link>

              <Link to="/verify" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Verify</h3>
                  <p className="text-sm text-muted-foreground">Check credentials</p>
                </div>
              </Link>

              <div className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Issued Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Issued Credentials</h2>
              {issuedCredentials.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-glass pl-10 py-2 w-48"
                  />
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="glass-card p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading credentials...</p>
              </div>
            ) : issuedCredentials.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                  <FileX className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Credentials Issued Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start issuing verifiable credentials to your students. Each credential will be minted as an NFT on the blockchain.
                </p>
                <Link to="/dashboard/institution/issue" className="btn-primary">
                  <Plus className="w-5 h-5" />
                  Issue Your First Credential
                </Link>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Token ID</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Degree</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recipient</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCredentials.map((credential) => (
                        <tr 
                          key={credential.id} 
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="p-4 font-mono text-sm">
                            {credential.token_id !== null ? `#${credential.token_id}` : '-'}
                          </td>
                          <td className="p-4 font-medium">{credential.student_name}</td>
                          <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">
                            {credential.degree}
                          </td>
                          <td className="p-4 font-mono text-sm">
                            {formatAddress(credential.student_wallet)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(credential.issued_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            {credential.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default InstitutionDashboard;
