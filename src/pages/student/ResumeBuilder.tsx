import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/web3';
import { useStreamingAI } from '@/hooks/useStreamingAI';
import { 
  FileText, 
  Loader2, 
  Download, 
  Copy, 
  Check,
  Sparkles,
  Plus,
  X,
  RefreshCw,
  History
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

type ResumeFormat = 'standard' | 'academic' | 'professional' | 'minimal';

const ResumeBuilder = () => {
  const { wallet } = useWallet();
  const { generate, isLoading, streamedText, reset } = useStreamingAI();
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ResumeFormat>('professional');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [objective, setObjective] = useState('');
  const [experience, setExperience] = useState('');
  const [versions, setVersions] = useState<{ text: string; format: ResumeFormat; date: Date }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Demo credentials (in production, these come from blockchain/database)
  const credentials = [
    {
      studentName: 'Jane Smith',
      degree: 'Bachelor of Science in Computer Science',
      university: 'Massachusetts Institute of Technology',
      issuedDate: '2024-06-15',
    },
    {
      studentName: 'Jane Smith',
      degree: 'Master of Business Administration',
      university: 'Harvard Business School',
      issuedDate: '2023-12-20',
    },
  ];

  const formats: { id: ResumeFormat; name: string; description: string }[] = [
    { id: 'standard', name: 'Standard', description: 'Well-balanced professional format' },
    { id: 'academic', name: 'Academic', description: 'CV format for academia' },
    { id: 'professional', name: 'Professional', description: 'Modern career-focused' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple' },
  ];

  const handleGenerate = async () => {
    try {
      const result = await generate('generate-resume', {
        credentials,
        format: selectedFormat,
        additionalInfo: {
          skills: skills.length > 0 ? skills : undefined,
          objective: objective || undefined,
          experience: experience || undefined,
        },
      });

      if (result) {
        setVersions(prev => [{
          text: result,
          format: selectedFormat,
          date: new Date(),
        }, ...prev.slice(0, 4)]);
        toast.success('Resume generated successfully!');
      }
    } catch (error) {
      // Error already handled in useStreamingAI
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleCopy = async () => {
    if (streamedText) {
      await navigator.clipboard.writeText(streamedText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!streamedText) return;
    
    const blob = new Blob([streamedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-${selectedFormat}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Resume downloaded!');
  };

  const loadVersion = (version: { text: string; format: ResumeFormat }) => {
    reset();
    setSelectedFormat(version.format);
    // This is a workaround since we can't directly set streamedText
    // In production, you'd have a separate state for the displayed text
  };

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
                  AI <span className="gradient-text">Resume Builder</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : 'Demo Mode'} • Generate resumes from verified credentials
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Format Selection */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Resume Format
                </h3>
                <div className="space-y-2">
                  {formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedFormat === format.id
                          ? 'bg-primary/20 border border-primary/50'
                          : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <p className="font-medium text-sm">{format.name}</p>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Skills</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add a skill..."
                    className="input-glass flex-1 py-2 text-sm"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="btn-secondary p-2"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Career Objective */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Career Objective</h3>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Describe your career goals..."
                  className="input-glass w-full h-24 resize-none text-sm"
                />
              </div>

              {/* Experience */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Additional Experience</h3>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Add any relevant experience..."
                  className="input-glass w-full h-24 resize-none text-sm"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Resume
                  </>
                )}
              </button>
            </motion.div>

            {/* Preview Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="glass-card p-6 min-h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Resume Preview</h3>
                  {streamedText && (
                    <div className="flex gap-2">
                      <button
                        onClick={reset}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCopy}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={contentRef}
                  className="prose prose-invert prose-sm max-w-none min-h-[500px] overflow-auto"
                >
                  {isLoading && !streamedText && (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin mb-4" />
                      <p>Generating your resume...</p>
                    </div>
                  )}
                  
                  {streamedText ? (
                    <ReactMarkdown>{streamedText}</ReactMarkdown>
                  ) : !isLoading && (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-center">
                        Configure your preferences and click
                        <br />
                        <span className="font-semibold text-foreground">Generate Resume</span>
                        <br />
                        to create your AI-powered resume
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Version History */}
              {versions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 glass-card p-6"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Version History
                  </h3>
                  <div className="space-y-2">
                    {versions.map((version, index) => (
                      <button
                        key={index}
                        onClick={() => loadVersion(version)}
                        className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 text-left transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{version.format} Format</span>
                          <span className="text-xs text-muted-foreground">
                            {version.date.toLocaleTimeString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeBuilder;