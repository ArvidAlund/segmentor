import { useEffect, useState } from "react";
import { Trophy, Lock, Star, Medal, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  achievement_type: string;
  criteria: any;
  points: number;
  rarity: string;
  user_achievements?: {
    earned_at: string;
    progress: any;
  }[];
}

export const AchievementGrid = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'available'>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          *,
          user_achievements(earned_at, progress)
        `)
        .order('rarity', { ascending: false })
        .order('points', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
      case 'rare': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'epic': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'legendary': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Medal className="h-4 w-4" />;
      case 'rare': return <Star className="h-4 w-4" />;
      case 'epic': return <Trophy className="h-4 w-4" />;
      case 'legendary': return <Crown className="h-4 w-4" />;
      default: return <Medal className="h-4 w-4" />;
    }
  };

  const isEarned = (achievement: Achievement) => {
    return achievement.user_achievements && achievement.user_achievements.length > 0;
  };

  const getFilteredAchievements = () => {
    switch (filter) {
      case 'earned':
        return achievements.filter(achievement => isEarned(achievement));
      case 'available':
        return achievements.filter(achievement => !isEarned(achievement));
      default:
        return achievements;
    }
  };

  const formatCriteria = (achievement: Achievement) => {
    const criteria = achievement.criteria;
    const type = achievement.achievement_type;

    switch (type) {
      case 'route':
        if (criteria.routes_completed) return `Complete ${criteria.routes_completed} route${criteria.routes_completed !== 1 ? 's' : ''}`;
        if (criteria.routes_created) return `Create ${criteria.routes_created} route${criteria.routes_created !== 1 ? 's' : ''}`;
        break;
      case 'distance':
        if (criteria.min_distance) return `Complete a route longer than ${(criteria.min_distance / 1000).toFixed(1)}km`;
        break;
      case 'time':
        if (criteria.max_completion_time) {
          const hours = Math.floor(criteria.max_completion_time / 3600);
          const minutes = Math.floor((criteria.max_completion_time % 3600) / 60);
          return `Complete a route in under ${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
        }
        break;
      case 'streak':
        if (criteria.consecutive_days) return `Complete routes on ${criteria.consecutive_days} consecutive days`;
        break;
      case 'social':
        if (criteria.communities_joined) return `Join ${criteria.communities_joined} communities`;
        break;
      case 'milestone':
        if (criteria.routes_completed) return `Complete ${criteria.routes_completed} total routes`;
        break;
    }

    return achievement.description;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredAchievements = getFilteredAchievements();
  const earnedCount = achievements.filter(isEarned).length;
  const totalPoints = achievements
    .filter(isEarned)
    .reduce((sum, achievement) => sum + achievement.points, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{earnedCount}</p>
                <p className="text-sm text-muted-foreground">Achievements Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Star className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Medal className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{Math.round((earnedCount / achievements.length) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `All (${achievements.length})` },
          { key: 'earned', label: `Earned (${earnedCount})` },
          { key: 'available', label: `Available (${achievements.length - earnedCount})` },
        ].map(({ key, label }) => (
          <Badge
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter(key as any)}
          >
            {label}
          </Badge>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAchievements.map((achievement) => {
          const earned = isEarned(achievement);
          const earnedData = achievement.user_achievements?.[0];

          return (
            <Card 
              key={achievement.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                earned 
                  ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' 
                  : 'opacity-80'
              }`}
            >
              {earned && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    ✓ Earned
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{achievement.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {getRarityIcon(achievement.rarity)}
                        {achievement.rarity}
                      </Badge>
                      <Badge variant="outline">
                        {achievement.points} pts
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {formatCriteria(achievement)}
                </p>

                {earned && earnedData && (
                  <div className="text-xs text-muted-foreground">
                    Earned on {new Date(earnedData.earned_at).toLocaleDateString()}
                  </div>
                )}

                {!earned && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Not earned yet</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
            <p className="text-muted-foreground">
              {filter === 'earned' 
                ? 'Complete some routes to earn your first achievements!' 
                : filter === 'available'
                ? 'You\'ve earned all available achievements!'
                : 'No achievements available.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};