import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, ArrowRight } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

import PublicNavbar from '@/components/PublicNavbar'
import BackButton from '@/components/BackButton'

/**
 * VERIFIER ONBOARDING
 *
 * Rules:
 * - Profile MAY exist before onboarding (valid)
 * - Only block if onboarded === true
 * - Allow incomplete profiles to continue onboarding
 */
const VerifierOnboarding = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { wallet } = useWallet()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingProfile, setExistingProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    organization: '',
  })

  /**
   * 🔍 Load profile once
   * - Do NOT block if profile exists
   * - Redirect only if already onboarded
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
        navigate('/dashboard/verifier', { replace: true })
        return
      }

      setExistingProfile(profile)
    }

    loadProfile()
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
       * 🚫 Block ONLY if already onboarded
       */
      if (existingProfile?.onboarded === true) {
        navigate('/dashboard/verifier', { replace: true })
        return
      }

      /**
       * 🔁 CONDITIONAL PROFILE LOGIC
       */
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'verifier',
            display_name: formData.displayName,
            institution: formData.organization || null,
            onboarded: true,
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('profiles').insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          role: 'verifier',
          display_name: formData.displayName,
          institution: formData.organization || null,
          onboarded: true,
        })

        if (error) throw error
      }

      /**
       * ✅ Assign role (safe & idempotent)
       */
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'verifier' },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        )

      if (roleError) throw roleError

      await refreshProfile()
      toast.success('Verifier account created!')
      navigate('/dashboard/verifier')
    } catch (err) {
      console.error('Verifier onboarding error:', err)
      toast.error('Failed to complete setup. Please try again.')
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Set Up <span className="gradient-text">Verification</span>
              </h1>
              <p className="text-muted-foreground">
                Get started verifying academic credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                className="input-glass"
                placeholder="Your Name"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
              />

              <input
                className="input-glass"
                placeholder="Organization (optional)"
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
              />

              <button
                type="submit"
                disabled={isSubmitting || !formData.displayName}
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  <>
                    Start Verifying
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

export default VerifierOnboarding
