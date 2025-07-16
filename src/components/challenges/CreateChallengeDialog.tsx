import { useState, useEffect } from "react";
import { CalendarIcon, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Route {
  id: string;
  name: string;
  distance: number;
}

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateChallengeDialog = ({ open, onOpenChange }: CreateChallengeDialogProps) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    route_id: '',
    challenge_type: 'time_trial',
    target_value: '',
    difficulty_level: 'medium',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    max_participants: '',
    is_public: true,
    reward_points: '100',
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchRoutes();
    }
  }, [open]);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, name, distance')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast({
        title: "Error",
        description: "Failed to load routes",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Validation
      if (!formData.name || !formData.route_id || !formData.start_date || !formData.end_date) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.start_date >= formData.end_date) {
        throw new Error('End date must be after start date');
      }

      // Convert target value based on challenge type
      let targetValue = parseInt(formData.target_value);
      if (formData.challenge_type === 'time_trial') {
        // Convert hours and minutes to seconds
        const hours = Math.floor(targetValue / 100);
        const minutes = targetValue % 100;
        targetValue = hours * 3600 + minutes * 60;
      } else if (formData.challenge_type === 'distance') {
        // Convert km to meters
        targetValue = targetValue * 1000;
      }

      const { error } = await supabase
        .from('challenges')
        .insert([
          {
            creator_id: user.id,
            route_id: formData.route_id,
            name: formData.name,
            description: formData.description,
            challenge_type: formData.challenge_type,
            target_value: targetValue,
            difficulty_level: formData.difficulty_level,
            start_date: formData.start_date.toISOString(),
            end_date: formData.end_date.toISOString(),
            max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
            is_public: formData.is_public,
            reward_points: parseInt(formData.reward_points),
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Challenge created successfully!",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        route_id: '',
        challenge_type: 'time_trial',
        target_value: '',
        difficulty_level: 'medium',
        start_date: undefined,
        end_date: undefined,
        max_participants: '',
        is_public: true,
        reward_points: '100',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTargetPlaceholder = () => {
    switch (formData.challenge_type) {
      case 'time_trial': return 'e.g., 130 (1h 30m)';
      case 'distance': return 'Distance in km';
      case 'completion': return 'Number of completions';
      default: return 'Target value';
    }
  };

  const getTargetLabel = () => {
    switch (formData.challenge_type) {
      case 'time_trial': return 'Target Time (HHMM format)';
      case 'distance': return 'Target Distance (km)';
      case 'completion': return 'Target Completions';
      default: return 'Target Value';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Challenge</DialogTitle>
          <DialogDescription>
            Create a challenge based on a route to compete with other users
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Challenge Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter challenge name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the challenge..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="route">Route *</Label>
              <Select value={formData.route_id} onValueChange={(value) => setFormData({ ...formData, route_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{route.name}</span>
                        {route.distance && (
                          <span className="text-muted-foreground">
                            ({(route.distance / 1000).toFixed(1)}km)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Challenge Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Challenge Type</Label>
                <Select 
                  value={formData.challenge_type} 
                  onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_trial">Time Trial</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={formData.difficulty_level} 
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="target">{getTargetLabel()}</Label>
              <Input
                id="target"
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder={getTargetPlaceholder()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      disabled={(date) => date <= (formData.start_date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="participants">Max Participants</Label>
                <Input
                  id="participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="No limit"
                />
              </div>

              <div>
                <Label htmlFor="points">Reward Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.reward_points}
                  onChange={(e) => setFormData({ ...formData, reward_points: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label htmlFor="public">Public Challenge</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};