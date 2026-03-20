-- Create/update common timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles (private by default)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-insert profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes to speed up user-based queries
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_user_id ON public.brainstorm_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_entries_user_id ON public.job_entries(user_id);

-- Harden RLS on existing tables while keeping anonymous usage
ALTER TABLE public.brainstorm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_entries ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brainstorm_sessions' AND policyname = 'Enable all access for brainstorm_sessions'
  ) THEN
    EXECUTE 'DROP POLICY "Enable all access for brainstorm_sessions" ON public.brainstorm_sessions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_entries' AND policyname = 'Enable all access for job_entries'
  ) THEN
    EXECUTE 'DROP POLICY "Enable all access for job_entries" ON public.job_entries';
  END IF;
END $$;

-- Authenticated users: full access to their rows
CREATE POLICY IF NOT EXISTS "Users can view their own brainstorm_sessions"
ON public.brainstorm_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can modify their own brainstorm_sessions"
ON public.brainstorm_sessions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view their own job_entries"
ON public.job_entries
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can modify their own job_entries"
ON public.job_entries
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Anonymous users: allow working with rows that are not yet linked to a user
CREATE POLICY IF NOT EXISTS "Anonymous can insert brainstorm_sessions without user"
ON public.brainstorm_sessions
FOR INSERT
WITH CHECK (user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Anonymous can read/update/delete unowned brainstorm_sessions"
ON public.brainstorm_sessions
FOR ALL
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Anonymous can insert job_entries without user"
ON public.job_entries
FOR INSERT
WITH CHECK (user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Anonymous can read/update/delete unowned job_entries"
ON public.job_entries
FOR ALL
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);
