import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";

interface RouteFormProps {
  routeName: string;
  setRouteName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (diff: "easy" | "medium" | "hard") => void;
  isPublic: boolean;
  setIsPublic: (pub: boolean) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  onSave: () => void;
  saving: boolean;
}

export default function RouteForm({
  routeName,
  setRouteName,
  description,
  setDescription,
  difficulty,
  setDifficulty,
  isPublic,
  setIsPublic,
  tags,
  setTags,
  onSave,
  saving
}: RouteFormProps) {
  const [currentTag, setCurrentTag] = useState("");

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="route-name">Route Name</Label>
          <Input
            id="route-name"
            type="text"
            placeholder="Enter route name..."
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your route..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
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
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="public-route">Make route public</Label>
        </div>

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
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
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
      </div>

      <Button 
        onClick={onSave} 
        className="w-full" 
        disabled={saving || !routeName.trim()}
      >
        {saving ? "Saving..." : "Save Route"}
      </Button>
    </div>
  );
}