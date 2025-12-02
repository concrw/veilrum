-- Create enums for match types, statuses, and group roles
CREATE TYPE public.match_type AS ENUM ('similar', 'complementary');
CREATE TYPE public.match_status AS ENUM ('pending', 'connected', 'dismissed');
CREATE TYPE public.group_member_role AS ENUM ('member', 'admin');

-- Create community_groups table
CREATE TABLE public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for community_groups
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

-- Policies for community_groups
CREATE POLICY "Groups are viewable by authenticated users"
  ON public.community_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own groups"
  ON public.community_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group creators can update their groups"
  ON public.community_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Group creators can delete their groups"
  ON public.community_groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Enable RLS for group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Policies for group_members
CREATE POLICY "Users can view their own memberships"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups as themselves"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave their own memberships"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep member_count in sync via trigger
CREATE OR REPLACE FUNCTION public.recalc_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_groups cg
  SET member_count = (
    SELECT COUNT(*) FROM public.group_members gm
    WHERE gm.group_id = COALESCE(NEW.group_id, OLD.group_id)
  )
  WHERE cg.id = COALESCE(NEW.group_id, OLD.group_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_group_members_after_insert
AFTER INSERT ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.recalc_group_member_count();

CREATE TRIGGER trg_group_members_after_delete
AFTER DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.recalc_group_member_count();

-- Create user_matches table
CREATE TABLE public.user_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_type public.match_type NOT NULL,
  compatibility_score INTEGER NOT NULL DEFAULT 0,
  match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.match_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_matches_not_self CHECK (user_id <> matched_user_id),
  CONSTRAINT user_matches_unique_pair UNIQUE (user_id, matched_user_id, match_type)
);

-- Indexes
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_user_matches_user_id ON public.user_matches(user_id);
CREATE INDEX idx_user_matches_matched_user_id ON public.user_matches(matched_user_id);

-- Enable RLS for user_matches
ALTER TABLE public.user_matches ENABLE ROW LEVEL SECURITY;

-- Policies for user_matches
CREATE POLICY "Users can view matches they are part of"
  ON public.user_matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create matches for themselves"
  ON public.user_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own initiated matches"
  ON public.user_matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own initiated matches"
  ON public.user_matches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
