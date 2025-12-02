-- Remove overly permissive RLS policies that exposed data to everyone
-- This keeps user-specific and anonymous (unowned) flows intact
begin;
-- brainstorm_sessions: drop full access policy
DROP POLICY IF EXISTS "Enable all access for brainstorm_sessions" ON public.brainstorm_sessions;
-- job_entries: drop full access policy
DROP POLICY IF EXISTS "Enable all access for job_entries" ON public.job_entries;
commit;

-- ============================================================================
-- CREATE IKIGAI DESIGN TABLES
-- This enables users to manually design their Ikigai step by step
-- ============================================================================

-- Create user_skills table for managing skills with proficiency levels
CREATE TABLE IF NOT EXISTS public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_name text NOT NULL,
  skill_level integer NOT NULL CHECK (skill_level >= 1 AND skill_level <= 5),
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_skills_unique_skill UNIQUE (user_id, skill_name)
);

-- Enable RLS for user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- Policies for user_skills: users can only access their own skills
CREATE POLICY "Users can view their own skills"
  ON public.user_skills
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON public.user_skills
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.user_skills
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON public.user_skills
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_social_needs table for social values selection
CREATE TABLE IF NOT EXISTS public.user_social_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  need_text text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_social_needs_unique UNIQUE (user_id, need_text)
);

-- Enable RLS for user_social_needs
ALTER TABLE public.user_social_needs ENABLE ROW LEVEL SECURITY;

-- Policies for user_social_needs
CREATE POLICY "Users can view their own social needs"
  ON public.user_social_needs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social needs"
  ON public.user_social_needs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social needs"
  ON public.user_social_needs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social needs"
  ON public.user_social_needs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_revenue_opportunities table for revenue streams
CREATE TABLE IF NOT EXISTS public.user_revenue_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  opportunity_text text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_revenue_opportunities_unique UNIQUE (user_id, opportunity_text)
);

-- Enable RLS for user_revenue_opportunities
ALTER TABLE public.user_revenue_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies for user_revenue_opportunities
CREATE POLICY "Users can view their own revenue opportunities"
  ON public.user_revenue_opportunities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revenue opportunities"
  ON public.user_revenue_opportunities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revenue opportunities"
  ON public.user_revenue_opportunities
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revenue opportunities"
  ON public.user_revenue_opportunities
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create ikigai_designs table for user-designed Ikigai
CREATE TABLE IF NOT EXISTS public.ikigai_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  love_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  good_at_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  world_needs_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  paid_for_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_ikigai_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for ikigai_designs
ALTER TABLE public.ikigai_designs ENABLE ROW LEVEL SECURITY;

-- Policies for ikigai_designs
CREATE POLICY "Users can view their own ikigai designs"
  ON public.ikigai_designs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ikigai designs"
  ON public.ikigai_designs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ikigai designs"
  ON public.ikigai_designs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ikigai designs"
  ON public.ikigai_designs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id 
  ON public.user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_created_at 
  ON public.user_skills (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_social_needs_user_id 
  ON public.user_social_needs (user_id);

CREATE INDEX IF NOT EXISTS idx_user_revenue_opportunities_user_id 
  ON public.user_revenue_opportunities (user_id);

CREATE INDEX IF NOT EXISTS idx_ikigai_designs_user_id 
  ON public.ikigai_designs (user_id);
CREATE INDEX IF NOT EXISTS idx_ikigai_designs_created_at 
  ON public.ikigai_designs (created_at DESC);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_ikigai_designs_updated_at
  BEFORE UPDATE ON public.ikigai_designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- WHY ANALYSIS TO IKIGAI INTEGRATION FUNCTIONS
-- This connects the "happy" categorized jobs to Ikigai LOVE section
-- ============================================================================

-- Create function to automatically extract LOVE elements from WHY analysis
CREATE OR REPLACE FUNCTION public.extract_love_from_why_analysis(input_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  love_elements jsonb := '[]'::jsonb;
  happy_jobs_text text;
  extracted_patterns jsonb;
BEGIN
  -- Extract job names and reasons from happy categorized jobs
  SELECT jsonb_agg(
    jsonb_build_object(
      'job_name', job_name,
      'definition', definition,
      'reason', reason,
      'first_memory', first_memory
    )
  ) INTO extracted_patterns
  FROM job_entries je
  JOIN brainstorm_sessions bs ON je.session_id = bs.id
  WHERE bs.user_id = input_user_id 
    AND je.category = 'happy'
    AND je.reason IS NOT NULL
    AND bs.status = 'completed';

  -- If we have happy jobs, analyze patterns
  IF extracted_patterns IS NOT NULL AND jsonb_array_length(extracted_patterns) > 0 THEN
    -- Extract common keywords from reasons and definitions
    -- This is a simplified version - in a real implementation, you'd use AI/NLP
    WITH keywords AS (
      SELECT unnest(
        string_to_array(
          regexp_replace(
            lower(concat_ws(' ', 
              job_data->>'reason',
              job_data->>'definition'
            )),
            '[^a-zA-Z가-힣\s]', ' ', 'g'
          ),
          ' '
        )
      ) AS keyword
      FROM jsonb_array_elements(extracted_patterns) AS job_data
    ),
    keyword_counts AS (
      SELECT keyword, COUNT(*) as frequency
      FROM keywords
      WHERE length(trim(keyword)) > 1
      GROUP BY keyword
      HAVING COUNT(*) >= 2  -- Appear in at least 2 jobs
      ORDER BY frequency DESC
      LIMIT 10
    )
    SELECT jsonb_agg(keyword ORDER BY frequency DESC)
    INTO love_elements
    FROM keyword_counts;
    
    -- Add some common patterns if we found keywords
    IF love_elements IS NOT NULL AND jsonb_array_length(love_elements) > 0 THEN
      -- Add common WHY patterns based on job categories
      love_elements := love_elements || jsonb_build_array(
        '창의적 문제 해결',
        '사람들과 소통',
        '지식 공유',
        '협력적 작업',
        '새로운 기술 탐구'
      );
    END IF;
  END IF;

  -- Fallback to default patterns if no data found
  IF love_elements IS NULL OR jsonb_array_length(love_elements) = 0 THEN
    love_elements := jsonb_build_array(
      '창의적 문제 해결',
      '사람들과 소통', 
      '지식 공유',
      '새로운 기술 탐구',
      '협력적 작업'
    );
  END IF;

  RETURN love_elements;
END;
$$;

-- Create function to auto-populate LOVE section in ikigai_designs
CREATE OR REPLACE FUNCTION public.sync_why_to_ikigai_love(input_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  love_data jsonb;
  existing_design_id uuid;
BEGIN
  -- Extract love elements from WHY analysis
  SELECT extract_love_from_why_analysis(input_user_id) INTO love_data;
  
  -- Check if user already has an ikigai design
  SELECT id INTO existing_design_id
  FROM ikigai_designs
  WHERE user_id = input_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF existing_design_id IS NOT NULL THEN
    -- Update existing design with new love elements
    UPDATE ikigai_designs
    SET 
      love_elements = love_data,
      updated_at = now()
    WHERE id = existing_design_id;
  ELSE
    -- Create new design with love elements
    INSERT INTO ikigai_designs (
      user_id,
      love_elements,
      good_at_elements,
      world_needs_elements,
      paid_for_elements
    ) VALUES (
      input_user_id,
      love_data,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb
    );
  END IF;
END;
$$;

-- Create trigger to auto-sync when WHY analysis is completed
CREATE OR REPLACE FUNCTION public.trigger_sync_why_to_ikigai()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when session moves to completed status
  IF OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.user_id IS NOT NULL THEN
    -- Sync WHY results to Ikigai LOVE section
    PERFORM sync_why_to_ikigai_love(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on brainstorm_sessions
CREATE TRIGGER trigger_brainstorm_session_completed
  AFTER UPDATE ON public.brainstorm_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.trigger_sync_why_to_ikigai();

-- Create function to get integrated Ikigai data for frontend
CREATE OR REPLACE FUNCTION public.get_user_ikigai_data(input_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  design_data record;
  skills_data jsonb;
  social_needs_data jsonb;
  revenue_data jsonb;
BEGIN
  -- Get latest ikigai design
  SELECT * INTO design_data
  FROM ikigai_designs
  WHERE user_id = input_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get skills with level >= 3 (good at)
  SELECT jsonb_agg(skill_name ORDER BY skill_level DESC) INTO skills_data
  FROM user_skills
  WHERE user_id = input_user_id AND skill_level >= 3;
  
  -- Get selected social needs
  SELECT jsonb_agg(need_text ORDER BY created_at) INTO social_needs_data
  FROM user_social_needs
  WHERE user_id = input_user_id;
  
  -- Get revenue opportunities
  SELECT jsonb_agg(opportunity_text ORDER BY created_at) INTO revenue_data
  FROM user_revenue_opportunities
  WHERE user_id = input_user_id;
  
  -- Build result
  result := jsonb_build_object(
    'love_elements', COALESCE(design_data.love_elements, '[]'::jsonb),
    'good_at_elements', COALESCE(skills_data, '[]'::jsonb),
    'world_needs_elements', COALESCE(social_needs_data, '[]'::jsonb),
    'paid_for_elements', COALESCE(revenue_data, '[]'::jsonb),
    'final_ikigai_text', design_data.final_ikigai_text,
    'has_design', design_data.id IS NOT NULL,
    'last_updated', design_data.updated_at
  );
  
  RETURN result;
END;
$$;