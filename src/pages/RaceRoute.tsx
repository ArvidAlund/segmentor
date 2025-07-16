import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Zap, 
  Play, 
  Pause, 
  Square, 
  Timer, 
  MapPin, 
  Target,
  TrendingUp,
  Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MapBox from "@/components/ui/MapBox";

interface Route {
  id: string;
  name: string;
  description: string | null;
  distance: number | null;
  estimated_time: number | null;
  difficulty_level: string | null;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  profiles: {
    display_name: string | null;
  } | null;
}

const RaceRoute = () => {
  const { routeId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [route, setRoute] = useState<Route | null>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null);
  const [distanceToFinish, setDistanceToFinish] = useState<number | null>(null);
  const [raceProgress, setRaceProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (routeId) {
      loadRoute();
    }
  }, [routeId]);

  useEffect(() => {
    if (isRacing && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRacing, isPaused]);

  useEffect(() => {
    // Start GPS tracking
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserPosition(newPos);
          setCurrentSpeed(position.coords.speed ? position.coords.speed * 3.6 : 0); // Convert m/s to km/h
          
          if (position.coords.speed && position.coords.speed * 3.6 > maxSpeed) {
            setMaxSpeed(position.coords.speed * 3.6);
          }

          if (route) {
            const distToStart = calculateDistance(newPos, { lat: route.start_lat, lng: route.start_lng });
            const distToFinish = calculateDistance(newPos, { lat: route.end_lat, lng: route.end_lng });
            
            setDistanceToStart(distToStart);
            setDistanceToFinish(distToFinish);

            // Calculate progress (simple linear approximation)
            if (route.distance) {
              const totalDistance = route.distance;
              const progressDistance = Math.max(0, totalDistance - distToFinish);
              setRaceProgress(Math.min(100, (progressDistance / totalDistance) * 100));
            }

            // Auto-start race when near start (within 50 meters)
            if (!isRacing && distToStart < 0.05) {
              handleStartRace();
            }

            // Auto-finish race when near finish (within 50 meters)
            if (isRacing && distToFinish < 0.05) {
              handleFinishRace();
            }
          }
        },
        (error) => console.error("GPS error:", error),
        { 
          enableHighAccuracy: true, 
          maximumAge: 1000,
          timeout: 5000
        }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [route, isRacing]);

  const loadRoute = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          profiles:user_id (
            display_name
          )
        `)
        .eq('id', routeId)
        .single();

      if (error) throw error;
      setRoute(data);
    } catch (error: any) {
      console.error('Error loading route:', error);
      toast({
        title: "Error Loading Route",
        description: error.message,
        variant: "destructive",
      });
      navigate('/explore-tracks');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleStartRace = () => {
    setIsRacing(true);
    setIsPaused(false);
    setRaceStartTime(new Date());
    setMaxSpeed(0);
    setRaceProgress(0);
    
    toast({
      title: "Race Started!",
      description: "Good luck! Follow the route to the finish line.",
    });
  };

  const handlePauseRace = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Race Resumed" : "Race Paused",
      description: isPaused ? "Timer resumed" : "Timer paused",
    });
  };

  const handleFinishRace = async () => {
    if (!raceStartTime || !user || !route) return;

    const finishTime = new Date();
    const raceTimeMs = finishTime.getTime() - raceStartTime.getTime();
    const raceTimeMinutes = raceTimeMs / (1000 * 60);

    setIsRacing(false);
    setIsPaused(false);

    try {
      // Save race completion
      const { error } = await supabase
        .from('route_completions')
        .insert({
          user_id: user.id,
          route_id: route.id,
          completion_time: Math.round(raceTimeMs / 1000), // Convert to seconds
          average_speed: route.distance ? (route.distance / raceTimeMinutes) * 60 : null, // km/h
          max_speed: maxSpeed,
          completion_date: finishTime.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Race Completed! 🏁",
        description: `Finished in ${Math.floor(raceTimeMs / 60000)}:${Math.floor((raceTimeMs % 60000) / 1000).toString().padStart(2, '0')}`,
      });
    } catch (error: any) {
      console.error('Error saving race completion:', error);
      toast({
        title: "Race Finished",
        description: "Couldn't save your time, but great job!",
        variant: "destructive",
      });
    }
  };

  const handleStopRace = () => {
    setIsRacing(false);
    setIsPaused(false);
    setRaceStartTime(null);
    setRaceProgress(0);
    
    toast({
      title: "Race Stopped",
      description: "Race has been cancelled.",
    });
  };

  const formatTime = (startTime: Date, currentTime: Date) => {
    const diff = currentTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const milliseconds = Math.floor((diff % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  if (loading || isLoadingRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading race...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Route Not Found</h2>
            <p className="text-muted-foreground mb-4">The route you're looking for doesn't exist.</p>
            <Link to="/explore-tracks">
              <Button>Back to Explore</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/explore-tracks">
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
          <div className="flex items-center gap-2">
            <Badge variant="outline">{route.difficulty_level}</Badge>
            <Badge variant="secondary">{route.distance?.toFixed(1)}km</Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden h-[500px]">
              <CardContent className="p-0 h-full">
                <MapBox 
                  initialCenter={{ lat: route.start_lat, lng: route.start_lng }}
                  showRoute={{
                    start: { lat: route.start_lat, lng: route.start_lng },
                    finish: { lat: route.end_lat, lng: route.end_lng }
                  }}
                  userPosition={userPosition}
                />
              </CardContent>
            </Card>
          </div>

          {/* Race Controls */}
          <div className="space-y-6">
            {/* Route Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {route.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{route.description}</p>
                <div className="text-sm text-muted-foreground">
                  Created by {route.profiles?.display_name || "Anonymous"}
                </div>
              </CardContent>
            </Card>

            {/* Race Status */}
            <Card>
              <CardHeader>
                <CardTitle>Race Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRacing && raceStartTime && (
                  <div>
                    <div className="text-2xl font-mono font-bold">
                      {formatTime(raceStartTime, currentTime)}
                    </div>
                    <Progress value={raceProgress} className="mt-2" />
                    <div className="text-sm text-muted-foreground mt-1">
                      {raceProgress.toFixed(1)}% complete
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Distance to Start</div>
                    <div className="font-medium">
                      {distanceToStart ? `${(distanceToStart * 1000).toFixed(0)}m` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Distance to Finish</div>
                    <div className="font-medium">
                      {distanceToFinish ? `${(distanceToFinish * 1000).toFixed(0)}m` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Current Speed</div>
                    <div className="font-medium">{currentSpeed.toFixed(1)} km/h</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max Speed</div>
                    <div className="font-medium">{maxSpeed.toFixed(1)} km/h</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-2">
                  {!isRacing ? (
                    <Button 
                      onClick={handleStartRace} 
                      className="flex-1"
                      variant="racing"
                      disabled={!userPosition}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Race
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handlePauseRace} 
                        variant="outline"
                        className="flex-1"
                      >
                        {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button 
                        onClick={handleStopRace} 
                        variant="destructive"
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
                
                {!userPosition && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Waiting for GPS location...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceRoute;