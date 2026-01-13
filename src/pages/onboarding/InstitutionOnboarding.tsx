import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Building2, Loader2, ArrowRight } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

import PublicNavbar from '@/components/PublicNavbar'
import BackButton from '@/components/BackButton'

/**
 * INSTITUTION ONBOARDING
 *
 * Rules:
 * - Profile MAY exist before onboarding
 * - Block ONLY if onboarded === true
 * - Safe on refresh / retry / tab switch
 */
const InstitutionOnboarding = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { wallet } = useWallet()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingProfile, setExistingProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    institutionName: '',
    institutionType: '',
    displayName: '',
  })

  const institutionTypes = [
    'University',
    'College',
    'School',
    'Training Institute',
    'Certification Body',
    'Other',
  ]

  /* --------------------------------------------------
   * Load profile ONCE
   * -------------------------------------------------- */
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
        navigate('/dashboard/institution', { replace: true })
        return
      }

      setExistingProfile(profile)
    }

    loadProfile()
  }, [user, navigate])

  /* --------------------------------------------------
   * Submit handler
   * -------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      // 🚫 Block ONLY if already onboarded
      if (existingProfile?.onboarded === true) {
        navigate('/dashboard/institution', { replace: true })
        return
      }

      // 🔁 UPDATE or INSERT (IDEMPOTENT)
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'issuer',
            display_name: formData.displayName,
            institution: formData.institutionName,
            institution_type: formData.institutionType,
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
            role: 'issuer',
            display_name: formData.displayName,
            institution: formData.institutionName,
            institution_type: formData.institutionType,
            onboarded: true,
          })
          .select()
          .single()

        if (error) throw error
        setExistingProfile(data)
      }

      // ✅ Assign role (idempotent)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'issuer' },
          { onConflict: 'user_id,role' }
        )

      if (roleError) throw roleError

      // 🔁 Sync auth context
      await refreshProfile()

      toast.success('Institution registered successfully!')
      navigate('/dashboard/institution', { replace: true })
    } catch (err) {
      console.error('Institution onboarding error:', err)
      toast.error('Failed to complete registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* --------------------------------------------------
   * UI
   * -------------------------------------------------- */
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Register Your <span className="gradient-text">Institution</span>
              </h1>
              <p className="text-muted-foreground">
                Set up your institution to start issuing credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                className="input-glass"
                placeholder="Institution Name"
                value={formData.institutionName}
                onChange={(e) =>
                  setFormData({ ...formData, institutionName: e.target.value })
                }
                required
              />

              <select
                className="input-glass"
                value={formData.institutionType}
                onChange={(e) =>
                  setFormData({ ...formData, institutionType: e.target.value })
                }
                required
              >
                <option value="">Select institution type</option>
                {institutionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                className="input-glass"
                placeholder="Your Name"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
              />

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.institutionName ||
                  !formData.institutionType ||
                  !formData.displayName
                }
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering Institution...
                  </>
                ) : (
                  <>
                    Complete Registration
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

export default InstitutionOnboarding
