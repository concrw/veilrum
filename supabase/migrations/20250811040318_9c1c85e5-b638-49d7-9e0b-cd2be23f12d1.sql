-- Fix failed migration: re-create policies without IF NOT EXISTS

-- Authenticated users: brainstorm_sessions policies
DROP POLICY IF EXISTS "Users can view their own brainstorm_sessions" ON public.brainstorm_sessions;
DROP POLICY IF EXISTS "Users can modify their own brainstorm_sessions" ON public.brainstorm_sessions;
CREATE POLICY "Users can view their own brainstorm_sessions"
ON public.brainstorm_sessions
FOR SELECT
USING (user_id = auth.uid());
CREATE POLICY "Users can modify their own brainstorm_sessions"
ON public.brainstorm_sessions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Authenticated users: job_entries policies
DROP POLICY IF EXISTS "Users can view their own job_entries" ON public.job_entries;
DROP POLICY IF EXISTS "Users can modify their own job_entries" ON public.job_entries;
CREATE POLICY "Users can view their own job_entries"
ON public.job_entries
FOR SELECT
USING (user_id = auth.uid());
CREATE POLICY "Users can modify their own job_entries"
ON public.job_entries
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Anonymous users: allow working with rows with NULL user_id
DROP POLICY IF EXISTS "Anonymous can insert brainstorm_sessions without user" ON public.brainstorm_sessions;
DROP POLICY IF EXISTS "Anonymous can read/update/delete unowned brainstorm_sessions" ON public.brainstorm_sessions;
CREATE POLICY "Anonymous can insert brainstorm_sessions without user"
ON public.brainstorm_sessions
FOR INSERT
WITH CHECK (user_id IS NULL);
CREATE POLICY "Anonymous can read/update/delete unowned brainstorm_sessions"
ON public.brainstorm_sessions
FOR ALL
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Anonymous can insert job_entries without user" ON public.job_entries;
DROP POLICY IF EXISTS "Anonymous can read/update/delete unowned job_entries" ON public.job_entries;
CREATE POLICY "Anonymous can insert job_entries without user"
ON public.job_entries
FOR INSERT
WITH CHECK (user_id IS NULL);
CREATE POLICY "Anonymous can read/update/delete unowned job_entries"
ON public.job_entries
FOR ALL
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);
