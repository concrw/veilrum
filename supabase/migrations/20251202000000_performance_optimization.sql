-- Performance optimization: Add indexes for frequently queried columns

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_active_persona_id ON public.profiles(active_persona_id);

-- Brainstorm sessions indexes
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_user_status ON public.brainstorm_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_ended_at ON public.brainstorm_sessions(ended_at DESC);

-- Job entries indexes
CREATE INDEX IF NOT EXISTS idx_job_entries_session_id ON public.job_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_job_entries_category ON public.job_entries(category) WHERE category IS NOT NULL;

-- Why analysis indexes
CREATE INDEX IF NOT EXISTS idx_why_analysis_user_created ON public.why_analysis(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_why_analysis_session_id ON public.why_analysis(session_id);

-- Ikigai designs indexes
CREATE INDEX IF NOT EXISTS idx_ikigai_designs_user_created ON public.ikigai_designs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ikigai_designs_persona_id ON public.ikigai_designs(persona_id) WHERE persona_id IS NOT NULL;

-- Brand strategies indexes
CREATE INDEX IF NOT EXISTS idx_brand_strategies_user_created ON public.brand_strategies(user_id, created_at DESC);

-- Persona profiles indexes
CREATE INDEX IF NOT EXISTS idx_persona_profiles_user_id ON public.persona_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_profiles_archetype ON public.persona_profiles(archetype);
CREATE INDEX IF NOT EXISTS idx_persona_profiles_strength ON public.persona_profiles(strength DESC);

-- Community groups indexes
CREATE INDEX IF NOT EXISTS idx_community_groups_created_at ON public.community_groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_groups_creator_id ON public.community_groups(creator_id);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_joined_at ON public.group_members(joined_at DESC);

-- Group posts indexes
CREATE INDEX IF NOT EXISTS idx_group_posts_group_created ON public.group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_author_id ON public.group_posts(author_id);

-- Personal match requests indexes
CREATE INDEX IF NOT EXISTS idx_match_requests_requester_status ON public.personal_match_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_target_status ON public.personal_match_requests(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_created_at ON public.personal_match_requests(created_at DESC);

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_1 ON public.chat_rooms(participant_1);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_2 ON public.chat_rooms(participant_2);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON public.chat_rooms(last_message_at DESC NULLS LAST);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON public.chat_messages(is_read) WHERE is_read = false;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_job_entries_session_category ON public.job_entries(session_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_unread ON public.chat_messages(room_id, is_read) WHERE is_read = false;

-- Analyze tables to update statistics
ANALYZE public.profiles;
ANALYZE public.brainstorm_sessions;
ANALYZE public.job_entries;
ANALYZE public.why_analysis;
ANALYZE public.ikigai_designs;
ANALYZE public.brand_strategies;
ANALYZE public.persona_profiles;
ANALYZE public.community_groups;
ANALYZE public.group_members;
ANALYZE public.group_posts;
ANALYZE public.personal_match_requests;
ANALYZE public.chat_rooms;
ANALYZE public.chat_messages;
ANALYZE public.notifications;

-- Add comments
COMMENT ON INDEX idx_profiles_email IS 'Index for email lookup during login';
COMMENT ON INDEX idx_chat_messages_room_created IS 'Index for fetching messages in chronological order';
COMMENT ON INDEX idx_notifications_user_read IS 'Index for fetching unread notifications efficiently';
