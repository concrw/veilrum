-- Chat system for PRIPER
-- Enables 1:1 messaging between matched users

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_rooms_unique_pair UNIQUE (participant_1, participant_2),
  CONSTRAINT chat_rooms_ordered_participants CHECK (participant_1 < participant_2)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can view their chat rooms') THEN
    CREATE POLICY "Users can view their chat rooms"
      ON public.chat_rooms
      FOR SELECT
      TO authenticated
      USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can create chat rooms') THEN
    CREATE POLICY "Users can create chat rooms"
      ON public.chat_rooms
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can update their chat rooms') THEN
    CREATE POLICY "Users can update their chat rooms"
      ON public.chat_rooms
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
  END IF;
END $$;

-- Policies for chat_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view messages in their rooms') THEN
    CREATE POLICY "Users can view messages in their rooms"
      ON public.chat_messages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.chat_rooms
          WHERE id = chat_messages.room_id
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can send messages') THEN
    CREATE POLICY "Users can send messages"
      ON public.chat_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM public.chat_rooms
          WHERE id = chat_messages.room_id
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can update messages in their rooms') THEN
    CREATE POLICY "Users can update messages in their rooms"
      ON public.chat_messages
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.chat_rooms
          WHERE id = chat_messages.room_id
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_1 ON public.chat_rooms(participant_1);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_2 ON public.chat_rooms(participant_2);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON public.chat_rooms(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(room_id, is_read) WHERE is_read = false;

-- Function to get or create chat room
CREATE OR REPLACE FUNCTION public.get_or_create_chat_room(p_user_1 UUID, p_user_2 UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room_id UUID;
  v_participant_1 UUID;
  v_participant_2 UUID;
BEGIN
  -- Ensure consistent ordering
  IF p_user_1 < p_user_2 THEN
    v_participant_1 := p_user_1;
    v_participant_2 := p_user_2;
  ELSE
    v_participant_1 := p_user_2;
    v_participant_2 := p_user_1;
  END IF;

  -- Try to find existing room
  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE participant_1 = v_participant_1 AND participant_2 = v_participant_2;

  -- Create if not exists
  IF v_room_id IS NULL THEN
    INSERT INTO public.chat_rooms (participant_1, participant_2)
    VALUES (v_participant_1, v_participant_2)
    RETURNING id INTO v_room_id;
  END IF;

  RETURN v_room_id;
END;
$$;

-- Trigger to update last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_room_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_room_last_message ON public.chat_messages;
CREATE TRIGGER trg_update_room_last_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_room_last_message();

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
