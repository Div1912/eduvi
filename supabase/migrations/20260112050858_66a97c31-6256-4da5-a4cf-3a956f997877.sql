-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('student', 'issuer', 'verifier', 'admin');

-- Create user_roles table (separate from profiles to avoid privilege escalation)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create auth_nonces table for signature verification
CREATE TABLE public.auth_nonces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    nonce text NOT NULL,
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
    used boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on auth_nonces
ALTER TABLE public.auth_nonces ENABLE ROW LEVEL SECURITY;

-- Create index for nonce lookups
CREATE INDEX idx_auth_nonces_wallet ON public.auth_nonces(wallet_address, used);

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's wallet address from metadata
CREATE OR REPLACE FUNCTION public.get_user_wallet()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'wallet_address'),
    ''
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can manage roles (using security definer function)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Nonces are created by edge function (service role), never by users directly
-- No user RLS policies needed - edge function uses service role

-- Update profiles table: Add user_id foreign key constraint if not exists
-- and update RLS to use auth.uid() properly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old wallet-based policies and create auth-based ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update credentials policies to use auth properly
DROP POLICY IF EXISTS "Students can view their own credentials" ON public.credentials;

CREATE POLICY "Students can view their own credentials"
ON public.credentials
FOR SELECT
TO authenticated
USING (
  student_wallet = public.get_user_wallet()
  OR issued_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Update verifications policies
DROP POLICY IF EXISTS "Verifiers can view their own verifications" ON public.verifications;
DROP POLICY IF EXISTS "Authenticated users can create verifications" ON public.verifications;

CREATE POLICY "Verifiers can view their own verifications"
ON public.verifications
FOR SELECT
TO authenticated
USING (verifier_wallet = public.get_user_wallet());

CREATE POLICY "Authenticated users can create verifications"
ON public.verifications
FOR INSERT
TO authenticated
WITH CHECK (verifier_wallet = public.get_user_wallet());

-- Update resumes policies
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can create their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;

CREATE POLICY "Users can view their own resumes"
ON public.resumes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR wallet_address = public.get_user_wallet());

CREATE POLICY "Users can create their own resumes"
ON public.resumes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR wallet_address = public.get_user_wallet());

CREATE POLICY "Users can update their own resumes"
ON public.resumes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR wallet_address = public.get_user_wallet())
WITH CHECK (auth.uid() = user_id OR wallet_address = public.get_user_wallet());

CREATE POLICY "Users can delete their own resumes"
ON public.resumes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR wallet_address = public.get_user_wallet());