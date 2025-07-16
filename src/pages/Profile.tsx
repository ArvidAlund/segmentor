import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Zap, 
  LogOut, 
  Edit, 
  Trophy, 
  MapPin, 
  Timer, 
  Ruler, 
  Target,
  Heart,
  Share2,
  Calendar,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RouteEditor from "@/components/RouteEditor";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_distance: number;
  total_routes: number;
  created_at: string;
}

interface UserRoute {
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
}

interface UserStats {
  totalRoutes: number;
  totalDistance: number;
  totalCompletions: number;
  bestTime: number | null;
  averageTime: number | null;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRoutes, setUserRoutes] = useState<UserRoute[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalRoutes: 0,
    totalDistance: 0,
    totalCompletions: 0,
    bestTime: null,
    averageTime: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: ""
  });
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load user profile and data
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserRoutes();
      loadUserStats();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setEditForm({
          display_name: data.display_name || "",
          bio: data.bio || ""
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error Loading Profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadUserRoutes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoutes(data || []);
    } catch (error: any) {
      console.error('Error loading user routes:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get completion stats
      const { data: completions, error: completionsError } = await supabase
        .from('route_completions')
        .select('completion_time')
        .eq('user_id', user.id);

      if (completionsError) throw completionsError;

      // Calculate stats
      const totalCompletions = completions?.length || 0;
      const bestTime = completions && completions.length > 0 
        ? Math.min(...completions.map(c => c.completion_time))
        : null;
      const averageTime = completions && completions.length > 0
        ? completions.reduce((sum, c) => sum + c.completion_time, 0) / completions.length
        : null;

      // Get route stats
      const totalRoutes = userRoutes.length;
      const totalDistance = userRoutes.reduce((sum, route) => sum + (route.distance || 0), 0);

      setUserStats({
        totalRoutes,
        totalDistance,
        totalCompletions,
        bestTime,
        averageTime
      });
    } catch (error: any) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: editForm.display_name || null,
          bio: editForm.bio || null,
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
      loadUserProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error Updating Profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
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
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-racing text-primary-foreground">
                  {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-3xl font-bold">
                    {profile?.display_name || "User Profile"}
                  </h1>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  {profile?.bio || "No bio yet. Tell others about yourself!"}
                </p>
                
                <div className="text-sm text-muted-foreground">
                  Joined {new Date(profile?.created_at || "").toLocaleDateString()}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <div className="grid gap-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Display Name</label>
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bio</label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats.totalRoutes}</div>
              <div className="text-sm text-muted-foreground">Routes Created</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Ruler className="w-8 h-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">{userStats.totalDistance.toFixed(1)}km</div>
              <div className="text-sm text-muted-foreground">Total Distance</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-racing-warning" />
              <div className="text-2xl font-bold">{userStats.totalCompletions}</div>
              <div className="text-sm text-muted-foreground">Races Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Timer className="w-8 h-8 mx-auto mb-2 text-racing-success" />
              <div className="text-2xl font-bold">
                {userStats.bestTime ? formatTime(userStats.bestTime) : "--:--"}
              </div>
              <div className="text-sm text-muted-foreground">Best Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="routes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routes">My Routes</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="mt-6">
            <div className="grid gap-4">
              {userRoutes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No routes yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start creating your first racing route!
                    </p>
                    <Link to="/create-track">
                      <Button>Create Your First Route</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                userRoutes.map((route) => (
                  <Card key={route.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{route.name}</h3>
                            {route.is_public && (
                              <Badge variant="secondary">Public</Badge>
                            )}
                            {route.difficulty_level && (
                              <Badge variant="outline">{route.difficulty_level}</Badge>
                            )}
                          </div>
                          
                          {route.description && (
                            <p className="text-muted-foreground mb-3">{route.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {route.distance && (
                              <div className="flex items-center gap-1">
                                <Ruler className="w-4 h-4" />
                                {route.distance}km
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {route.likes_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {route.times_completed} completions
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(route.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {route.tags.length > 0 && (
                            <div className="flex gap-1 mt-3">
                              {route.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingRouteId(route.id)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground">
                  Explore routes and mark your favorites to see them here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-muted-foreground">
                  Start racing on routes to see your activity here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Route Editor Modal */}
      {editingRouteId && (
        <RouteEditor
          routeId={editingRouteId}
          onClose={() => setEditingRouteId(null)}
          onSave={() => {
            loadUserRoutes();
            loadUserStats();
          }}
        />
      )}
    </div>
  );
};

export default Profile;