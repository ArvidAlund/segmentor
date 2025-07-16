import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Timer, Trophy, Users, Zap, Navigation, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import heroImage from "@/assets/racing-hero.jpg";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-racing rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Segmentor</span>
          </div>
          <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user.email}
                  </span>
                  <Link to="/profile">
                    <Button variant="outline" size="sm">Profile</Button>
                  </Link>
                  <Link to="/community">
                    <Button variant="outline" size="sm">Community</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="racing" size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-racing bg-clip-text text-transparent animate-racing-pulse">
              Race Your World
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create custom racing tracks anywhere on Earth. Use GPS to time your runs. 
              Compete with racers worldwide and climb the leaderboards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link to="/create-track">
                  <Button variant="racing" size="lg" className="w-full sm:w-auto">
                    <MapPin className="w-5 h-5" />
                    Create Your First Track
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="racing" size="lg" className="w-full sm:w-auto">
                    <MapPin className="w-5 h-5" />
                    Get Started Free
                  </Button>
                </Link>
              )}
              <Link to="/explore-tracks">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Navigation className="w-5 h-5" />
                  Explore Tracks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Race Like Never Before
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced GPS tracking meets competitive racing in a seamless mobile experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 animate-glow-pulse">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Custom Track Creation</h3>
              <p className="text-muted-foreground">
                Design unique racing routes anywhere in the world using our intuitive map interface. 
                Set start points, finish lines, and waypoints with precision.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-speed rounded-lg flex items-center justify-center mb-4 animate-glow-pulse">
                <Timer className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">GPS Auto-Timing</h3>
              <p className="text-muted-foreground">
                Your timer starts automatically when you cross the starting line and stops at the finish. 
                No manual controls needed - just focus on racing.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4 animate-glow-pulse">
                <Trophy className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Global Leaderboards</h3>
              <p className="text-muted-foreground">
                Compete with runners from around the world. Track your best times, 
                average speeds, and climb the rankings on every track.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-racing-success rounded-lg flex items-center justify-center mb-4 animate-glow-pulse">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Social Racing</h3>
              <p className="text-muted-foreground">
                Follow friends, join racing communities, and share your favorite tracks. 
                Make fitness social and competitive.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-racing-warning rounded-lg flex items-center justify-center mb-4 animate-glow-pulse">
                <Zap className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Real-time Stats</h3>
              <p className="text-muted-foreground">
                Monitor your performance with live speed tracking, pace analysis, 
                and detailed race statistics for every run.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40 hover:shadow-card transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-racing-speed rounded-lg flex items-center justify-center mb-4 animate-glow-pulse">
                <Navigation className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Precision GPS</h3>
              <p className="text-muted-foreground">
                High-accuracy GPS tracking ensures fair timing and accurate distance measurements 
                for every race you complete.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to Start Racing?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of racers worldwide. Create your account and start building 
            your custom tracks today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link to="/create-track">
                <Button variant="racing" size="lg" className="w-full sm:w-auto">
                  <MapPin className="w-5 h-5" />
                  Create Your First Track
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="racing" size="lg" className="w-full sm:w-auto">
                  <MapPin className="w-5 h-5" />
                  Get Started Free
                </Button>
              </Link>
            )}
            <Link to="/explore-tracks">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-racing rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">RaceTrack</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 RaceTrack. Race your world, one track at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;