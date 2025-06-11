
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { GeneratedPDF } from '@/hooks/useGeneratedPDFs';
import { formatDistanceToNow } from "date-fns";

interface TemplateStats {
  templateId: string;
  templateName: string;
  fileCount: number;
  totalSize: number;
  lastGenerated: string;
  files: GeneratedPDF[];
}

interface TemplateDistributionProps {
  generatedPDFs: GeneratedPDF[];
  onTemplateFilter: (templateId: string | null) => void;
  activeTemplateFilter: string | null;
}

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, index) * 100) / 100 + ' ' + sizes[index];
};

export const TemplateDistribution = ({ 
  generatedPDFs, 
  onTemplateFilter, 
  activeTemplateFilter 
}: TemplateDistributionProps) => {
  // Group files by template
  const templateStats: TemplateStats[] = generatedPDFs.reduce((acc, pdf) => {
    const existingTemplate = acc.find(t => t.templateId === pdf.template_id);
    
    if (existingTemplate) {
      existingTemplate.fileCount++;
      existingTemplate.totalSize += pdf.file_size || 0;
      existingTemplate.files.push(pdf);
      
      // Update last generated if this file is more recent
      if (new Date(pdf.generated_date) > new Date(existingTemplate.lastGenerated)) {
        existingTemplate.lastGenerated = pdf.generated_date;
      }
    } else {
      acc.push({
        templateId: pdf.template_id,
        templateName: pdf.template_name || 'Unknown Template',
        fileCount: 1,
        totalSize: pdf.file_size || 0,
        lastGenerated: pdf.generated_date,
        files: [pdf]
      });
    }
    
    return acc;
  }, [] as TemplateStats[]);

  // Sort by file count (most used first)
  const sortedTemplates = templateStats.sort((a, b) => b.fileCount - a.fileCount);

  if (sortedTemplates.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-gray-900">
            Template Usage Distribution
          </CardTitle>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          See how many files you've generated from each template
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map((template) => (
            <Card 
              key={template.templateId} 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer border ${
                activeTemplateFilter === template.templateId 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onTemplateFilter(
                activeTemplateFilter === template.templateId ? null : template.templateId
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm">
                        {template.templateName}
                      </h3>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="ml-2 bg-blue-100 text-blue-700 border-blue-200"
                    >
                      {template.fileCount} files
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-3 w-3 mr-1.5 text-green-500" />
                      <span>Total size: {formatFileSize(template.totalSize)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-3 w-3 mr-1.5 text-purple-500" />
                      <span>
                        Last used: {formatDistanceToNow(new Date(template.lastGenerated), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar showing relative usage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Usage frequency</span>
                      <span>{Math.round((template.fileCount / generatedPDFs.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(template.fileCount / Math.max(...sortedTemplates.map(t => t.fileCount))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={activeTemplateFilter === template.templateId ? "default" : "outline"}
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplateFilter(
                        activeTemplateFilter === template.templateId ? null : template.templateId
                      );
                    }}
                  >
                    {activeTemplateFilter === template.templateId ? "Show All Files" : "Filter Files"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {activeTemplateFilter && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Filtering by: {sortedTemplates.find(t => t.templateId === activeTemplateFilter)?.templateName}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTemplateFilter(null)}
                className="text-xs"
              >
                Clear Filter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
