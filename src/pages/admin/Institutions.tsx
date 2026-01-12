import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search,
  Plus,
  CheckCircle,
  Clock,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const AdminInstitutions = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Demo institutions
  const institutions = [
    { 
      id: 1, 
      name: 'Massachusetts Institute of Technology', 
      wallet: '0x1111...2222',
      credentialsIssued: 1247,
      verified: true,
      joinedAt: '2024-01-15',
      logo: 'MIT'
    },
    { 
      id: 2, 
      name: 'Harvard University', 
      wallet: '0x3333...4444',
      credentialsIssued: 892,
      verified: true,
      joinedAt: '2024-02-20',
      logo: 'HU'
    },
    { 
      id: 3, 
      name: 'Stanford University', 
      wallet: '0x5555...6666',
      credentialsIssued: 654,
      verified: true,
      joinedAt: '2024-03-10',
      logo: 'SU'
    },
    { 
      id: 4, 
      name: 'Oxford University', 
      wallet: '0x7777...8888',
      credentialsIssued: 0,
      verified: false,
      joinedAt: '2024-06-01',
      logo: 'OU'
    },
  ];

  const filteredInstitutions = institutions.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Institution <span className="gradient-text">Management</span>
                </h1>
                <p className="text-muted-foreground">
                  Manage registered institutions and their credentials
                </p>
              </div>
              <button className="btn-primary w-full sm:w-auto">
                <Plus className="w-5 h-5" />
                Add Institution
              </button>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search institutions..."
                className="input-glass pl-12 w-full"
              />
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass-card p-5">
              <div className="text-2xl font-bold mb-1">{institutions.length}</div>
              <div className="text-sm text-muted-foreground">Total Institutions</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-2xl font-bold mb-1">{institutions.filter(i => i.verified).length}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-2xl font-bold mb-1">{institutions.filter(i => !i.verified).length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-2xl font-bold mb-1">{institutions.reduce((acc, i) => acc + i.credentialsIssued, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Credentials Issued</div>
            </div>
          </motion.div>

          {/* Institutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInstitutions.map((institution, index) => (
              <motion.div
                key={institution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
                      {institution.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{institution.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{institution.wallet}</p>
                    </div>
                  </div>
                  <button className="btn-secondary p-2">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Credentials Issued</p>
                    <p className="font-semibold">{institution.credentialsIssued.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Joined</p>
                    <p className="font-semibold">{institution.joinedAt}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {institution.verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      Pending Verification
                    </span>
                  )}
                  <button className="text-sm text-primary hover:underline flex items-center gap-1">
                    View Details <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminInstitutions;