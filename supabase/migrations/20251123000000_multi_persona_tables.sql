-- ============================================================================
-- MULTI-PERSONA FEATURE TABLES
-- Enable users to discover and manage multiple personas
-- ============================================================================

-- ============================================
-- 1. PERSONA PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 페르소나 기본 정보
  persona_name text NOT NULL, -- "돕는 나", "창작하는 나"
  persona_archetype text, -- "Healer", "Creator", "Strategist" (원형)
  theme_description text NOT NULL, -- "사람들의 고통을 직접 덜어주며 행복을 느끼는 나"

  -- 색상/아이콘 (UX용)
  color_hex text DEFAULT '#6366f1', -- 페르소나 고유 색상
  icon_name text DEFAULT 'User', -- Lucide 아이콘명

  -- 강도 및 순위
  strength_score float CHECK (strength_score BETWEEN 0 AND 100), -- AI 계산 점수
  rank_order integer, -- 1=메인, 2,3,4,5=서브

  -- 메타데이터
  is_user_verified boolean DEFAULT false, -- 사용자가 확인했는지
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.persona_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own personas" ON public.persona_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas" ON public.persona_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas" ON public.persona_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas" ON public.persona_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_profiles_user_id ON public.persona_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_profiles_rank ON public.persona_profiles(user_id, rank_order);

-- ============================================
-- 2. PERSONA-JOB MAPPINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_job_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  job_entry_id uuid NOT NULL REFERENCES public.job_entries(id) ON DELETE CASCADE,

  -- 클러스터링 메타데이터
  cluster_confidence float, -- 해당 직업이 이 페르소나에 속할 확률
  embedding_vector text, -- 임베딩 벡터 (나중에 재계산용)

  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(persona_id, job_entry_id)
);

-- Enable RLS
ALTER TABLE public.persona_job_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (join을 통해 user_id 확인)
CREATE POLICY "Users can view own persona job mappings" ON public.persona_job_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own persona job mappings" ON public.persona_job_mappings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own persona job mappings" ON public.persona_job_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_job_mappings_persona ON public.persona_job_mappings(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_job_mappings_job ON public.persona_job_mappings(job_entry_id);

-- ============================================
-- 3. PERSONA KEYWORDS
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  frequency integer DEFAULT 1,
  sentiment_score float, -- 감정 점수 (-1 ~ +1)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(persona_id, keyword)
);

-- Enable RLS
ALTER TABLE public.persona_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own persona keywords" ON public.persona_keywords
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own persona keywords" ON public.persona_keywords
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_keywords_persona ON public.persona_keywords(persona_id);

-- ============================================
-- 4. PERSONA PERSPECTIVES (Prime Perspective)
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_perspectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,

  -- Prime Perspective 요소
  perspective_text text NOT NULL, -- "나는 [이런 이유로] [이런 환경에서] 번영한다"
  core_values jsonb DEFAULT '[]'::jsonb, -- ["돌봄", "공감", "치유"]
  happy_patterns jsonb DEFAULT '[]'::jsonb, -- ["직접적 도움", "감정 교류"]
  pain_avoidance jsonb DEFAULT '[]'::jsonb, -- ["고립", "무의미"]
  origin_moments jsonb DEFAULT '[]'::jsonb, -- 각인 순간 요약

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.persona_perspectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own persona perspectives" ON public.persona_perspectives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own persona perspectives" ON public.persona_perspectives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own persona perspectives" ON public.persona_perspectives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_perspectives_persona ON public.persona_perspectives(persona_id);

-- ============================================
-- 5. PERSONA RELATIONSHIPS
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_a_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  persona_b_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,

  -- 관계 유형
  relationship_type text CHECK (relationship_type IN ('synergy', 'conflict', 'neutral')),
  synergy_description text, -- "교육 콘텐츠 = 창작 + 돌봄"
  conflict_description text, -- "자유 vs 안정성 충돌"

  -- AI 분석 점수
  synergy_score float CHECK (synergy_score BETWEEN 0 AND 100),
  conflict_score float CHECK (conflict_score BETWEEN 0 AND 100),

  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(persona_a_id, persona_b_id)
);

-- Enable RLS
ALTER TABLE public.persona_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own persona relationships" ON public.persona_relationships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own persona relationships" ON public.persona_relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own persona relationships" ON public.persona_relationships
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_relationships_user ON public.persona_relationships(user_id);

-- ============================================
-- 6. PERSONA IKIGAI
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_ikigai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,

  -- Ikigai 4요소
  love_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  good_at_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  world_needs_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  paid_for_elements jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- 교집합
  passion jsonb DEFAULT '[]'::jsonb, -- LOVE ∩ GOOD AT
  mission jsonb DEFAULT '[]'::jsonb, -- LOVE ∩ WORLD NEEDS
  profession jsonb DEFAULT '[]'::jsonb, -- GOOD AT ∩ PAID FOR
  vocation jsonb DEFAULT '[]'::jsonb, -- WORLD NEEDS ∩ PAID FOR

  final_ikigai_text text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.persona_ikigai ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own persona ikigai" ON public.persona_ikigai
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own persona ikigai" ON public.persona_ikigai
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own persona ikigai" ON public.persona_ikigai
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_ikigai_persona ON public.persona_ikigai(persona_id);

-- ============================================
-- 7. PERSONA BRANDS
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,

  -- 브랜드 전략
  brand_direction jsonb DEFAULT '{}'::jsonb, -- 브랜드 방향
  content_strategy jsonb DEFAULT '{}'::jsonb, -- 콘텐츠 전략
  target_audience jsonb DEFAULT '{}'::jsonb, -- 타겟 고객
  brand_names jsonb DEFAULT '[]'::jsonb, -- 브랜드명 후보
  selected_name text,
  revenue_model jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.persona_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own persona brands" ON public.persona_brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own persona brands" ON public.persona_brands
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own persona brands" ON public.persona_brands
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_brands_persona ON public.persona_brands(persona_id);

-- ============================================
-- 8. INTEGRATED BRAND STRATEGY (멀티 페르소나용)
-- ============================================

CREATE TABLE IF NOT EXISTS public.integrated_brand_strategy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 통합 전략 유형
  integration_type text CHECK (integration_type IN ('unified', 'hybrid', 'separated')),
  -- unified: 하나의 통합 브랜드
  -- hybrid: 메인+서브 구조
  -- separated: 완전 분리

  -- 전략 내용
  unified_brand_name text,
  unified_tagline text,
  positioning_strategy text, -- "르네상스형 인간" 포지셔닝
  content_mix_strategy jsonb DEFAULT '{}'::jsonb, -- 요일별, 주제별 콘텐츠 믹스

  -- 페르소나별 비중
  persona_allocation jsonb DEFAULT '{}'::jsonb, -- {"돕는 나": 50%, "창작하는 나": 30%, "전략 나": 20%}

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrated_brand_strategy ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own integrated brand strategy" ON public.integrated_brand_strategy
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrated brand strategy" ON public.integrated_brand_strategy
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrated brand strategy" ON public.integrated_brand_strategy
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrated_brand_strategy_user ON public.integrated_brand_strategy(user_id);

-- ============================================
-- 9. PERSONA GROWTH TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.persona_growth_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,

  -- 스냅샷 데이터
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  activation_percentage float, -- 해당 페르소나 활성화 비율
  skills_count integer, -- 관련 스킬 개수
  content_count integer, -- 관련 콘텐츠 수
  revenue_contribution float, -- 수익 기여도

  -- 주관적 평가
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 5),
  user_notes text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.persona_growth_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own persona growth tracking" ON public.persona_growth_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own persona growth tracking" ON public.persona_growth_tracking
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persona_profiles pp
      WHERE pp.id = persona_id AND pp.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_growth_persona_date ON public.persona_growth_tracking(persona_id, snapshot_date DESC);

-- ============================================
-- 10. EXTEND PROFILES TABLE
-- ============================================

-- Add columns to profiles table for multi-persona support
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_multiple_personas boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS active_persona_id uuid REFERENCES public.persona_profiles(id),
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for persona_profiles updated_at
CREATE TRIGGER set_persona_profiles_updated_at
  BEFORE UPDATE ON public.persona_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for persona_perspectives updated_at
CREATE TRIGGER set_persona_perspectives_updated_at
  BEFORE UPDATE ON public.persona_perspectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for persona_ikigai updated_at
CREATE TRIGGER set_persona_ikigai_updated_at
  BEFORE UPDATE ON public.persona_ikigai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for persona_brands updated_at
CREATE TRIGGER set_persona_brands_updated_at
  BEFORE UPDATE ON public.persona_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for integrated_brand_strategy updated_at
CREATE TRIGGER set_integrated_brand_strategy_updated_at
  BEFORE UPDATE ON public.integrated_brand_strategy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check persona access based on subscription tier
CREATE OR REPLACE FUNCTION public.check_persona_access(persona_rank integer, user_tier text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Free users can only access rank 1 (main persona)
  IF user_tier = 'free' AND persona_rank > 1 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Function to get user's accessible personas
CREATE OR REPLACE FUNCTION public.get_accessible_personas(input_user_id uuid)
RETURNS TABLE (
  id uuid,
  persona_name text,
  persona_archetype text,
  theme_description text,
  color_hex text,
  icon_name text,
  strength_score float,
  rank_order integer,
  is_accessible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier text;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE profiles.id = input_user_id;

  -- Return personas with accessibility flag
  RETURN QUERY
  SELECT
    pp.id,
    pp.persona_name,
    pp.persona_archetype,
    pp.theme_description,
    pp.color_hex,
    pp.icon_name,
    pp.strength_score,
    pp.rank_order,
    check_persona_access(pp.rank_order, COALESCE(user_tier, 'free')) as is_accessible
  FROM persona_profiles pp
  WHERE pp.user_id = input_user_id
    AND pp.is_active = true
  ORDER BY pp.rank_order;
END;
$$;

-- Function to count user personas
CREATE OR REPLACE FUNCTION public.count_user_personas(input_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  persona_count integer;
BEGIN
  SELECT COUNT(*) INTO persona_count
  FROM persona_profiles
  WHERE user_id = input_user_id AND is_active = true;

  RETURN COALESCE(persona_count, 0);
END;
$$;
