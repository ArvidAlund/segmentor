-- Create view for admin analytics
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.routes WHERE is_public = true) as total_public_routes,
  (SELECT COUNT(*) FROM public.route_completions) as total_race_completions,
  (SELECT COUNT(*) FROM public.challenges) as total_challenges,
  (SELECT COUNT(*) FROM public.communities) as total_communities,
  (SELECT AVG(completion_time) FROM public.route_completions) as avg_completion_time,
  (SELECT COUNT(*) FROM public.routes WHERE created_at >= NOW() - INTERVAL '7 days') as routes_this_week,
  (SELECT COUNT(*) FROM public.route_completions WHERE completion_date >= NOW() - INTERVAL '7 days') as races_this_week;

-- Create a function to get admin analytics (with proper security)
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  total_users BIGINT,
  total_public_routes BIGINT,
  total_race_completions BIGINT,
  total_challenges BIGINT,
  total_communities BIGINT,
  avg_completion_time NUMERIC,
  routes_this_week BIGINT,
  races_this_week BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM public.admin_analytics
  WHERE public.has_role(auth.uid(), 'admin'::app_role);
$$;