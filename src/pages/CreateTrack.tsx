import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Navigation, 
  Zap, 
  ArrowLeft, 
  Search, 
  Plus,
  Target,
  Flag,
  Timer,
  Users,
  Ruler
} from "lucide-react";
import { Link } from "react-router-dom";

const CreateTrack = () => {
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
              <span className="text-xl font-bold text-foreground">RaceTrack</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Profile</Button>
            <Button variant="racing" size="sm">
              <Plus className="w-4 h-4" />
              New Track
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-card">
              {/* Map Controls */}
              <div className="p-4 border-b border-border/40 bg-card/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Create Your Track</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Target className="w-3 h-3 mr-1" />
                      Start Point
                    </Badge>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                      <Flag className="w-3 h-3 mr-1" />
                      Finish Line
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search for a location..."
                      className="pl-10 bg-background/50"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Navigation className="w-4 h-4" />
                    My Location
                  </Button>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="h-[500px] bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="text-center z-10">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto animate-glow-pulse">
                    <MapPin className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Interactive Map Coming Soon</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Click to set your start point, then drag to create your custom racing route
                  </p>
                  <Button variant="racing">
                    <Plus className="w-4 h-4" />
                    Enable GPS & Start Creating
                  </Button>
                </div>
              </div>

              {/* Map Instructions */}
              <div className="p-4 bg-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Click to set start
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    Drag to create route
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-racing-warning rounded-full"></div>
                    Set finish line
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-racing-success rounded-full"></div>
                    Save & publish
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Track Details Panel */}
          <div className="space-y-6">
            {/* Track Information */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Track Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Track Name</label>
                  <Input placeholder="My Awesome Track" className="bg-background/50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                  <Input placeholder="A challenging route through..." className="bg-background/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Distance</label>
                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded-md border border-border/40">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Auto-calculated</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                    <select className="w-full p-2 bg-background/50 rounded-md border border-border/40 text-sm">
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Track Stats Preview */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Preview Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estimated Time</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">--:--</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Distance</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">-- km</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Elevation</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">-- m</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="racing" className="w-full">
                <Flag className="w-4 h-4" />
                Save & Publish Track
              </Button>
              <Button variant="outline" className="w-full">
                Save as Draft
              </Button>
            </div>

            {/* Popular Tracks */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Popular Nearby</h3>
              <div className="space-y-3">
                {[
                  { name: "City Center Sprint", distance: "2.1 km", users: 234 },
                  { name: "Park Loop Challenge", distance: "5.8 km", users: 189 },
                  { name: "Riverside Marathon", distance: "10.5 km", users: 156 }
                ].map((track, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-border/20 hover:bg-background/50 transition-colors cursor-pointer">
                    <div>
                      <div className="font-medium text-sm text-foreground">{track.name}</div>
                      <div className="text-xs text-muted-foreground">{track.distance}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {track.users}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrack;