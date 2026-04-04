-- Stage 1-5: Vent 세션 종료 시 Session Summary 저장 구조 완성
-- dive_sessions 테이블에 vent 전용 컬럼 추가 + save_vent_session_summary RPC

-- 1) dive_sessions에 vent 세션 요약용 컬럼 추가 (없으면)
DO $$
BEGIN
  -- context_summary: AI가 생성한 전체 세션 요약 텍스트
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'context_summary'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN context_summary text;
  END IF;

  -- held_keywords: 세션에서 추출된 핵심 감정/키워드 배열
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'held_keywords'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN held_keywords text[] DEFAULT '{}';
  END IF;

  -- emotion: 선택된 감정 라벨
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'emotion'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN emotion text;
  END IF;

  -- turn_count: 대화 턴 수
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'turn_count'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN turn_count integer DEFAULT 0;
  END IF;

  -- suggestion: AI 제안 텍스트
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'suggestion'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN suggestion text;
  END IF;

  -- session_completed: 세션이 정상 완료(4턴)되었는지 여부
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'session_completed'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN session_completed boolean DEFAULT false;
  END IF;

  -- ended_at: 세션 종료 시각
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'veilrum' AND table_name = 'dive_sessions' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE veilrum.dive_sessions ADD COLUMN ended_at timestamptz;
  END IF;
END $$;

-- 2) save_vent_session_summary RPC 함수 생성
CREATE OR REPLACE FUNCTION veilrum.save_vent_session_summary(
  p_user_id    uuid,
  p_emotion    text,
  p_messages   jsonb,
  p_suggestion text,
  p_turn_count integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = veilrum
AS $$
DECLARE
  v_session_id uuid;
  v_keywords   text[];
  v_summary    text;
BEGIN
  -- 사용자 메시지에서 키워드 추출 (간단: 사용자 발화 텍스트 수집)
  SELECT array_agg(DISTINCT msg->>'text')
  INTO v_keywords
  FROM jsonb_array_elements(p_messages) AS msg
  WHERE msg->>'role' = 'user'
  LIMIT 10;

  -- 요약 생성: 감정 + 첫 사용자 메시지 + suggestion
  SELECT COALESCE(
    p_emotion || ' | ' ||
    (SELECT msg->>'text' FROM jsonb_array_elements(p_messages) AS msg WHERE msg->>'role' = 'user' LIMIT 1) ||
    ' → ' || p_suggestion,
    p_emotion || ' → ' || p_suggestion
  ) INTO v_summary;

  -- dive_sessions에 INSERT
  INSERT INTO veilrum.dive_sessions (
    user_id, mode, emotion, messages,
    context_summary, held_keywords, suggestion,
    turn_count, session_completed,
    emotional_stability, ended_at
  ) VALUES (
    p_user_id, 'vent', p_emotion, p_messages,
    v_summary, COALESCE(v_keywords, '{}'), p_suggestion,
    p_turn_count, (p_turn_count >= 4),
    50, now()
  )
  RETURNING id INTO v_session_id;

  -- user_profiles.held_last_emotion 업데이트
  UPDATE veilrum.user_profiles
  SET held_last_emotion = p_emotion,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_session_id;
END;
$$;

-- 3) 인덱스: dive_sessions에서 vent 세션 조회 최적화
CREATE INDEX IF NOT EXISTS idx_dive_sessions_mode_user
  ON veilrum.dive_sessions (user_id, mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dive_sessions_emotion
  ON veilrum.dive_sessions (user_id, emotion)
  WHERE emotion IS NOT NULL;
