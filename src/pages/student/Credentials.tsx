import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/web3';
import { getSafeIPFSUrl } from '@/lib/ipfsUtils';
import { 
  GraduationCap, 
  Share2, 
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const StudentCredentials = () => {
  const { wallet } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all');

  // Demo credentials
  const allCredentials = [
    {
      id: 1,
      tokenId: 0,
      degree: 'Bachelor of Science in Computer Science',
      university: 'Massachusetts Institute of Technology',
      issuedDate: '2024-06-15',
      status: 'verified',
      ipfsHash: 'QmXxxxxx...example1',
    },
    {
      id: 2,
      tokenId: 1,
      degree: 'Master of Business Administration',
      university: 'Harvard Business School',
      issuedDate: '2023-12-20',
      status: 'verified',
      ipfsHash: 'QmXxxxxx...example2',
    },
    {
      id: 3,
      tokenId: 2,
      degree: 'Certificate in Data Science',
      university: 'Stanford University',
      issuedDate: '2023-08-10',
      status: 'verified',
      ipfsHash: 'QmXxxxxx...example3',
    },
  ];

  const filteredCredentials = allCredentials.filter(cred => {
    const matchesSearch = cred.degree.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cred.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || cred.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <BackButton to="/student/dashboard" label="Back to Dashboard" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  My <span className="gradient-text">Credentials</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : 'Demo Mode'} • All your verified credentials
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search credentials..."
                className="input-glass pl-12 w-full"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'verified', 'pending'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-primary text-white'
                      : 'bg-white/[0.02] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Credentials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((credential, index) => (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-card p-6 group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Verified</span>
                    </div>
                    <h3 className="font-semibold text-lg truncate">{credential.degree}</h3>
                    <p className="text-sm text-muted-foreground truncate">{credential.university}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Token ID</p>
                    <p className="font-mono">#{credential.tokenId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Issued</p>
                    <p>{credential.issuedDate}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 btn-secondary text-sm py-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="btn-secondary text-sm py-2 px-3">
                    <Download className="w-4 h-4" />
                  </button>
                  {getSafeIPFSUrl(credential.ipfsHash) ? (
                    <a
                      href={getSafeIPFSUrl(credential.ipfsHash)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm py-2 px-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="btn-secondary text-sm py-2 px-3 opacity-50 cursor-not-allowed" title="Invalid IPFS hash">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCredentials.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No credentials found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentCredentials;