-- Create IKIGAI assessments table with RLS
CREATE TABLE IF NOT EXISTS public.ikigai_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  love_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  good_at_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  world_needs_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  paid_for_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ikigai_intersections jsonb NOT NULL DEFAULT '{}'::jsonb,
  final_ikigai text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ikigai_assessments ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own assessments
CREATE POLICY "Users can view their own IKIGAI assessments"
ON public.ikigai_assessments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own IKIGAI assessments"
ON public.ikigai_assessments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IKIGAI assessments"
ON public.ikigai_assessments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IKIGAI assessments"
ON public.ikigai_assessments
FOR DELETE
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ikigai_assessments_user_id
  ON public.ikigai_assessments (user_id);

CREATE INDEX IF NOT EXISTS idx_ikigai_assessments_created_at
  ON public.ikigai_assessments (created_at DESC);
