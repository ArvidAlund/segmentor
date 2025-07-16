-- Create challenges table for route-based challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT DEFAULT 'time_trial' CHECK (challenge_type IN ('time_trial', 'distance', 'completion', 'streak')),
  target_value INTEGER, -- target time in seconds, distance in meters, or completion count
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'extreme')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  reward_points INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table for badge system
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- icon name or emoji
  achievement_type TEXT DEFAULT 'route' CHECK (achievement_type IN ('route', 'distance', 'time', 'streak', 'social', 'milestone')),
  criteria JSONB NOT NULL, -- flexible criteria definition
  points INTEGER DEFAULT 50,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table for tracking earned achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress JSONB, -- track progress towards achievement
  UNIQUE(user_id, achievement_id)
);

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'withdrawn')),
  UNIQUE(challenge_id, user_id)
);

-- Create challenge_completions table
CREATE TABLE public.challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completion_value INTEGER NOT NULL, -- time in seconds, distance in meters, etc.
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ranking_position INTEGER,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenges
CREATE POLICY "Public challenges are viewable by everyone" 
ON public.challenges 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view challenges they participate in" 
ON public.challenges 
FOR SELECT 
USING (
  NOT is_public AND EXISTS (
    SELECT 1 FROM public.challenge_participants 
    WHERE challenge_id = challenges.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Challenge creators can update their challenges" 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- RLS policies for achievements
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements 
FOR SELECT 
USING (is_active = true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view all user achievements" 
ON public.user_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own achievements" 
ON public.user_achievements 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for challenge_participants
CREATE POLICY "Users can view challenge participants for public challenges" 
ON public.challenge_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE challenges.id = challenge_participants.challenge_id 
    AND (
      challenges.is_public = true OR 
      EXISTS (
        SELECT 1 FROM public.challenge_participants cp 
        WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can manage their own challenge participation" 
ON public.challenge_participants 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for challenge_completions
CREATE POLICY "Users can view challenge completions for accessible challenges" 
ON public.challenge_completions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE challenges.id = challenge_completions.challenge_id 
    AND (
      challenges.is_public = true OR 
      EXISTS (
        SELECT 1 FROM public.challenge_participants cp 
        WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create their own challenge completions" 
ON public.challenge_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for timestamp updates
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update challenge participant counts
CREATE OR REPLACE FUNCTION public.update_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.challenges 
  SET current_participants = (
    SELECT COUNT(*) FROM public.challenge_participants 
    WHERE challenge_id = COALESCE(NEW.challenge_id, OLD.challenge_id) AND status = 'active'
  )
  WHERE id = COALESCE(NEW.challenge_id, OLD.challenge_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for challenge stats
CREATE TRIGGER update_challenge_participant_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_challenge_stats();

-- Create indexes for better performance
CREATE INDEX idx_challenges_route_id ON public.challenges(route_id);
CREATE INDEX idx_challenges_creator_id ON public.challenges(creator_id);
CREATE INDEX idx_challenges_dates ON public.challenges(start_date, end_date);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX idx_challenge_completions_challenge_id ON public.challenge_completions(challenge_id);
CREATE INDEX idx_challenge_completions_ranking ON public.challenge_completions(challenge_id, ranking_position);

-- Insert some sample achievements
INSERT INTO public.achievements (name, description, icon, achievement_type, criteria, points, rarity) VALUES
('First Steps', 'Complete your first route', '🎯', 'route', '{"routes_completed": 1}', 50, 'common'),
('Speed Demon', 'Complete a route in under 30 minutes', '⚡', 'time', '{"max_completion_time": 1800}', 100, 'rare'),
('Distance Master', 'Complete a route longer than 10km', '📏', 'distance', '{"min_distance": 10000}', 150, 'rare'),
('Streak Runner', 'Complete routes on 7 consecutive days', '🔥', 'streak', '{"consecutive_days": 7}', 200, 'epic'),
('Century Club', 'Complete 100 routes', '💯', 'milestone', '{"routes_completed": 100}', 500, 'legendary'),
('Social Butterfly', 'Join 5 different communities', '🦋', 'social', '{"communities_joined": 5}', 100, 'rare'),
('Route Creator', 'Create your first public route', '🗺️', 'route', '{"routes_created": 1}', 75, 'common'),
('Marathon Champion', 'Complete a route longer than 42km', '🏃', 'distance', '{"min_distance": 42000}', 300, 'epic');