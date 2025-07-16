import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Zap, 
  LogOut, 
  Search, 
  Heart, 
  Share2, 
  MapPin, 
  Ruler, 
  Target,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RouteWithProfile {
  id: string;
  name: string;
  description: string | null;
  distance: number | null;
  difficulty_level: string | null;
  is_public: boolean;
  likes_count: number;
  times_completed: number;
  created_at: string;
  tags: string[];
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  user_interaction?: {
    liked: boolean;
    favorited: boolean;
  };
}

const ExploreTracks = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, [sortBy, difficultyFilter]);

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('routes')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('is_public', true);

      // Apply difficulty filter
      if (difficultyFilter !== "all") {
        query = query.eq('difficulty_level', difficultyFilter);
      }

      // Apply sorting
      switch (sortBy) {
        case "popular":
          query = query.order('likes_count', { ascending: false });
          break;
        case "distance":
          query = query.order('distance', { ascending: false });
          break;
        case "completed":
          query = query.order('times_completed', { ascending: false });
          break;
        case "recent":
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // If user is logged in, get their interactions with these routes
      if (user && data) {
        const routeIds = data.map(route => route.id);
        const { data: interactions } = await supabase
          .from('user_route_interactions')
          .select('route_id, liked, favorited')
          .eq('user_id', user.id)
          .in('route_id', routeIds);

        const interactionMap = new Map(
          interactions?.map(i => [i.route_id, { liked: i.liked, favorited: i.favorited }]) || []
        );

        const routesWithInteractions = data.map(route => ({
          ...route,
          user_interaction: interactionMap.get(route.id)
        })) as unknown as RouteWithProfile[];

        setRoutes(routesWithInteractions);
      } else {
        setRoutes((data as unknown as RouteWithProfile[]) || []);
      }
    } catch (error: any) {
      console.error('Error loading routes:', error);
      toast({
        title: "Error Loading Routes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeRoute = async (routeId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like routes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const route = routes.find(r => r.id === routeId);
      const currentlyLiked = route?.user_interaction?.liked || false;

      const { error } = await supabase
        .from('user_route_interactions')
        .upsert({
          user_id: user.id,
          route_id: routeId,
          liked: !currentlyLiked,
          favorited: route?.user_interaction?.favorited || false
        }, {
          onConflict: 'user_id,route_id'
        });

      if (error) throw error;

      // Update local state
      setRoutes(prev => prev.map(route => {
        if (route.id === routeId) {
          return {
            ...route,
            likes_count: currentlyLiked ? route.likes_count - 1 : route.likes_count + 1,
            user_interaction: {
              ...route.user_interaction,
              liked: !currentlyLiked
            }
          };
        }
        return route;
      }));

      toast({
        title: currentlyLiked ? "Route Unliked" : "Route Liked",
        description: currentlyLiked ? "Removed from your liked routes." : "Added to your liked routes.",
      });
    } catch (error: any) {
      console.error('Error liking route:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShareRoute = async (route: RouteWithProfile) => {
    try {
      await navigator.share({
        title: route.name,
        text: route.description || `Check out this racing route: ${route.name}`,
        url: window.location.href + `?route=${route.id}`
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href + `?route=${route.id}`);
      toast({
        title: "Link Copied",
        description: "Route link copied to clipboard!",
      });
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <h1 className="text-3xl font-bold mb-2">Explore Tracks</h1>
          <p className="text-muted-foreground">
            Discover amazing racing routes created by the community
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes, descriptions, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Liked</SelectItem>
                  <SelectItem value="completed">Most Completed</SelectItem>
                  <SelectItem value="distance">Longest Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Routes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No routes found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or create the first route!
              </p>
              <Link to="/create-track">
                <Button>Create New Route</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRoutes.map((route) => (
              <Card key={route.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{route.name}</h3>
                        {route.difficulty_level && (
                          <Badge 
                            variant={
                              route.difficulty_level === 'easy' ? 'secondary' :
                              route.difficulty_level === 'medium' ? 'default' : 'destructive'
                            }
                          >
                            {route.difficulty_level}
                          </Badge>
                        )}
                      </div>
                      
                      {route.description && (
                        <p className="text-muted-foreground mb-3">{route.description}</p>
                      )}
                      
                      {/* Creator Info */}
                      <div className="flex items-center gap-2 mb-4">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={route.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-gradient-racing text-primary-foreground">
                            {(route.profiles?.display_name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          by {route.profiles?.display_name || "Anonymous"}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(route.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                        {route.distance && (
                          <div className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" />
                            {route.distance}km
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Heart className={`w-4 h-4 ${route.user_interaction?.liked ? 'fill-red-500 text-red-500' : ''}`} />
                          {route.likes_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {route.times_completed} completions
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {route.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {route.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant={route.user_interaction?.liked ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleLikeRoute(route.id)}
                        className="hover-scale"
                      >
                        <Heart className={`w-4 h-4 ${route.user_interaction?.liked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShareRoute(route)}
                        className="hover-scale"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="racing" size="sm" className="hover-scale">
                        Race It
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreTracks;