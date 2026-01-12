import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  Loader2, 
  Send,
  Wallet,
  Mail,
  User,
  FileText,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardNavbar from '@/components/DashboardNavbar';
import { z } from 'zod';

const credentialSchema = z.object({
  studentName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  studentWallet: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  studentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  degree: z.string().trim().min(2, 'Degree must be at least 2 characters').max(200, 'Degree name too long'),
  major: z.string().trim().max(100, 'Major name too long').optional(),
  graduationDate: z.string().min(1, 'Graduation date is required'),
});

const IssueCredentialPage = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentWallet: '',
    studentEmail: '',
    degree: '',
    major: '',
    graduationDate: '',
  });

  const validateForm = () => {
    try {
      credentialSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (!user || !profile) {
      toast.error('Please sign in first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create credential in database
      const { data, error } = await supabase
        .from('credentials')
        .insert({
          student_name: formData.studentName.trim(),
          student_wallet: formData.studentWallet.toLowerCase().trim(),
          degree: formData.degree.trim(),
          university: profile.institution || 'Unknown Institution',
          issued_by: profile.id,
          status: 'pending',
          issued_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Credential issued successfully!');
      
      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          studentName: '',
          studentWallet: '',
          studentEmail: '',
          degree: '',
          major: '',
          graduationDate: '',
        });
        setIsSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to issue credential:', error);
      toast.error(error.message || 'Failed to issue credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Credential Issued!</h2>
              <p className="text-muted-foreground mb-6">
                The credential has been successfully issued to {formData.studentName}.
                It will appear in their wallet once they log in.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="btn-primary"
                >
                  Issue Another
                </button>
                <button
                  onClick={() => navigate('/dashboard/institution')}
                  className="btn-secondary"
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
      <DashboardNavbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <button 
            onClick={() => navigate('/dashboard/institution')} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Issue New Credential</h1>
                <p className="text-muted-foreground">
                  Issue a verifiable credential to a student
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Student Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => handleChange('studentName', e.target.value)}
                    placeholder="Enter student's full name"
                    className={`input-glass ${errors.studentName ? 'border-destructive' : ''}`}
                  />
                  {errors.studentName && (
                    <p className="text-sm text-destructive mt-1">{errors.studentName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Student Wallet Address <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentWallet}
                    onChange={(e) => handleChange('studentWallet', e.target.value)}
                    placeholder="0x..."
                    className={`input-glass font-mono ${errors.studentWallet ? 'border-destructive' : ''}`}
                  />
                  {errors.studentWallet && (
                    <p className="text-sm text-destructive mt-1">{errors.studentWallet}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    The credential will be issued to this wallet address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Student Email (Optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => handleChange('studentEmail', e.target.value)}
                    placeholder="student@email.com"
                    className={`input-glass ${errors.studentEmail ? 'border-destructive' : ''}`}
                  />
                  {errors.studentEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.studentEmail}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Optionally notify the student via email
                  </p>
                </div>
              </div>

              {/* Credential Details */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Credential Details
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Degree / Certificate <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => handleChange('degree', e.target.value)}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    className={`input-glass ${errors.degree ? 'border-destructive' : ''}`}
                  />
                  {errors.degree && (
                    <p className="text-sm text-destructive mt-1">{errors.degree}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Major / Specialization (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => handleChange('major', e.target.value)}
                    placeholder="e.g., Artificial Intelligence"
                    className="input-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Graduation Date <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formData.graduationDate}
                    onChange={(e) => handleChange('graduationDate', e.target.value)}
                    className={`input-glass ${errors.graduationDate ? 'border-destructive' : ''}`}
                  />
                  {errors.graduationDate && (
                    <p className="text-sm text-destructive mt-1">{errors.graduationDate}</p>
                  )}
                </div>
              </div>

              {/* Institution Info (Read Only) */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Issuing Institution</p>
                <p className="font-medium">{profile?.institution || 'Not configured'}</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Issuing Credential...
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

export default IssueCredentialPage;
