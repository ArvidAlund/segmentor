import { useEffect, useState } from "react";
import { Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  total_achievements: number;
  completion_count: number;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

interface ChallengeLeaderboard {
  challenge_id: string;
  challenge_name: string;
  user_id: string;
  completion_value: number;
  ranking_position: number;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

export const Leaderboard = () => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challengeLeaderboards, setChallengeLeaderboards] = useState<ChallengeLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);

      // Fetch global leaderboard (achievements + points)
      const { data: globalData, error: globalError } = await supabase
        .from('user_achievements')
        .select(`
          user_id,
          achievements(points)
        `);

      if (globalError) throw globalError;

      // Process global leaderboard data
      const userStats = new Map();
      globalData?.forEach(entry => {
        const userId = entry.user_id;
        const points = entry.achievements?.points || 0;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            total_points: 0,
            total_achievements: 0,
          });
        }
        
        const stats = userStats.get(userId);
        stats.total_points += points;
        stats.total_achievements += 1;
      });

      // Add completion counts
      const { data: completionData, error: completionError } = await supabase
        .from('route_completions')
        .select('user_id');

      if (completionError) throw completionError;

      const completionCounts = new Map();
      completionData?.forEach(completion => {
        const userId = completion.user_id;
        completionCounts.set(userId, (completionCounts.get(userId) || 0) + 1);
      });

      // Get profiles for all users
      const userIds = Array.from(userStats.keys());
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const globalLeaderboardData = Array.from(userStats.values()).map(user => ({
        ...user,
        completion_count: completionCounts.get(user.user_id) || 0,
        profiles: profilesMap.get(user.user_id) || { display_name: 'Unknown User', avatar_url: null },
      })).sort((a, b) => b.total_points - a.total_points);

      setGlobalLeaderboard(globalLeaderboardData);

      // Fetch recent challenge completions
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenge_completions')
        .select(`
          challenge_id,
          user_id,
          completion_value,
          ranking_position,
          challenges(name)
        `)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (challengeError) throw challengeError;

      // Get profiles for challenge participants
      const challengeUserIds = challengeData?.map(entry => entry.user_id) || [];
      const { data: challengeProfilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', challengeUserIds);

      const challengeProfilesMap = new Map();
      challengeProfilesData?.forEach(profile => {
        challengeProfilesMap.set(profile.user_id, profile);
      });

      const challengeLeaderboardData = challengeData?.map(entry => ({
        challenge_id: entry.challenge_id,
        challenge_name: entry.challenges?.name || 'Unknown Challenge',
        user_id: entry.user_id,
        completion_value: entry.completion_value,
        ranking_position: entry.ranking_position || 0,
        profiles: challengeProfilesMap.get(entry.user_id) || { display_name: 'Unknown User', avatar_url: null },
      })) || [];

      setChallengeLeaderboards(challengeLeaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-400" />;
      default: return <span className="text-muted-foreground">#{position}</span>;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="global">Global Rankings</TabsTrigger>
          <TabsTrigger value="challenges">Challenge Results</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          {/* Top 3 Podium */}
          {globalLeaderboard.length >= 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Leading athletes by achievement points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {globalLeaderboard.slice(0, 3).map((entry, index) => (
                    <div key={entry.user_id} className="text-center">
                      <div className="relative mb-4">
                        <Avatar className="h-16 w-16 mx-auto">
                          <AvatarImage src={entry.profiles?.avatar_url} />
                          <AvatarFallback>
                            {entry.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2">
                          {getRankIcon(index + 1)}
                        </div>
                      </div>
                      <h3 className="font-semibold truncate">
                        {entry.profiles?.display_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.total_points} points
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total_achievements} achievements
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
              <CardDescription>
                All athletes ranked by total achievement points
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {globalLeaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      index < 3 ? 'bg-muted/25' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index + 1)}
                    </div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.profiles?.avatar_url} />
                      <AvatarFallback>
                        {entry.profiles?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">
                        {entry.profiles?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.completion_count} routes completed
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{entry.total_points} pts</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.total_achievements} badges
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {globalLeaderboard.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                  <p className="text-muted-foreground">
                    Complete routes and earn achievements to appear on the leaderboard!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Challenge Results</CardTitle>
              <CardDescription>
                Latest completions from active challenges
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {challengeLeaderboards.map((entry, index) => (
                  <div
                    key={`${entry.challenge_id}-${entry.user_id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8">
                      {entry.ranking_position <= 3 ? (
                        getRankIcon(entry.ranking_position)
                      ) : (
                        <span className="text-muted-foreground">#{entry.ranking_position}</span>
                      )}
                    </div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.profiles?.avatar_url} />
                      <AvatarFallback>
                        {entry.profiles?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">
                        {entry.profiles?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.challenge_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {formatDuration(entry.completion_value)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Rank #{entry.ranking_position}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {challengeLeaderboards.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No challenge results yet</h3>
                  <p className="text-muted-foreground">
                    Join and complete challenges to see results here!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};