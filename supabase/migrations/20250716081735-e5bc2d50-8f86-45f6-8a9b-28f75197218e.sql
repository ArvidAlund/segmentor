-- Create a function to get admin analytics with proper security
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_public_routes', (SELECT COUNT(*) FROM public.routes WHERE is_public = true),
    'total_race_completions', (SELECT COUNT(*) FROM public.route_completions),
    'total_challenges', (SELECT COUNT(*) FROM public.challenges),
    'total_communities', (SELECT COUNT(*) FROM public.communities),
    'avg_completion_time', (SELECT AVG(completion_time) FROM public.route_completions),
    'routes_this_week', (SELECT COUNT(*) FROM public.routes WHERE created_at >= NOW() - INTERVAL '7 days'),
    'races_this_week', (SELECT COUNT(*) FROM public.route_completions WHERE completion_date >= NOW() - INTERVAL '7 days'),
    'top_routes', (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'name', r.name,
          'completions', r.times_completed,
          'likes', r.likes_count,
          'creator', p.display_name
        )
      )
      FROM (
        SELECT * FROM public.routes 
        WHERE is_public = true 
        ORDER BY times_completed DESC 
        LIMIT 5
      ) r
      LEFT JOIN public.profiles p ON p.user_id = r.user_id
    ),
    'recent_users', (
      SELECT json_agg(
        json_build_object(
          'id', user_id,
          'display_name', display_name,
          'created_at', created_at,
          'total_routes', total_routes
        )
      )
      FROM (
        SELECT * FROM public.profiles 
        ORDER BY created_at DESC 
        LIMIT 10
      ) p
    )
  ) INTO result;

  RETURN result;
END;
$$;