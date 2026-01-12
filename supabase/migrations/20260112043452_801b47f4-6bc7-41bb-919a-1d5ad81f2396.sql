-- Fix overly permissive RLS policies

-- Drop the overly permissive profile insert policy
DROP POLICY IF EXISTS "Anyone can create a profile" ON public.profiles;

-- Create a more secure profile insert policy
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR wallet_address IS NOT NULL);

-- Drop the overly permissive verification insert policy
DROP POLICY IF EXISTS "Anyone can create verifications" ON public.verifications;

-- Create a more secure verification insert policy
CREATE POLICY "Authenticated users can create verifications" 
ON public.verifications 
FOR INSERT 
WITH CHECK (verifier_wallet IS NOT NULL);