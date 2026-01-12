import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search,
  MoreVertical,
  Shield,
  Building2,
  GraduationCap,
  Eye
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'issuer' | 'verifier' | 'admin'>('all');

  // Demo users
  const allUsers = [
    { id: 1, wallet: '0x1234...5678', role: 'student', name: 'Jane Smith', joinedAt: '2024-06-01', status: 'active' },
    { id: 2, wallet: '0x8765...4321', role: 'issuer', name: 'MIT Admin', joinedAt: '2024-05-15', status: 'active' },
    { id: 3, wallet: '0x9999...1111', role: 'verifier', name: 'HR Manager', joinedAt: '2024-06-10', status: 'active' },
    { id: 4, wallet: '0x2222...3333', role: 'student', name: 'John Doe', joinedAt: '2024-06-12', status: 'active' },
    { id: 5, wallet: '0x4444...5555', role: 'issuer', name: 'Harvard Admin', joinedAt: '2024-05-20', status: 'active' },
    { id: 6, wallet: '0x6666...7777', role: 'admin', name: 'Platform Admin', joinedAt: '2024-01-01', status: 'active' },
  ];

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleIcons = {
    student: GraduationCap,
    issuer: Building2,
    verifier: Eye,
    admin: Shield,
  };

  const roleColors = {
    student: 'text-blue-400 bg-blue-500/10',
    issuer: 'text-purple-400 bg-purple-500/10',
    verifier: 'text-green-400 bg-green-500/10',
    admin: 'text-orange-400 bg-orange-500/10',
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              User <span className="gradient-text">Management</span>
            </h1>
            <p className="text-muted-foreground">
              Manage all platform users and their roles
            </p>
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
                placeholder="Search by wallet or name..."
                className="input-glass pl-12 w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'student', 'issuer', 'verifier', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                    roleFilter === role
                      ? 'bg-primary text-white'
                      : 'bg-white/[0.02] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Wallet</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const RoleIcon = roleIcons[user.role as keyof typeof roleIcons];
                    const roleColor = roleColors[user.role as keyof typeof roleColors];
                    
                    return (
                      <tr 
                        key={user.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColor}`}>
                              <RoleIcon className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm">{user.wallet}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColor}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{user.joinedAt}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                            Active
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="btn-secondary p-2">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;