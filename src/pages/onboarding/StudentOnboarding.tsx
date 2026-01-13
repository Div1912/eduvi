import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2, ArrowRight } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

import PublicNavbar from '@/components/PublicNavbar'
import BackButton from '@/components/BackButton'

/**
 * STUDENT ONBOARDING
 *
 * Rules:
 * - Profile MAY exist before onboarding
 * - Block ONLY if onboarded === true
 * - Must be re-run safe (refresh / retry / latency)
 */
const StudentOnboarding = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { wallet } = useWallet()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingProfile, setExistingProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    educationLevel: '',
  })

  const educationLevels = [
    'High School',
    'Undergraduate',
    'Graduate',
    'Doctorate',
    'Professional Certificate',
    'Other',
  ]

  /**
   * 🔍 Fetch profile ONCE
   */
  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch failed:', error)
        return
      }

      const profile = data as any

      if (profile?.onboarded === true) {
        navigate('/dashboard/student', { replace: true })
        return
      }

      setExistingProfile(profile)
    }

    loadProfile()
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🔐 HARD SUBMIT LOCK
    if (isSubmitting) return

    if (!user) {
      toast.error('Please sign in first')
      navigate('/auth/sign-in')
      return
    }

    const walletAddress =
      wallet.address || user.user_metadata?.wallet_address

    if (!walletAddress) {
      toast.error('Wallet address not found. Please reconnect your wallet.')
      return
    }

    setIsSubmitting(true)

    try {
      /**
       * 🚫 HARD BLOCK only if already onboarded
       */
      if (existingProfile?.onboarded === true) {
        navigate('/dashboard/student', { replace: true })
        return
      }

      /**
       * 🔁 UPDATE or INSERT (IDEMPOTENT)
       */
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'student',
            display_name: formData.displayName,
            education_level: formData.educationLevel,
            onboarded: true,
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress.toLowerCase(),
            role: 'student',
            display_name: formData.displayName,
            education_level: formData.educationLevel,
            onboarded: true,
          })
          .select()
          .single()

        if (error) throw error

        // 🔁 sync local state
        setExistingProfile(data)
      }

      /**
       * ✅ ROLE ASSIGN (SAFE)
       */
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'student' },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        )

      if (roleError) throw roleError

      await refreshProfile()
      toast.success('Welcome to EduVerify!')
      navigate('/dashboard/student', { replace: true })
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        <div className="hero-glow" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <BackButton to="/onboarding/select-role" label="Back" />

          <div className="glass-card p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Complete Your <span className="gradient-text">Profile</span>
              </h1>
              <p className="text-muted-foreground">
                Tell us a bit about yourself to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="input-glass"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Education Level <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      educationLevel: e.target.value,
                    })
                  }
                  className="input-glass"
                  required
                >
                  <option value="">Select your education level</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.displayName ||
                  !formData.educationLevel
                }
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default StudentOnboarding
