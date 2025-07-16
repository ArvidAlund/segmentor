import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Zap, 
  LogOut, 
  Search, 
  MapPin, 
  Ruler, 
  Target,
  User,
  Play,
  Eye,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, useLoadScript, OverlayView, Polyline } from "@react-google-maps/api";

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
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const libraries: ("places")[] = ["places"];
const mapContainerStyle = { width: "100%", height: "70vh" };

const MapView = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries,
  });
  
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RouteWithProfile[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithProfile | null>(null);
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 59.3293, lng: 18.0686 });
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

  useEffect(() => {
    loadRoutes();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [routes, searchQuery, difficultyFilter]);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserPosition(userPos);
          setMapCenter(userPos);
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }
  };

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes((data as unknown as RouteWithProfile[]) || []);
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

  const filterRoutes = () => {
    let filtered = routes;

    if (searchQuery) {
      filtered = filtered.filter(route =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(route => route.difficulty_level === difficultyFilter);
    }

    setFilteredRoutes(filtered);
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const RouteMarker = ({ route, position }: { route: RouteWithProfile, position: google.maps.LatLngLiteral }) => (
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div 
        className="relative cursor-pointer"
        onClick={() => {
          setSelectedRoute(route);
          setShowRouteDetails(true);
        }}
      >
        <div 
          className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: getDifficultyColor(route.difficulty_level) }}
        >
          S
        </div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white"></div>
      </div>
    </OverlayView>
  );

  const RouteFinishMarker = ({ route, position }: { route: RouteWithProfile, position: google.maps.LatLngLiteral }) => (
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div 
        className="relative cursor-pointer"
        onClick={() => {
          setSelectedRoute(route);
          setShowRouteDetails(true);
        }}
      >
        <div 
          className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: getDifficultyColor(route.difficulty_level) }}
        >
          F
        </div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white"></div>
      </div>
    </OverlayView>
  );

  if (loadError) return <div>❌ Error loading map</div>;
  if (!isLoaded) return <div>🛰️ Loading map...</div>;

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

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Route Map</h1>
          <p className="text-muted-foreground">
            Explore all available racing routes on the map
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Routes</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search routes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Legend</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span>Easy Routes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span>Medium Routes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Hard Routes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                      <span>Your Location</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Details */}
            {selectedRoute && showRouteDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedRoute.name}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRouteDetails(false)}
                    >
                      ×
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Badge variant={
                      selectedRoute.difficulty_level === 'easy' ? 'secondary' :
                      selectedRoute.difficulty_level === 'medium' ? 'default' : 'destructive'
                    }>
                      {selectedRoute.difficulty_level}
                    </Badge>
                    {selectedRoute.distance && (
                      <Badge variant="outline">{selectedRoute.distance.toFixed(1)}km</Badge>
                    )}
                  </div>

                  {selectedRoute.description && (
                    <p className="text-sm text-muted-foreground">{selectedRoute.description}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={selectedRoute.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(selectedRoute.profiles?.display_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      by {selectedRoute.profiles?.display_name || "Anonymous"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground">Likes</div>
                      <div className="font-medium">{selectedRoute.likes_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Completions</div>
                      <div className="font-medium">{selectedRoute.times_completed}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/race/${selectedRoute.id}`} className="flex-1">
                      <Button variant="racing" size="sm" className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Race It
                      </Button>
                    </Link>
                    <Link to={`/explore-tracks`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  zoom={12}
                  center={mapCenter}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: true,
                    zoomControl: true,
                    fullscreenControl: true
                  }}
                >
                  {/* User Position */}
                  {userPosition && (
                    <OverlayView position={userPosition} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                      <div className="relative w-8 h-8">
                        <div className="absolute w-full h-full rounded-full bg-blue-500 opacity-70 animate-pulse" />
                        <div className="absolute w-3 h-3 top-2.5 left-2.5 rounded-full bg-blue-500 shadow-md border-2 border-white" />
                      </div>
                    </OverlayView>
                  )}

                  {/* Route Markers and Lines */}
                  {filteredRoutes.map((route) => (
                    <div key={route.id}>
                      {/* Start Marker */}
                      <RouteMarker 
                        route={route} 
                        position={{ lat: route.start_lat, lng: route.start_lng }} 
                      />
                      
                      {/* Finish Marker */}
                      <RouteFinishMarker 
                        route={route} 
                        position={{ lat: route.end_lat, lng: route.end_lng }} 
                      />

                      {/* Route Line */}
                      <Polyline
                        path={[
                          { lat: route.start_lat, lng: route.start_lng },
                          { lat: route.end_lat, lng: route.end_lng }
                        ]}
                        options={{
                          strokeColor: getDifficultyColor(route.difficulty_level),
                          strokeOpacity: selectedRoute?.id === route.id ? 1.0 : 0.6,
                          strokeWeight: selectedRoute?.id === route.id ? 4 : 2,
                        }}
                      />
                    </div>
                  ))}
                </GoogleMap>
              </CardContent>
            </Card>

            {/* Route Count */}
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {filteredRoutes.length} of {routes.length} routes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;