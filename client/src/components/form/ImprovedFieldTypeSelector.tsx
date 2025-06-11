
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarIcon, ImageIcon, Type, Hash, AlignLeft, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ImprovedFieldTypeSelectorProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export type FieldType = "text" | "number" | "date" | "image" | "textarea" | "email" | "phone";

const ImprovedFieldTypeSelector = ({ placeholder, value, onChange, className }: ImprovedFieldTypeSelectorProps) => {
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
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "textarea": return <AlignLeft className="h-4 w-4" />;
      case "number": return <Hash className="h-4 w-4" />;
      case "date": return <CalendarIcon className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const renderField = () => {
    switch (fieldType) {
      case "image":
        return (
          <div className="space-y-4">
            {value && (
              <div className="relative w-full max-w-sm mx-auto">
                <div className="aspect-video rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
                  <img
                    src={value}
                    alt={displayName}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}
            <div className="space-y-3">
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
                className="cursor-pointer file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-colors"
              />
              <p className="text-xs text-muted-foreground text-center">
                Supported: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}...`}
            className="min-h-[120px] resize-y border-2 focus:border-primary transition-colors"
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
                  "w-full justify-start text-left font-normal h-12 border-2 transition-colors",
                  !value && "text-muted-foreground",
                  "hover:border-primary"
                )}
              >
                <CalendarIcon className="mr-3 h-4 w-4" />
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
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${displayName.toLowerCase()}...`}
              className="h-12 pl-10 border-2 focus:border-primary transition-colors"
            />
          </div>
        );
      case "phone":
        return (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter phone number..."
              className="h-12 pl-10 border-2 focus:border-primary transition-colors"
            />
          </div>
        );
      case "number":
        return (
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${displayName.toLowerCase()}...`}
              className="h-12 pl-10 border-2 focus:border-primary transition-colors"
            />
          </div>
        );
      default:
        return (
          <div className="relative">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${displayName.toLowerCase()}...`}
              className="h-12 pl-10 border-2 focus:border-primary transition-colors"
            />
          </div>
        );
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFieldTypeIcon(fieldType)}
            <Label className="text-base font-semibold text-foreground">
              {displayName}
            </Label>
          </div>
          <Select value={fieldType} onValueChange={(value) => setFieldType(value as FieldType)}>
            <SelectTrigger className="w-[130px] h-9 text-xs border-2">
              <SelectValue placeholder="Type" />
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
                  <Mail className="h-3 w-3 mr-2" />
                  Email
                </span>
              </SelectItem>
              <SelectItem value="phone">
                <span className="flex items-center">
                  <Phone className="h-3 w-3 mr-2" />
                  Phone
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderField()}
      </CardContent>
    </Card>
  );
};

export default ImprovedFieldTypeSelector;
