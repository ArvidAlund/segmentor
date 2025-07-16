-- Create remaining tables for events and chat

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

-- Add remaining triggers and functions
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
      WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
    )
    WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create function to update event stats
CREATE OR REPLACE FUNCTION public.update_event_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events 
  SET current_participants = (
    SELECT COUNT(*) FROM public.event_participants 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) AND status = 'registered'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for stats
CREATE TRIGGER update_community_member_stats
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_stats();

CREATE TRIGGER update_event_participant_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_stats();

-- Create remaining indexes
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_community_chat_community_id ON public.community_chat(community_id);
CREATE INDEX idx_community_chat_created_at ON public.community_chat(created_at);