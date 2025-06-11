import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ImageIcon, Type, Hash, AlignLeft, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CompactFieldTypeSelectorProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export type FieldType = "text" | "number" | "date" | "image" | "textarea" | "email" | "phone";

const CompactFieldTypeSelector = ({ placeholder, value, onChange, className }: CompactFieldTypeSelectorProps) => {
  const [fieldType, setFieldType] = useState<FieldType>("text");

  // Clean up the display name to be more readable
  const displayName = placeholder
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case "image": return <ImageIcon className="h-3 w-3" />;
      case "textarea": return <AlignLeft className="h-3 w-3" />;
      case "number": return <Hash className="h-3 w-3" />;
      case "date": return <CalendarIcon className="h-3 w-3" />;
      case "email": return <Mail className="h-3 w-3" />;
      case "phone": return <Phone className="h-3 w-3" />;
      default: return <Type className="h-3 w-3" />;
    }
  };

  const renderField = () => {

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
        };
        reader.onerror = () => {
          console.error("Failed to read image as data URL");
        };
        reader.readAsDataURL(file);
      }
    };

    switch (fieldType) {
      case "image":
        return (
          <div className="space-y-2">
            {value && (
              <div className="relative w-16 h-16 mx-auto">
                <img
                  src={value}
                  alt={displayName}
                  className="object-cover w-full h-full rounded border"
                />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp"
                onChange={handleImageUpload}
                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground"
              />
            </div>
          </div>
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}...`}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
        );
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-8 text-xs",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {value ? format(new Date(value), "MMM dd, yyyy") : `Select date`}
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
          <div className="relative">
            <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${displayName.toLowerCase()}...`}
              className="h-8 pl-7 text-xs"
            />
          </div>
        );
      case "phone":
        return (
          <div className="relative">
            <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="tel"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter phone..."
              className="h-8 pl-7 text-xs"
            />
          </div>
        );
      case "number":
        return (
          <div className="relative">
            <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${displayName.toLowerCase()}...`}
              className="h-8 pl-7 text-xs"
            />
          </div>
        );
      default:
        return (
          <div className="relative">
            <Type className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${displayName.toLowerCase()}...`}
              className="h-8 pl-7 text-xs"
            />
          </div>
        );
    }
  };

  return (
    <div className={cn("bg-white border rounded-lg p-3 space-y-2 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-1">
          {getFieldTypeIcon(fieldType)}
          {displayName}
        </Label>
        <Select value={fieldType} onValueChange={(value) => setFieldType(value as FieldType)}>
          <SelectTrigger className="w-20 h-6 text-xs border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="text">
              <span className="flex items-center text-xs">
                <Type className="h-3 w-3 mr-1" />
                Text
              </span>
            </SelectItem>
            <SelectItem value="textarea">
              <span className="flex items-center text-xs">
                <AlignLeft className="h-3 w-3 mr-1" />
                Long
              </span>
            </SelectItem>
            <SelectItem value="number">
              <span className="flex items-center text-xs">
                <Hash className="h-3 w-3 mr-1" />
                Number
              </span>
            </SelectItem>
            <SelectItem value="date">
              <span className="flex items-center text-xs">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Date
              </span>
            </SelectItem>
            <SelectItem value="email">
              <span className="flex items-center text-xs">
                <Mail className="h-3 w-3 mr-1" />
                Email
              </span>
            </SelectItem>
            <SelectItem value="phone">
              <span className="flex items-center text-xs">
                <Phone className="h-3 w-3 mr-1" />
                Phone
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {renderField()}
    </div>
  );
};

export default CompactFieldTypeSelector;