import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
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
                <CardTitle>Route Management</CardTitle>
                <CardDescription>Moderate and manage racing routes</CardDescription>
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