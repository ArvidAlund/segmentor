import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, LogOut, MapPin, Flag, Timer, Ruler, Users } from "lucide-react";
import MapBox from "@/components/ui/MapBox";
import RouteForm from "@/components/RouteForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CreateTrack = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Route coordinates and calculated data
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSaveRoute = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save routes.",
        variant: "destructive",
      });
      return;
    }

    if (!routeName.trim()) {
      toast({
        title: "Route Name Required",
        description: "Please enter a name for your route.",
        variant: "destructive",
      });
      return;
    }

    if (!startPoint || !endPoint) {
      toast({
        title: "Route Points Missing",
        description: "Please set both start and end points on the map.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('routes')
        .insert({
          user_id: user.id,
          name: routeName,
          description: description || null,
          start_lat: startPoint.lat,
          start_lng: startPoint.lng,
          end_lat: endPoint.lat,
          end_lng: endPoint.lng,
          difficulty_level: difficulty,
          is_public: isPublic,
          tags: tags,
          distance: routeDistance,
          estimated_time: Math.round(routeDuration),
        });

      if (error) throw error;

      toast({
        title: "Route Saved!",
        description: "Your route has been successfully created.",
      });

      // Navigate to explore tracks or back to home
      navigate('/explore-tracks');
    } catch (error: any) {
      console.error('Error saving route:', error);
      toast({
        title: "Error Saving Route",
        description: error.message || "An error occurred while saving your route.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRouteChange = (
    start: { lat: number; lng: number } | null,
    finish: { lat: number; lng: number } | null,
    routeData?: { distance: number; duration: number }
  ) => {
    setStartPoint(start);
    setEndPoint(finish);
    if (routeData) {
      setRouteDistance(Number(routeData.distance.toFixed(2)));
      setRouteDuration(Number(routeData.duration.toFixed(0)));
    } else {
      setRouteDistance(0);
      setRouteDuration(0);
    }
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
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Track</h1>
          <p className="text-muted-foreground">
            Design your custom racing route by clicking points on the map
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Create Your Track
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      Start
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      Finish
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>
                  Click on the map to set your start point, then click again to set the finish line
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <MapBox onRouteChange={handleRouteChange} />
              </CardContent>
            </Card>

            {/* Track Stats Preview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Track Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Estimated Time</div>
                    <div className="font-medium">
                      {routeDuration > 0 ? `${Math.round(routeDuration)} min` : '--:--'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Ruler className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="font-medium">
                      {routeDistance > 0 ? `${routeDistance} km` : '-- km'}
                    </div>
                  </div>
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Start Set</div>
                    <div className="font-medium">{startPoint ? '✓' : '✗'}</div>
                  </div>
                  <div className="text-center">
                    <Flag className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Finish Set</div>
                    <div className="font-medium">{endPoint ? '✓' : '✗'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Details Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
                <CardDescription>
                  Configure your route settings and metadata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RouteForm
                  routeName={routeName}
                  setRouteName={setRouteName}
                  description={description}
                  setDescription={setDescription}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                  tags={tags}
                  setTags={setTags}
                  onSave={handleSaveRoute}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrack;