import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Timer, 
  Trophy, 
  Users, 
  Zap, 
  ArrowLeft,
  Filter,
  Ruler,
  Navigation,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";

const ExploreTracks = () => {
  const tracks = [
    {
      id: 1,
      name: "Downtown Sprint Circuit",
      distance: "3.2 km",
      difficulty: "Medium",
      record: "12:45",
      participants: 342,
      creator: "Alex Runner",
      description: "Fast-paced urban track through the city center with challenging turns"
    },
    {
      id: 2,
      name: "Seaside Marathon Route",
      distance: "21.1 km",
      difficulty: "Hard",
      record: "1:45:23",
      participants: 156,
      creator: "Maria Coastal",
      description: "Scenic coastal route with stunning ocean views and moderate elevation"
    },
    {
      id: 3,
      name: "Park Loop Express",
      distance: "1.8 km",
      difficulty: "Easy",
      record: "7:32",
      participants: 567,
      creator: "Tom Park",
      description: "Perfect for beginners, peaceful park setting with minimal elevation"
    },
    {
      id: 4,
      name: "Mountain Ridge Challenge",
      distance: "8.7 km",
      difficulty: "Expert",
      record: "35:12",
      participants: 89,
      creator: "Sarah Summit",
      description: "Intense mountain trail with steep climbs and technical descents"
    },
    {
      id: 5,
      name: "University Campus Tour",
      distance: "4.5 km",
      difficulty: "Medium",
      record: "18:45",
      participants: 234,
      creator: "Mike Student",
      description: "Popular student route covering the entire campus with mixed terrain"
    },
    {
      id: 6,
      name: "Historic District Walk",
      distance: "2.7 km",
      difficulty: "Easy",
      record: "15:20",
      participants: 423,
      creator: "Emma History",
      description: "Cultural route through historic landmarks and cobblestone streets"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-racing-success/10 text-racing-success border-racing-success/30";
      case "Medium": return "bg-racing-warning/10 text-racing-warning border-racing-warning/30";
      case "Hard": return "bg-primary/10 text-primary border-primary/30";
      case "Expert": return "bg-destructive/10 text-destructive border-destructive/30";
      default: return "bg-muted/10 text-muted-foreground border-muted/30";
    }
  };

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
            <Button variant="outline" size="sm">Profile</Button>
            <Link to="/create-track">
              <Button variant="racing" size="sm">
                <Plus className="w-4 h-4" />
                Create Track
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-racing bg-clip-text text-transparent">
            Explore Racing Tracks
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing tracks created by racers worldwide. Find your next challenge and set new records.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tracks by name, location, or creator..."
              className="pl-10 bg-card/50 border-border/40"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Navigation className="w-4 h-4" />
              Near Me
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/30">
            All Tracks
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-racing-success/10 hover:border-racing-success/30">
            Easy
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-racing-warning/10 hover:border-racing-warning/30">
            Medium
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/30">
            Hard
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-destructive/10 hover:border-destructive/30">
            Expert
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent/10 hover:border-accent/30">
            Popular
          </Badge>
        </div>

        {/* Tracks Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <Card key={track.id} className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
                    {track.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">by {track.creator}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {track.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={getDifficultyColor(track.difficulty)}>
                  {track.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {track.participants}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{track.distance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-racing-warning" />
                  <span className="text-sm font-medium text-foreground">{track.record}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="racing" size="sm" className="flex-1">
                  <Timer className="w-4 h-4" />
                  Race Now
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Tracks
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExploreTracks;