import { useEffect, useState } from "react";
import { Clock, Users, MapPin, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Challenge {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  target_value: number;
  difficulty_level: string;
  start_date: string;
  end_date: string;
  current_participants: number;
  max_participants: number;
  reward_points: number;
  creator_id: string;
  routes: {
    name: string;
    distance: number;
  } | null;
}

export const ChallengeList = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('active');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('challenges')
        .select(`
          *,
          routes(name, distance)
        `)
        .order('created_at', { ascending: false });

      // Apply date filters
      const now = new Date().toISOString();
      if (filter === 'active') {
        query = query.lte('start_date', now).gte('end_date', now);
      } else if (filter === 'upcoming') {
        query = query.gt('start_date', now);
      } else if (filter === 'ended') {
        query = query.lt('end_date', now);
      }

      const { data, error } = await query;

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert([
          {
            challenge_id: challengeId,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You've joined the challenge!",
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return `${km.toFixed(1)}km`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'hard': return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'extreme': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'time_trial': return <Clock className="h-4 w-4" />;
      case 'distance': return <MapPin className="h-4 w-4" />;
      case 'completion': return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Challenges' },
          { key: 'active', label: 'Active' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'ended', label: 'Ended' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key as any)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Challenge Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(challenge.challenge_type)}
                  <CardTitle className="text-lg">{challenge.name}</CardTitle>
                </div>
                <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                  {challenge.difficulty_level}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {challenge.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Route Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{challenge.routes?.name}</span>
                {challenge.routes?.distance && (
                  <span>• {formatDistance(challenge.routes.distance)}</span>
                )}
              </div>

              {/* Target & Participants */}
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>
                    Target: {challenge.challenge_type === 'time_trial' 
                      ? formatDuration(challenge.target_value)
                      : challenge.challenge_type === 'distance'
                      ? formatDistance(challenge.target_value)
                      : challenge.target_value
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {challenge.current_participants}
                    {challenge.max_participants && `/${challenge.max_participants}`}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(challenge.start_date).toLocaleDateString()} - {' '}
                  {new Date(challenge.end_date).toLocaleDateString()}
                </span>
              </div>

              {/* Points */}
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {challenge.reward_points} points
                </Badge>
                <Button 
                  size="sm"
                  onClick={() => joinChallenge(challenge.id)}
                  disabled={new Date(challenge.end_date) < new Date()}
                >
                  {new Date(challenge.end_date) < new Date() ? 'Ended' : 'Join Challenge'}
                </Button>
              </div>

              {/* Creator */}
              <div className="text-xs text-muted-foreground">
                Created by challenger
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {challenges.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? 'Be the first to create a challenge!' 
                : `No ${filter} challenges at the moment.`}
            </p>
            <Button variant="outline" onClick={() => setFilter('all')}>
              View All Challenges
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};