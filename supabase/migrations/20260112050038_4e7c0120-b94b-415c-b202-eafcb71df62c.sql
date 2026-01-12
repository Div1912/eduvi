-- Fix PUBLIC_DATA_EXPOSURE: Restrict public access to verified credentials
-- Instead of allowing anyone to view verified credentials, require authentication

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view verified credentials" ON public.credentials;

-- Create a more restrictive policy: authenticated users can view verified credentials
-- This ensures at least basic accountability for who views student data
CREATE POLICY "Authenticated users can view verified credentials"
ON public.credentials
FOR SELECT
USING (
  status = 'verified' AND auth.uid() IS NOT NULL
);