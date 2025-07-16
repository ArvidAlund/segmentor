import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Zap, 
  Users, 
  MapPin, 
  Target,
  Trophy,
  TrendingUp,
  Activity,
  Crown,
  Shield,
  AlertTriangle,
  Eye,
  UserX,
  Calendar,
  Plus,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateRoutes, CITY_PRESETS, type RouteGenerationParams } from "@/utils/routeGenerator";
import RouteGeneratorMap from "@/components/RouteGeneratorMap";

interface AdminAnalytics {
  total_users: number;
  total_public_routes: number;
  total_race_completions: number;
  total_challenges: number;
  total_communities: number;
  avg_completion_time: number;
  routes_this_week: number;
  races_this_week: number;
  top_routes: Array<{
    id: string;
    name: string;
    completions: number;
    likes: number;
    creator: string;
  }>;
  recent_users: Array<{
    id: string;
    display_name: string;
    created_at: string;
    total_routes: number;
  }>;
}

interface User {
  user_id: string;
  display_name: string | null;
  created_at: string;
  total_routes: number;
  total_distance: number;
  role?: string;
}

interface Route {
  id: string;
  name: string;
  description: string | null;
  distance: number | null;
  is_public: boolean;
  likes_count: number;
  times_completed: number;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const AdminPanel = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Route generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genParams, setGenParams] = useState<RouteGenerationParams>({
    count: 5,
    centerLat: 40.7128, // New York default
    centerLng: -74.0060,
    radiusKm: 10,
    minDistanceKm: 1,
    maxDistanceKm: 8
  });
  const [selectedCity, setSelectedCity] = useState<string>("New York");

  useEffect(() => {
    if (!loading && user) {
      checkAdminAccess();
    } else if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
      if (activeTab === "users") loadUsers();
      if (activeTab === "routes") loadRoutes();
    }
  }, [isAdmin, activeTab]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIsAdmin(true);
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Access Error",
        description: "Unable to verify admin access.",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_analytics');
      
      if (error) throw error;
      setAnalytics(data as unknown as AdminAnalytics);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          created_at,
          total_routes,
          total_distance
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users data.",
        variant: "destructive",
      });
    }
  };

  const loadRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          profiles:user_id (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRoutes(data as unknown as Route[] || []);
    } catch (error: any) {
      console.error('Error loading routes:', error);
      toast({
        title: "Error",
        description: "Failed to load routes data.",
        variant: "destructive",
      });
    }
  };

  const toggleRouteVisibility = async (routeId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('routes')
        .update({ is_public: !isPublic })
        .eq('id', routeId);

      if (error) throw error;

      setRoutes(prev => prev.map(route => 
        route.id === routeId ? { ...route, is_public: !isPublic } : route
      ));

      toast({
        title: "Route Updated",
        description: `Route ${!isPublic ? 'published' : 'hidden'} successfully.`,
      });
    } catch (error: any) {
      console.error('Error updating route:', error);
      toast({
        title: "Error",
        description: "Failed to update route visibility.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const cityCoords = CITY_PRESETS[city as keyof typeof CITY_PRESETS];
    if (cityCoords) {
      setGenParams(prev => ({
        ...prev,
        centerLat: cityCoords.lat,
        centerLng: cityCoords.lng
      }));
    }
  };

  const generateAutomaticRoutes = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const generatedRoutes = await generateRoutes(genParams);
      
      if (generatedRoutes.length === 0) {
        toast({
          title: "No Routes Generated",
          description: "Unable to generate routes in the selected area. Try a different location or larger radius.",
          variant: "destructive",
        });
        return;
      }
      
      // Insert routes into database with waypoints as JSON
      const routesWithUserId = generatedRoutes.map(route => ({
        ...route,
        user_id: user.id,
        waypoints: route.waypoints || null
      }));

      const { error } = await supabase
        .from('routes')
        .insert(routesWithUserId);

      if (error) throw error;

      toast({
        title: "Routes Generated Successfully",
        description: `Created ${generatedRoutes.length} new road-following racing routes.`,
      });

      // Refresh routes if we're on that tab
      if (activeTab === "routes") {
        await loadRoutes();
      }

    } catch (error: any) {
      console.error('Error generating routes:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate routes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
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
              <Badge variant="destructive" className="ml-2">
                <Crown className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Welcome, Admin
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage your racing platform
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="generator">Route Generator</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analytics && (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                          <p className="text-3xl font-bold">{analytics.total_users}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Public Routes</p>
                          <p className="text-3xl font-bold">{analytics.total_public_routes}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Race Completions</p>
                          <p className="text-3xl font-bold">{analytics.total_race_completions}</p>
                        </div>
                        <Target className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg. Race Time</p>
                          <p className="text-3xl font-bold">
                            {analytics.avg_completion_time ? formatTime(Math.round(analytics.avg_completion_time)) : 'N/A'}
                          </p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* This Week Stats */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        This Week's Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>New Routes Created</span>
                          <Badge variant="outline">{analytics.routes_this_week}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Races Completed</span>
                          <Badge variant="outline">{analytics.races_this_week}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Top Routes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.top_routes?.slice(0, 5).map((route, index) => (
                          <div key={route.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{index + 1}</Badge>
                              <div>
                                <p className="font-medium">{route.name}</p>
                                <p className="text-sm text-muted-foreground">by {route.creator || 'Anonymous'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{route.completions} runs</p>
                              <p className="text-xs text-muted-foreground">{route.likes} likes</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Recent Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.recent_users?.slice(0, 8).map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {(user.display_name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                              <p className="text-sm text-muted-foreground">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{user.total_routes} routes</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Routes</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {(user.display_name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.display_name || 'Anonymous'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{user.total_routes || 0}</TableCell>
                        <TableCell>{user.total_distance?.toFixed(1) || 0} km</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Route Management</CardTitle>
                    <CardDescription>Manage all platform routes</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("generator")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Routes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{route.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {route.distance?.toFixed(1)} km
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{route.profiles?.display_name || 'Anonymous'}</TableCell>
                        <TableCell>
                          <Badge variant={route.is_public ? "default" : "secondary"}>
                            {route.is_public ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{route.times_completed} runs</p>
                            <p>{route.likes_count} likes</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRouteVisibility(route.id, route.is_public)}
                            >
                              {route.is_public ? <UserX className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Automatic Route Generator
                </CardTitle>
                <CardDescription>
                  Generate racing routes automatically using AI-powered algorithms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Map Selection */}
                  <RouteGeneratorMap
                    center={{ lat: genParams.centerLat, lng: genParams.centerLng }}
                    radius={genParams.radiusKm}
                    onCenterChange={(center) => setGenParams(prev => ({
                      ...prev,
                      centerLat: center.lat,
                      centerLng: center.lng
                    }))}
                    onRadiusChange={(radius) => setGenParams(prev => ({
                      ...prev,
                      radiusKm: radius
                    }))}
                  />

                  {/* Generation Settings */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Generation Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="city-select">Quick Location Presets</Label>
                          <Select value={selectedCity} onValueChange={handleCityChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a city" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(CITY_PRESETS).map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="count">Number of Routes</Label>
                            <Input
                              id="count"
                              type="number"
                              min="1"
                              max="10"
                              value={genParams.count}
                              onChange={(e) => setGenParams(prev => ({
                                ...prev,
                                count: parseInt(e.target.value) || 1
                              }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="radius">Search Radius (km)</Label>
                            <Input
                              id="radius"
                              type="number"
                              min="1"
                              max="50"
                              value={genParams.radiusKm}
                              onChange={(e) => setGenParams(prev => ({
                                ...prev,
                                radiusKm: parseFloat(e.target.value) || 1
                              }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="min-distance">Min Distance (km)</Label>
                            <Input
                              id="min-distance"
                              type="number"
                              min="0.5"
                              max="20"
                              step="0.5"
                              value={genParams.minDistanceKm}
                              onChange={(e) => setGenParams(prev => ({
                                ...prev,
                                minDistanceKm: parseFloat(e.target.value) || 0.5
                              }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-distance">Max Distance (km)</Label>
                            <Input
                              id="max-distance"
                              type="number"
                              min="1"
                              max="50"
                              step="0.5"
                              value={genParams.maxDistanceKm}
                              onChange={(e) => setGenParams(prev => ({
                                ...prev,
                                maxDistanceKm: parseFloat(e.target.value) || 1
                              }))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Generation Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm space-y-1">
                              <p><strong>Location:</strong> {genParams.centerLat.toFixed(4)}, {genParams.centerLng.toFixed(4)}</p>
                              <p><strong>Routes to generate:</strong> {genParams.count}</p>
                              <p><strong>Search area:</strong> {genParams.radiusKm}km radius</p>
                              <p><strong>Distance range:</strong> {genParams.minDistanceKm}-{genParams.maxDistanceKm}km</p>
                            </div>
                          </div>

                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Road-Following Algorithm
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Follows actual roads and streets</li>
                              <li>• Snaps start/end points to nearest roads</li>
                              <li>• Uses Google Maps routing</li>
                              <li>• Real distance and time calculations</li>
                              <li>• Variety in route characteristics</li>
                              <li>• Avoids highways and tolls sometimes</li>
                            </ul>
                          </div>

                          <Button 
                            onClick={generateAutomaticRoutes}
                            disabled={isGenerating}
                            className="w-full flex items-center gap-2"
                            size="lg"
                          >
                            {isGenerating ? (
                              <>
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Generating Road Routes...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Road Routes
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Communities</span>
                      <Badge variant="outline">{analytics?.total_communities || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Challenges</span>
                      <Badge variant="outline">{analytics?.total_challenges || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Completion Time</span>
                      <Badge variant="outline">
                        {analytics?.avg_completion_time ? formatTime(Math.round(analytics.avg_completion_time)) : 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Weekly Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>New Routes</span>
                      <Badge variant="outline">{analytics?.routes_this_week || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Races Completed</span>
                      <Badge variant="outline">{analytics?.races_this_week || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;