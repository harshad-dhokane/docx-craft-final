
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ImageIcon, Type, Hash, AlignLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EnhancedFieldTypeSelectorProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export type FieldType = "text" | "number" | "date" | "image" | "textarea" | "email" | "phone";

const EnhancedFieldTypeSelector = ({ placeholder, value, onChange, className }: EnhancedFieldTypeSelectorProps) => {
  const [fieldType, setFieldType] = useState<FieldType>("text");
  
  // Clean up the display name to be more readable
  const displayName = placeholder
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const renderField = () => {
    switch (fieldType) {
      case "image":
        return (
          <div className="space-y-3">
            {value && (
              <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden bg-muted border">
                <img
                  src={value}
                  alt={displayName}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      onChange(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
            className="min-h-[120px] resize-y"
            rows={4}
          />
        );
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : `Select ${displayName.toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
            className="h-10"
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter phone number"
            className="h-10"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
            className="h-10"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
            className="h-10"
          />
        );
    }
  };

  return (
    <div className={cn("space-y-3 p-4 rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-semibold text-foreground">
          {displayName}
        </Label>
        <Select value={fieldType} onValueChange={(value) => setFieldType(value as FieldType)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Field type" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="text">
              <span className="flex items-center">
                <Type className="h-3 w-3 mr-2" />
                Text
              </span>
            </SelectItem>
            <SelectItem value="textarea">
              <span className="flex items-center">
                <AlignLeft className="h-3 w-3 mr-2" />
                Long Text
              </span>
            </SelectItem>
            <SelectItem value="number">
              <span className="flex items-center">
                <Hash className="h-3 w-3 mr-2" />
                Number
              </span>
            </SelectItem>
            <SelectItem value="date">
              <span className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-2" />
                Date
              </span>
            </SelectItem>
            <SelectItem value="email">
              <span className="flex items-center">
                <Type className="h-3 w-3 mr-2" />
                Email
              </span>
            </SelectItem>
            <SelectItem value="phone">
              <span className="flex items-center">
                <Hash className="h-3 w-3 mr-2" />
                Phone
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="pt-1">
        {renderField()}
      </div>
    </div>
  );
};

export default EnhancedFieldTypeSelector;
