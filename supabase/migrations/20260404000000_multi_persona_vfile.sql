-- ============================================================================
-- #3 세 개의 나 (멀티페르소나 V-File 진단)
-- 같은 40문항을 3가지 맥락(social/general/secret)으로 진행하여 각각 가면 산출
-- ============================================================================

-- 1. priper_sessions에 context 컬럼 추가
ALTER TABLE veilrum.priper_sessions
ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'general'
  CHECK (context IN ('social', 'general', 'secret'));

-- 기존 데이터는 'general'로 설정 (DEFAULT 적용)

-- unique: 한 유저당 맥락별 1개 최신 세션만 유지
CREATE UNIQUE INDEX IF NOT EXISTS idx_priper_sessions_user_context
  ON veilrum.priper_sessions (user_id, context)
  WHERE is_completed = true;

-- 2. persona_profiles에 V-File 연동 컬럼 추가
ALTER TABLE public.persona_profiles
ADD COLUMN IF NOT EXISTS vfile_context text CHECK (vfile_context IN ('social', 'general', 'secret')),
ADD COLUMN IF NOT EXISTS msk_code text,
ADD COLUMN IF NOT EXISTS axis_scores jsonb,
ADD COLUMN IF NOT EXISTS primary_mask text,
ADD COLUMN IF NOT EXISTS secondary_mask text,
ADD COLUMN IF NOT EXISTS is_complex boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS insights jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS vfile_session_id uuid;

-- unique: 한 유저당 맥락별 1개 페르소나만
CREATE UNIQUE INDEX IF NOT EXISTS idx_persona_profiles_user_vfile_context
  ON public.persona_profiles (user_id, vfile_context)
  WHERE vfile_context IS NOT NULL;

-- 3. user_profiles에 멀티페르소나 완료 상태 추가
ALTER TABLE veilrum.user_profiles
ADD COLUMN IF NOT EXISTS persona_contexts_completed text[] DEFAULT '{}';
-- 예: {'general'}, {'general','social'}, {'general','social','secret'}
