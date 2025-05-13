import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectTag } from "@shared/schema";

interface ProjectTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function ProjectTagSelector({ selectedTags, onChange }: ProjectTagSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  
  // Fetch available project tags
  const { data: projectTags = [], isLoading } = useQuery<ProjectTag[]>({
    queryKey: ["/api/projects"],
  });
  
  // Filter project tags based on input
  const filteredTags = React.useMemo(() => {
    if (!inputValue) return projectTags;
    
    const lowerInput = inputValue.toLowerCase();
    return projectTags.filter(tag => 
      tag.name.toLowerCase().includes(lowerInput) && 
      !selectedTags.includes(tag.name)
    );
  }, [projectTags, inputValue, selectedTags]);
  
  // Add a tag
  const addTag = (tag: string) => {
    if (!tag.trim() || selectedTags.includes(tag)) return;
    
    onChange([...selectedTags, tag]);
    setInputValue("");
  };
  
  // Remove a tag
  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };
  
  // Create a new tag from input
  const createTag = () => {
    if (inputValue && !selectedTags.includes(inputValue)) {
      addTag(inputValue);
      setOpen(false);
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md min-h-[42px]">
        {selectedTags.map(tag => (
          <Badge key={tag} variant="outline" className="bg-primary/10 text-primary">
            {tag}
            <button
              type="button"
              className="ml-1 text-primary/70 hover:text-primary"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center">
            <Input
              placeholder="Type to add or select projects..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={() => setOpen(true)}
              className="w-full"
            />
            <ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Search projects..." value={inputValue} onValueChange={setInputValue} />
            <CommandList>
              <CommandEmpty>
                {inputValue ? (
                  <button
                    className="px-2 py-1.5 text-sm w-full hover:bg-slate-100 text-left"
                    onClick={createTag}
                  >
                    Create "{inputValue}"
                  </button>
                ) : (
                  "No projects found"
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map(tag => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      addTag(tag.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.includes(tag.name) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
