-- Analytics and tracking tables for admin dashboard

-- User activity tracking
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'logout', 'page_view', 'why_analysis_start', 'why_analysis_complete',
    'ikigai_start', 'ikigai_complete', 'brand_start', 'brand_complete',
    'persona_detected', 'match_request', 'message_sent', 'group_joined'
  )),
  activity_data JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversion funnel tracking
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL CHECK (event_name IN (
    'signup', 'onboarding_complete', 'why_complete', 'ikigai_complete',
    'brand_complete', 'first_match', 'upgrade_clicked', 'subscribed'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A/B test experiments
CREATE TABLE IF NOT EXISTS public.ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A/B test assignments
CREATE TABLE IF NOT EXISTS public.ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.ab_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, user_id)
);

-- A/B test results
CREATE TABLE IF NOT EXISTS public.ab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.ab_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only)
CREATE POLICY "Admin can view all activities"
  ON public.user_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert their own activities"
  ON public.user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all conversions"
  ON public.conversion_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert their own conversions"
  ON public.conversion_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage experiments"
  ON public.ab_experiments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view active experiments"
  ON public.ab_experiments
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admin can view all assignments"
  ON public.ab_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view their own assignments"
  ON public.ab_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create assignments"
  ON public.ab_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can view all results"
  ON public.ab_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert their own results"
  ON public.ab_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_activities_user_time ON public.user_activities(user_id, created_at DESC);
CREATE INDEX idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);

CREATE INDEX idx_conversion_events_user ON public.conversion_events(user_id);
CREATE INDEX idx_conversion_events_name ON public.conversion_events(event_name);
CREATE INDEX idx_conversion_events_created_at ON public.conversion_events(created_at DESC);

CREATE INDEX idx_ab_experiments_status ON public.ab_experiments(status);
CREATE INDEX idx_ab_assignments_experiment ON public.ab_assignments(experiment_id);
CREATE INDEX idx_ab_assignments_user ON public.ab_assignments(user_id);
CREATE INDEX idx_ab_results_experiment_variant ON public.ab_results(experiment_id, variant);

-- Function to get conversion funnel stats
CREATE OR REPLACE FUNCTION get_conversion_funnel_stats()
RETURNS TABLE (
  event_name TEXT,
  user_count BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH total_users AS (
    SELECT COUNT(DISTINCT user_id) as total FROM public.conversion_events WHERE event_name = 'signup'
  ),
  event_counts AS (
    SELECT
      ce.event_name,
      COUNT(DISTINCT ce.user_id) as users
    FROM public.conversion_events ce
    GROUP BY ce.event_name
  )
  SELECT
    ec.event_name,
    ec.users,
    ROUND((ec.users::NUMERIC / NULLIF(tu.total, 0)) * 100, 2) as conversion_rate
  FROM event_counts ec
  CROSS JOIN total_users tu
  ORDER BY
    CASE ec.event_name
      WHEN 'signup' THEN 1
      WHEN 'onboarding_complete' THEN 2
      WHEN 'why_complete' THEN 3
      WHEN 'ikigai_complete' THEN 4
      WHEN 'brand_complete' THEN 5
      WHEN 'first_match' THEN 6
      WHEN 'upgrade_clicked' THEN 7
      WHEN 'subscribed' THEN 8
      ELSE 99
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily active users
CREATE OR REPLACE FUNCTION get_daily_active_users(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ua.created_at) as date,
    COUNT(DISTINCT ua.user_id) as active_users
  FROM public.user_activities ua
  WHERE ua.created_at >= CURRENT_DATE - days_back * INTERVAL '1 day'
  GROUP BY DATE(ua.created_at)
  ORDER BY DATE(ua.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_activities IS 'Tracks all user activities for analytics';
COMMENT ON TABLE public.conversion_events IS 'Tracks conversion funnel events';
COMMENT ON TABLE public.ab_experiments IS 'A/B testing experiments configuration';
COMMENT ON TABLE public.ab_assignments IS 'User assignments to A/B test variants';
COMMENT ON TABLE public.ab_results IS 'A/B test metric results';
