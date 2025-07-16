import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Zap, 
  LogOut, 
  Search, 
  Users, 
  Calendar, 
  MessageCircle, 
  Plus,
  UserPlus,
  Crown,
  Globe,
  Lock,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  creator_id: string;
  is_public: boolean;
  member_count: number;
  route_count: number;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  user_membership?: {
    role: string;
  };
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_type: string;
  current_participants: number;
  max_participants: number | null;
  community_id: string | null;
  communities?: {
    name: string;
  };
}

const Community = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCommunities();
      loadUpcomingEvents();
    }
  }, [user]);

  const loadCommunities = async () => {
    try {
      let query = supabase
        .from('communities')
        .select(`
          *,
          profiles:creator_id (
            display_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('member_count', { ascending: false })
        .limit(20);

      const { data, error } = await query;
      if (error) throw error;

      // If user is logged in, get their membership status
      if (user && data) {
        const communityIds = data.map(community => community.id);
        const { data: memberships } = await supabase
          .from('community_members')
          .select('community_id, role')
          .eq('user_id', user.id)
          .in('community_id', communityIds);

        const membershipMap = new Map(
          memberships?.map(m => [m.community_id, { role: m.role }]) || []
        );

        const communitiesWithMembership = data.map(community => ({
          ...community,
          user_membership: membershipMap.get(community.id)
        })) as unknown as Community[];

        setCommunities(communitiesWithMembership);
      } else {
        setCommunities((data as unknown as Community[]) || []);
      }
    } catch (error: any) {
      console.error('Error loading communities:', error);
      toast({
        title: "Error Loading Communities",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          communities (
            name
          )
        `)
        .eq('is_public', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setUpcomingEvents((data as Event[]) || []);
    } catch (error: any) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join communities.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Joined Community",
        description: "You have successfully joined the community!",
      });

      loadCommunities();
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error Joining Community",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'race': return 'bg-primary/10 text-primary border-primary/30';
      case 'group_run': return 'bg-accent/10 text-accent border-accent/30';
      case 'challenge': return 'bg-racing-warning/10 text-racing-warning border-racing-warning/30';
      case 'training': return 'bg-muted/10 text-muted-foreground border-muted/30';
      default: return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-racing rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Segmentor</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="racing" size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Racing Community</h1>
          <p className="text-muted-foreground">
            Connect with fellow racers, join communities, and participate in events
          </p>
        </div>

        <Tabs defaultValue="communities" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="communities" className="mt-6">
            {/* Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Community
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Communities Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map((community) => (
                <Card key={community.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={community.image_url || undefined} />
                          <AvatarFallback className="bg-gradient-racing text-primary-foreground">
                            {community.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{community.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {community.is_public ? (
                              <Globe className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            {community.is_public ? "Public" : "Private"}
                          </div>
                        </div>
                      </div>
                      {community.user_membership && (
                        <Badge variant="secondary" className="text-xs">
                          {community.user_membership.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                          {community.user_membership.role}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {community.description && (
                      <p className="text-muted-foreground mb-4 text-sm">
                        {community.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {community.member_count} members
                      </div>
                      <div className="text-xs">
                        by {community.profiles?.display_name || "Anonymous"}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {community.user_membership ? (
                        <>
                          <Button variant="outline" size="sm" className="flex-1">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => handleJoinCommunity(community.id)}
                          size="sm" 
                          className="flex-1 hover-scale"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCommunities.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No communities found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or create a new community!
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Community
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="grid gap-4">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                    <p className="text-muted-foreground">
                      Check back later for exciting racing events!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow animate-fade-in">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{event.name}</h3>
                            <Badge variant="outline" className={getEventTypeColor(event.event_type)}>
                              {event.event_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-muted-foreground mb-3">{event.description}</p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {event.current_participants}
                              {event.max_participants && `/${event.max_participants}`} participants
                            </div>
                            {event.communities && (
                              <div className="text-xs">
                                in {event.communities.name}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button size="sm" className="hover-scale">
                          Join Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No followers yet</h3>
                <p className="text-muted-foreground">
                  Start following other racers to see their activity here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;