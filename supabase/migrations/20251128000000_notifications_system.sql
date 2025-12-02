-- Notifications system for PRIPER
-- Handles match requests, group activities, and system notifications

-- Create personal_match_requests table if not exists
CREATE TABLE IF NOT EXISTS public.personal_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  analysis_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Enable RLS for personal_match_requests
ALTER TABLE public.personal_match_requests ENABLE ROW LEVEL SECURITY;

-- Policies for personal_match_requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_match_requests' AND policyname = 'Users can view their match requests') THEN
    CREATE POLICY "Users can view their match requests"
      ON public.personal_match_requests
      FOR SELECT
      TO authenticated
      USING (auth.uid() = requester_id OR auth.uid() = target_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_match_requests' AND policyname = 'Users can create match requests') THEN
    CREATE POLICY "Users can create match requests"
      ON public.personal_match_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = requester_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_match_requests' AND policyname = 'Users can update their match requests') THEN
    CREATE POLICY "Users can update their match requests"
      ON public.personal_match_requests
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = requester_id OR auth.uid() = target_user_id);
  END IF;
END $$;

-- Index for personal_match_requests
CREATE INDEX IF NOT EXISTS idx_personal_match_requests_requester ON public.personal_match_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_personal_match_requests_target ON public.personal_match_requests(target_user_id);

-- Create notification_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM (
      'match_request',
      'match_accepted',
      'match_declined',
      'group_invite',
      'group_post',
      'group_comment',
      'group_event',
      'system'
    );
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications"
      ON public.notifications
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications"
      ON public.notifications
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete their own notifications') THEN
    CREATE POLICY "Users can delete their own notifications"
      ON public.notifications
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can insert notifications') THEN
    CREATE POLICY "System can insert notifications"
      ON public.notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Trigger to create notification on match request
CREATE OR REPLACE FUNCTION public.notify_on_match_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_requester_name TEXT;
BEGIN
  -- Get requester name
  SELECT COALESCE(display_name, email) INTO v_requester_name
  FROM public.profiles
  WHERE id = NEW.requester_id;

  -- Create notification for target user
  IF NEW.target_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.target_user_id,
      'match_request',
      '새로운 매칭 요청',
      COALESCE(v_requester_name, '사용자') || '님이 매칭을 요청했습니다.',
      jsonb_build_object('request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trg_notify_match_request ON public.personal_match_requests;
CREATE TRIGGER trg_notify_match_request
AFTER INSERT ON public.personal_match_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_match_request();

-- Trigger to create notification on match response
CREATE OR REPLACE FUNCTION public.notify_on_match_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_responder_name TEXT;
BEGIN
  -- Only trigger when status changes to accepted or declined
  IF OLD.status = 'pending' AND (NEW.status = 'accepted' OR NEW.status = 'declined') THEN
    -- Get responder name
    SELECT COALESCE(display_name, email) INTO v_responder_name
    FROM public.profiles
    WHERE id = NEW.target_user_id;

    IF NEW.status = 'accepted' THEN
      PERFORM public.create_notification(
        NEW.requester_id,
        'match_accepted',
        '매칭 수락됨',
        COALESCE(v_responder_name, '사용자') || '님이 매칭 요청을 수락했습니다.',
        jsonb_build_object('request_id', NEW.id, 'target_user_id', NEW.target_user_id)
      );
    ELSE
      PERFORM public.create_notification(
        NEW.requester_id,
        'match_declined',
        '매칭 거절됨',
        COALESCE(v_responder_name, '사용자') || '님이 매칭 요청을 거절했습니다.',
        jsonb_build_object('request_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_match_response ON public.personal_match_requests;
CREATE TRIGGER trg_notify_match_response
AFTER UPDATE ON public.personal_match_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_match_response();

-- Trigger to create notification on group post (only if table exists)
CREATE OR REPLACE FUNCTION public.notify_on_group_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_author_name TEXT;
  v_group_name TEXT;
  v_member RECORD;
BEGIN
  -- Get author name
  SELECT COALESCE(display_name, email) INTO v_author_name
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Get group name
  SELECT name INTO v_group_name
  FROM public.community_groups
  WHERE id = NEW.group_id;

  -- Notify all group members except author
  FOR v_member IN
    SELECT user_id FROM public.group_members
    WHERE group_id = NEW.group_id AND user_id != NEW.author_id
  LOOP
    PERFORM public.create_notification(
      v_member.user_id,
      'group_post',
      COALESCE(v_group_name, '그룹') || ' 새 게시글',
      COALESCE(v_author_name, '사용자') || '님이 새 글을 작성했습니다.',
      jsonb_build_object('group_id', NEW.group_id, 'post_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Only create trigger if group_posts table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_posts') THEN
    DROP TRIGGER IF EXISTS trg_notify_group_post ON public.group_posts;
    CREATE TRIGGER trg_notify_group_post
    AFTER INSERT ON public.group_posts
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_group_post();
  END IF;
END $$;

-- Trigger to create notification on group event
CREATE OR REPLACE FUNCTION public.notify_on_group_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_creator_name TEXT;
  v_group_name TEXT;
  v_member RECORD;
BEGIN
  -- Get creator name
  SELECT COALESCE(display_name, email) INTO v_creator_name
  FROM public.profiles
  WHERE id = NEW.creator_id;

  -- Get group name
  SELECT name INTO v_group_name
  FROM public.community_groups
  WHERE id = NEW.group_id;

  -- Notify all group members except creator
  FOR v_member IN
    SELECT user_id FROM public.group_members
    WHERE group_id = NEW.group_id AND user_id != NEW.creator_id
  LOOP
    PERFORM public.create_notification(
      v_member.user_id,
      'group_event',
      COALESCE(v_group_name, '그룹') || ' 새 이벤트',
      COALESCE(v_creator_name, '사용자') || '님이 "' || NEW.title || '" 이벤트를 만들었습니다.',
      jsonb_build_object('group_id', NEW.group_id, 'event_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Only create trigger if group_events table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_events') THEN
    DROP TRIGGER IF EXISTS trg_notify_group_event ON public.group_events;
    CREATE TRIGGER trg_notify_group_event
    AFTER INSERT ON public.group_events
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_group_event();
  END IF;
END $$;
