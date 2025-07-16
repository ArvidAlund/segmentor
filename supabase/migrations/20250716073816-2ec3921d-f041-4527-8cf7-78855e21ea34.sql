-- Add sharing and social features to routes table
ALTER TABLE public.routes 
ADD COLUMN IF NOT EXISTS shared_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_completed INTEGER DEFAULT 0;

-- Create user_route_interactions table for likes, favorites, etc.
CREATE TABLE public.user_route_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT false,
  favorited BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  best_time INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, route_id)
);

-- Enable RLS on user_route_interactions
ALTER TABLE public.user_route_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_route_interactions
CREATE POLICY "Users can view all interactions for public routes" 
ON public.user_route_interactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.routes 
    WHERE routes.id = user_route_interactions.route_id 
    AND (routes.is_public = true OR routes.user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage their own interactions" 
ON public.user_route_interactions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create route_completions table for tracking race times
CREATE TABLE public.route_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  completion_time INTEGER NOT NULL, -- in seconds
  completion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  gps_data JSONB, -- store GPS tracking data if needed
  average_speed DECIMAL,
  max_speed DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on route_completions
ALTER TABLE public.route_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for route_completions
CREATE POLICY "Users can view completions for public routes" 
ON public.route_completions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.routes 
    WHERE routes.id = route_completions.route_id 
    AND (routes.is_public = true OR routes.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create their own completions" 
ON public.route_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own completions" 
ON public.route_completions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to update route statistics
CREATE OR REPLACE FUNCTION public.update_route_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update route completion count and interaction counts
  IF TG_TABLE_NAME = 'route_completions' THEN
    UPDATE public.routes 
    SET times_completed = (
      SELECT COUNT(*) FROM public.route_completions 
      WHERE route_id = NEW.route_id
    )
    WHERE id = NEW.route_id;
  END IF;
  
  IF TG_TABLE_NAME = 'user_route_interactions' THEN
    UPDATE public.routes 
    SET likes_count = (
      SELECT COUNT(*) FROM public.user_route_interactions 
      WHERE route_id = NEW.route_id AND liked = true
    )
    WHERE id = NEW.route_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stats updates
CREATE TRIGGER update_route_completion_stats
  AFTER INSERT ON public.route_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_route_stats();

CREATE TRIGGER update_route_interaction_stats
  AFTER INSERT OR UPDATE ON public.user_route_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_route_stats();

-- Add triggers for timestamps
CREATE TRIGGER update_user_route_interactions_updated_at
  BEFORE UPDATE ON public.user_route_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_route_interactions_user_id ON public.user_route_interactions(user_id);
CREATE INDEX idx_user_route_interactions_route_id ON public.user_route_interactions(route_id);
CREATE INDEX idx_route_completions_user_id ON public.route_completions(user_id);
CREATE INDEX idx_route_completions_route_id ON public.route_completions(route_id);
CREATE INDEX idx_route_completions_completion_time ON public.route_completions(completion_time);
CREATE INDEX idx_routes_public ON public.routes(is_public) WHERE is_public = true;