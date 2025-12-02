-- ============================================================================
-- Migration: Persona Advanced Features (Branding, Milestones, Growth Tracking)
-- Created: 2024-11-24
-- Description: Tables for branding strategies, milestones, and growth metrics
-- ============================================================================

-- ============================================================================
-- 1. Persona Branding Strategies Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.persona_branding_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_type text NOT NULL CHECK (strategy_type IN ('unified', 'hybrid', 'separated')),
  custom_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_persona_branding_strategies_user_id
  ON public.persona_branding_strategies(user_id);

-- RLS Policies
ALTER TABLE public.persona_branding_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own branding strategies"
  ON public.persona_branding_strategies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own branding strategies"
  ON public.persona_branding_strategies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own branding strategies"
  ON public.persona_branding_strategies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own branding strategies"
  ON public.persona_branding_strategies
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Persona Milestones Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.persona_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  target_date timestamptz,
  milestone_type text CHECK (milestone_type IN ('ikigai', 'branding', 'content', 'community', 'custom')),
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_milestones_user_id
  ON public.persona_milestones(user_id);

CREATE INDEX IF NOT EXISTS idx_persona_milestones_persona_id
  ON public.persona_milestones(persona_id);

CREATE INDEX IF NOT EXISTS idx_persona_milestones_completed
  ON public.persona_milestones(is_completed);

-- RLS Policies
ALTER TABLE public.persona_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.persona_milestones
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.persona_milestones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON public.persona_milestones
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
  ON public.persona_milestones
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Persona Growth Metrics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.persona_growth_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  strength_score float NOT NULL CHECK (strength_score BETWEEN 0 AND 100),
  measurement_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_growth_metrics_user_id
  ON public.persona_growth_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_persona_growth_metrics_persona_id
  ON public.persona_growth_metrics(persona_id);

CREATE INDEX IF NOT EXISTS idx_persona_growth_metrics_measurement_date
  ON public.persona_growth_metrics(measurement_date DESC);

-- RLS Policies
ALTER TABLE public.persona_growth_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own growth metrics"
  ON public.persona_growth_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own growth metrics"
  ON public.persona_growth_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own growth metrics"
  ON public.persona_growth_metrics
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Persona Relationships Table (AI Analysis Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.persona_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona1_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  persona2_id uuid NOT NULL REFERENCES public.persona_profiles(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('synergy', 'conflict', 'neutral')),
  strength_score float CHECK (strength_score BETWEEN 0 AND 100),
  description text,
  common_keywords jsonb DEFAULT '[]'::jsonb,
  ai_insights text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure persona1_id < persona2_id to avoid duplicates
  CONSTRAINT unique_persona_pair UNIQUE (user_id, persona1_id, persona2_id),
  CONSTRAINT ordered_persona_ids CHECK (persona1_id < persona2_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persona_relationships_user_id
  ON public.persona_relationships(user_id);

CREATE INDEX IF NOT EXISTS idx_persona_relationships_persona1
  ON public.persona_relationships(persona1_id);

CREATE INDEX IF NOT EXISTS idx_persona_relationships_persona2
  ON public.persona_relationships(persona2_id);

-- RLS Policies
ALTER TABLE public.persona_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own persona relationships"
  ON public.persona_relationships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persona relationships"
  ON public.persona_relationships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona relationships"
  ON public.persona_relationships
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persona relationships"
  ON public.persona_relationships
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Trigger Functions for updated_at
-- ============================================================================

-- Branding strategies
CREATE OR REPLACE FUNCTION update_persona_branding_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_persona_branding_strategies_updated_at
  BEFORE UPDATE ON public.persona_branding_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_branding_strategies_updated_at();

-- Milestones
CREATE OR REPLACE FUNCTION update_persona_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_persona_milestones_updated_at
  BEFORE UPDATE ON public.persona_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_milestones_updated_at();

-- Auto-set completed_at when milestone is marked complete
CREATE OR REPLACE FUNCTION set_milestone_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_milestone_completed_at
  BEFORE UPDATE ON public.persona_milestones
  FOR EACH ROW
  EXECUTE FUNCTION set_milestone_completed_at();

-- Relationships
CREATE OR REPLACE FUNCTION update_persona_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_persona_relationships_updated_at
  BEFORE UPDATE ON public.persona_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_relationships_updated_at();

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to get latest growth metrics for all user's personas
CREATE OR REPLACE FUNCTION get_persona_growth_summary(input_user_id uuid)
RETURNS TABLE (
  persona_id uuid,
  persona_name text,
  current_strength float,
  previous_strength float,
  change float,
  measurement_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_metrics AS (
    SELECT
      pgm.persona_id,
      pgm.strength_score,
      pgm.measurement_date,
      ROW_NUMBER() OVER (PARTITION BY pgm.persona_id ORDER BY pgm.measurement_date DESC) as rn
    FROM public.persona_growth_metrics pgm
    WHERE pgm.user_id = input_user_id
  ),
  current_scores AS (
    SELECT persona_id, strength_score as current_strength
    FROM latest_metrics
    WHERE rn = 1
  ),
  previous_scores AS (
    SELECT persona_id, strength_score as previous_strength
    FROM latest_metrics
    WHERE rn = 2
  )
  SELECT
    pp.id as persona_id,
    pp.persona_name,
    COALESCE(cs.current_strength, pp.strength_score, 0::float) as current_strength,
    COALESCE(ps.previous_strength, pp.strength_score, 0::float) as previous_strength,
    COALESCE(cs.current_strength, pp.strength_score, 0::float) - COALESCE(ps.previous_strength, pp.strength_score, 0::float) as change,
    (SELECT COUNT(*) FROM public.persona_growth_metrics WHERE persona_id = pp.id)::bigint as measurement_count
  FROM public.persona_profiles pp
  LEFT JOIN current_scores cs ON cs.persona_id = pp.id
  LEFT JOIN previous_scores ps ON ps.persona_id = pp.id
  WHERE pp.user_id = input_user_id
  ORDER BY pp.rank_order NULLS LAST, pp.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default milestones for a persona
CREATE OR REPLACE FUNCTION create_default_milestones(
  input_user_id uuid,
  input_persona_id uuid,
  input_persona_name text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.persona_milestones (user_id, persona_id, title, description, milestone_type, sort_order, target_date)
  VALUES
    (
      input_user_id,
      input_persona_id,
      input_persona_name || ' Ikigai 완성',
      '이 페르소나의 4가지 Ikigai 영역을 모두 채우세요',
      'ikigai',
      1,
      now() + interval '7 days'
    ),
    (
      input_user_id,
      input_persona_id,
      '브랜드 정체성 정의',
      '이 페르소나의 브랜드 컬러, 폰트, 톤앤매너 결정',
      'branding',
      2,
      now() + interval '14 days'
    ),
    (
      input_user_id,
      input_persona_id,
      '첫 콘텐츠 발행',
      '이 페르소나로 첫 블로그 글, 영상, 또는 프로젝트 공유',
      'content',
      3,
      now() + interval '30 days'
    ),
    (
      input_user_id,
      input_persona_id,
      '커뮤니티 참여',
      '관련 커뮤니티에서 활동하고 네트워크 구축',
      'community',
      4,
      now() + interval '60 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Comments
-- ============================================================================

COMMENT ON TABLE public.persona_branding_strategies IS 'Stores user-selected branding strategies for multi-persona management';
COMMENT ON TABLE public.persona_milestones IS 'Tracks growth milestones for each persona';
COMMENT ON TABLE public.persona_growth_metrics IS 'Historical tracking of persona strength scores over time';
COMMENT ON TABLE public.persona_relationships IS 'AI-analyzed relationships between user personas';
COMMENT ON FUNCTION get_persona_growth_summary IS 'Gets current and previous strength scores with change calculation';
COMMENT ON FUNCTION create_default_milestones IS 'Creates standard milestones for a newly created persona';
