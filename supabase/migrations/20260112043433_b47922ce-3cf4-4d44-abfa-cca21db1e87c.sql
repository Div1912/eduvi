-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'issuer', 'verifier', 'admin')),
  display_name TEXT,
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR wallet_address = current_setting('app.wallet_address', true));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create a profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Create credentials table
CREATE TABLE public.credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id INTEGER UNIQUE,
  student_wallet TEXT NOT NULL,
  student_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  university TEXT NOT NULL,
  ipfs_hash TEXT,
  issued_by UUID REFERENCES public.profiles(id),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'revoked')),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Credentials policies
CREATE POLICY "Students can view their own credentials" 
ON public.credentials 
FOR SELECT 
USING (student_wallet = current_setting('app.wallet_address', true));

CREATE POLICY "Issuers can view credentials they issued" 
ON public.credentials 
FOR SELECT 
USING (issued_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view verified credentials" 
ON public.credentials 
FOR SELECT 
USING (status = 'verified');

CREATE POLICY "Issuers can create credentials" 
ON public.credentials 
FOR INSERT 
WITH CHECK (issued_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'issuer'));

CREATE POLICY "Issuers can update their own credentials" 
ON public.credentials 
FOR UPDATE 
USING (issued_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'issuer'));

-- Create verifications table
CREATE TABLE public.verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID REFERENCES public.credentials(id),
  token_id INTEGER NOT NULL,
  verified_by UUID REFERENCES public.profiles(id),
  verifier_wallet TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('verified', 'failed', 'not_found')),
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Verifications policies
CREATE POLICY "Verifiers can view their own verifications" 
ON public.verifications 
FOR SELECT 
USING (verifier_wallet = current_setting('app.wallet_address', true));

CREATE POLICY "Anyone can create verifications" 
ON public.verifications 
FOR INSERT 
WITH CHECK (true);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Resume',
  content JSONB NOT NULL DEFAULT '{}',
  generated_text TEXT,
  format TEXT NOT NULL DEFAULT 'standard' CHECK (format IN ('standard', 'academic', 'professional', 'minimal')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Resume policies
CREATE POLICY "Users can view their own resumes" 
ON public.resumes 
FOR SELECT 
USING (wallet_address = current_setting('app.wallet_address', true) OR auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes" 
ON public.resumes 
FOR INSERT 
WITH CHECK (wallet_address = current_setting('app.wallet_address', true) OR auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
ON public.resumes 
FOR UPDATE 
USING (wallet_address = current_setting('app.wallet_address', true) OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
ON public.resumes 
FOR DELETE 
USING (wallet_address = current_setting('app.wallet_address', true) OR auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();