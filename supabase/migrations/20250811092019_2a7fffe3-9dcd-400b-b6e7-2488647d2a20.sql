-- Harden function search_path for security
CREATE OR REPLACE FUNCTION public.recalc_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.community_groups cg
  SET member_count = (
    SELECT COUNT(*) FROM public.group_members gm
    WHERE gm.group_id = COALESCE(NEW.group_id, OLD.group_id)
  )
  WHERE cg.id = COALESCE(NEW.group_id, OLD.group_id);
  RETURN NULL;
END;
$$;