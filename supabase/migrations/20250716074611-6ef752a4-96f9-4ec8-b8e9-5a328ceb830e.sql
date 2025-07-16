-- Create user_follows table for social following system
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create policies for user_follows
CREATE POLICY "Users can view follows for public profiles" 
ON public.user_follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own follows" 
ON public.user_follows 
FOR ALL 
USING (auth.uid() = follower_id)
WITH CHECK (auth.uid() = follower_id);

-- Create communities table for racing groups
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  creator_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  route_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Create policies for communities
CREATE POLICY "Public communities are viewable by everyone" 
ON public.communities 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Community members can view private communities" 
ON public.communities 
FOR SELECT 
USING (
  NOT is_public AND EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = communities.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community creators can update their communities" 
ON public.communities 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Create community_members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS on community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Create policies for community_members
CREATE POLICY "Community members can view membership" 
ON public.community_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.communities 
    WHERE communities.id = community_members.community_id 
    AND (
      communities.is_public = true OR 
      EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = communities.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can join/leave communities" 
ON public.community_members 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create events table for racing events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  event_type TEXT DEFAULT 'race' CHECK (event_type IN ('race', 'group_run', 'challenge', 'training')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Public events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Community events are viewable by members" 
ON public.events 
FOR SELECT 
USING (
  NOT is_public AND community_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = events.community_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Event creators can update their events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Create event_participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registration_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_time INTEGER, -- in seconds, null if not completed
  final_position INTEGER,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'completed', 'cancelled', 'no_show')),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for event_participants
CREATE POLICY "Event participants can view registrations" 
ON public.event_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_participants.event_id 
    AND (
      events.is_public = true OR 
      (events.community_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = events.community_id AND user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Users can manage their own event participation" 
ON public.event_participants 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create community_chat table for real-time messaging
CREATE TABLE public.community_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'route_share', 'event_announcement')),
  reply_to_id UUID REFERENCES public.community_chat(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on community_chat
ALTER TABLE public.community_chat ENABLE ROW LEVEL SECURITY;

-- Create policies for community_chat
CREATE POLICY "Community members can view chat messages" 
ON public.community_chat 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_chat.community_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Community members can send messages" 
ON public.community_chat 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_chat.community_id AND user_id = auth.uid()
  )
);

-- Add triggers for updating counts
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update community stats
CREATE OR REPLACE FUNCTION public.update_community_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'community_members' THEN
    UPDATE public.communities 
    SET member_count = (
      SELECT COUNT(*) FROM public.community_members 
      WHERE community_id = NEW.community_id
    )
    WHERE id = NEW.community_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for community stats
CREATE TRIGGER update_community_member_stats
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_stats();

-- Create function to update event stats
CREATE OR REPLACE FUNCTION public.update_event_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events 
  SET current_participants = (
    SELECT COUNT(*) FROM public.event_participants 
    WHERE event_id = NEW.event_id AND status = 'registered'
  )
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event stats
CREATE TRIGGER update_event_participant_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_stats();

-- Create indexes for better performance
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);
CREATE INDEX idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX idx_events_community_id ON public.events(community_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_community_chat_community_id ON public.community_chat(community_id);
CREATE INDEX idx_community_chat_created_at ON public.community_chat(created_at);