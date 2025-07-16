import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Save, Trash2, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RouteData {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  is_public: boolean;
  tags: string[];
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance: number | null;
}

interface RouteEditorProps {
  routeId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function RouteEditor({ routeId, onClose, onSave }: RouteEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [route, setRoute] = useState<RouteData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    difficulty_level: "medium" as "easy" | "medium" | "hard",
    is_public: false,
    tags: [] as string[]
  });
  const [currentTag, setCurrentTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .eq('user_id', user.id) // Ensure user owns this route
        .single();

      if (error) throw error;

      setRoute(data);
      setEditForm({
        name: data.name,
        description: data.description || "",
        difficulty_level: (data.difficulty_level as "easy" | "medium" | "hard") || "medium",
        is_public: data.is_public,
        tags: data.tags || []
      });
    } catch (error: any) {
      console.error('Error loading route:', error);
      toast({
        title: "Error Loading Route",
        description: error.message,
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !route) return;

    if (!editForm.name.trim()) {
      toast({
        title: "Route Name Required",
        description: "Please enter a name for your route.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('routes')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          difficulty_level: editForm.difficulty_level,
          is_public: editForm.is_public,
          tags: editForm.tags,
        })
        .eq('id', routeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Route Updated",
        description: "Your route has been successfully updated.",
      });

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating route:', error);
      toast({
        title: "Error Updating Route",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !route) return;

    if (!confirm("Are you sure you want to delete this route? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Route Deleted",
        description: "Your route has been successfully deleted.",
      });

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error deleting route:', error);
      toast({
        title: "Error Deleting Route",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !editForm.tags.includes(currentTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading route...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Route
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                type="text"
                placeholder="Enter route name..."
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your route..."
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select 
                value={editForm.difficulty_level} 
                onValueChange={(value: "easy" | "medium" | "hard") => 
                  setEditForm(prev => ({ ...prev, difficulty_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public-route"
                checked={editForm.is_public}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_public: checked }))}
              />
              <Label htmlFor="public-route">Make route public</Label>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                type="text"
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {editForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editForm.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Route Stats (Read-only) */}
          <div>
            <Label>Route Information</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="font-semibold">
                  {route.distance ? `${route.distance}km` : "Calculating..."}
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Coordinates</div>
                <div className="font-semibold text-xs">
                  {route.start_lat.toFixed(4)}, {route.start_lng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete Route"}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || deleting || !editForm.name.trim()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}