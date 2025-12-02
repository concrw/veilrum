-- Create group_posts table for community group activities
CREATE TABLE public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'announcement', 'question', 'resource', 'event')),
  attachments JSONB DEFAULT '[]'::jsonb,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_post_comments table
CREATE TABLE public.group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.group_post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_post_likes table
CREATE TABLE public.group_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Create group_events table for scheduled activities
CREATE TABLE public.group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'workshop', 'webinar', 'challenge', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER,
  participants_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_event_participants table
CREATE TABLE public.group_event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Add avg_sync_rate column to community_groups if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'community_groups'
    AND column_name = 'avg_sync_rate'
  ) THEN
    ALTER TABLE public.community_groups ADD COLUMN avg_sync_rate INTEGER;
  END IF;
END $$;

-- Enable RLS for all new tables
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_participants ENABLE ROW LEVEL SECURITY;

-- Policies for group_posts (viewable by group members)
CREATE POLICY "Group posts are viewable by authenticated users"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Group members can create posts"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can update their posts"
  ON public.group_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Post authors can delete their posts"
  ON public.group_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Policies for group_post_comments
CREATE POLICY "Comments are viewable by authenticated users"
  ON public.group_post_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.group_post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comment authors can update their comments"
  ON public.group_post_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Comment authors can delete their comments"
  ON public.group_post_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Policies for group_post_likes
CREATE POLICY "Likes are viewable by authenticated users"
  ON public.group_post_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON public.group_post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.group_post_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for group_events
CREATE POLICY "Events are viewable by authenticated users"
  ON public.group_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Group members can create events"
  ON public.group_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_events.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Event creators can update their events"
  ON public.group_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Event creators can delete their events"
  ON public.group_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Policies for group_event_participants
CREATE POLICY "Participants are viewable by authenticated users"
  ON public.group_event_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can register themselves for events"
  ON public.group_event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.group_event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own participation"
  ON public.group_event_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_group_posts_group_id ON public.group_posts(group_id);
CREATE INDEX idx_group_posts_author_id ON public.group_posts(author_id);
CREATE INDEX idx_group_posts_created_at ON public.group_posts(created_at DESC);
CREATE INDEX idx_group_post_comments_post_id ON public.group_post_comments(post_id);
CREATE INDEX idx_group_post_likes_post_id ON public.group_post_likes(post_id);
CREATE INDEX idx_group_events_group_id ON public.group_events(group_id);
CREATE INDEX idx_group_events_start_time ON public.group_events(start_time);
CREATE INDEX idx_group_event_participants_event_id ON public.group_event_participants(event_id);

-- Trigger to update likes_count on group_posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_group_post_likes_count
AFTER INSERT OR DELETE ON public.group_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger to update comments_count on group_posts
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_group_post_comments_count
AFTER INSERT OR DELETE ON public.group_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger to update participants_count on group_events
CREATE OR REPLACE FUNCTION public.update_event_participants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_events SET participants_count = participants_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_events SET participants_count = participants_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_group_event_participants_count
AFTER INSERT OR DELETE ON public.group_event_participants
FOR EACH ROW EXECUTE FUNCTION public.update_event_participants_count();

-- Update RLS policy for group_members to allow viewing all members of a group
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_members;
CREATE POLICY "Authenticated users can view group memberships"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (true);
