import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/web3';
import { getSafeIPFSUrl } from '@/lib/ipfsUtils';
import { 
  GraduationCap, 
  FileCheck, 
  Share2, 
  Clock, 
  Download,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const StudentDashboard = () => {
  const { wallet } = useWallet();

  // Demo credentials
  const credentials = [
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
  ];

  const stats = [
    { label: 'Total Credentials', value: credentials.length, icon: FileCheck },
    { label: 'Verified', value: credentials.length, icon: GraduationCap },
    { label: 'Shared', value: 5, icon: Share2 },
    { label: 'Pending', value: 0, icon: Clock },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
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
                  Welcome back, <span className="gradient-text">Student</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : 'Demo Mode'} • Manage your academic credentials
                </p>
              </div>
              <Link to="/verify" className="btn-primary w-full sm:w-auto">
                <Plus className="w-5 h-5" />
                Add Credential
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

          {/* Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Credentials</h2>
              <Link to="/student/credentials" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {credentials.map((credential, index) => (
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
                    <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                      Verified
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
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/student/credentials" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">All Credentials</h3>
                  <p className="text-sm text-muted-foreground">View & manage</p>
                </div>
              </Link>

              <Link to="/student/resume-builder" className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
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

              <button className="glass-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Share Credentials</h3>
                  <p className="text-sm text-muted-foreground">Generate share link</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;