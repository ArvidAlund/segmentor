-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(user_id),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE 
    WHEN role = 'admin' THEN 1
    WHEN role = 'moderator' THEN 2
    WHEN role = 'user' THEN 3
  END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default admin role (you'll need to update this with your user ID)
-- This creates an admin user - replace with actual user ID after first signup
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin');

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

-- RLS for admin analytics
ALTER VIEW public.admin_analytics OWNER TO postgres;
CREATE POLICY "Admins can view analytics"
ON public.admin_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));