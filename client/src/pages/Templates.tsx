
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Upload, FileText, Trash2, Eye, Plus, Activity, Users, Clock, FileSpreadsheet, Filter, Search, Grid3X3, List } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import UploadTemplateDialog from "@/components/UploadTemplateDialog";

const Templates = () => {
  const [filter, setFilter] = useState<"all" | "docx" | "xlsx">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const templatesPerPage = 6;
  
  const { templates, isLoading, deleteTemplate } = useTemplates();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGeneratePDF = (templateId: string) => {
    setLocation(`/templates/${templateId}/generate`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    // Apply type filter
    if (filter !== "all") {
      filtered = filtered.filter(template => {
        if (filter === "docx") return template.name.endsWith('.docx');
        if (filter === "xlsx") return template.name.endsWith('.xlsx');
        return true;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [templates, filter, searchQuery]);

  // Paginate filtered templates
  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + templatesPerPage);

  // Reset to page 1 when filter or search changes
  const handleFilterChange = (newFilter: "all" | "docx" | "xlsx") => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Categorize templates by file type
  const docxTemplates = templates.filter(t => t.name.endsWith('.docx'));
  const excelTemplates = templates.filter(t => t.name.endsWith('.xlsx'));

  const stats = [
    {
      title: "Total Templates",
      value: templates.length.toString(),
      description: "Active templates",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Word Documents",
      value: docxTemplates.length.toString(),
      description: "DOCX files",
      icon: FileText,
      color: "bg-green-500",
    },
    {
      title: "Excel Sheets",
      value: excelTemplates.length.toString(),
      description: "XLSX files",
      icon: FileSpreadsheet,
      color: "bg-purple-500",
    },
  ];

  const TemplateCard = ({ template }: { template: any }) => {
    // Properly handle placeholders as Json type
    const placeholders = Array.isArray(template.placeholders) ? template.placeholders : [];
    const stringPlaceholders = placeholders.filter((p): p is string => typeof p === 'string');

    return (
      <Card key={template.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <span className="truncate text-gray-800">{template.name}</span>
            {template.name.endsWith('.xlsx') ? (
              <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Uploaded {new Date(template.upload_date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Activity className="h-4 w-4 mr-2 text-green-500" />
              <span>Used {template.use_count || 0} times</span>
            </div>
            <div className="flex items-center text-gray-600">
              {template.name.endsWith('.xlsx') ? (
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
              )}
              <span>{template.file_size ? (template.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</span>
            </div>
          </div>
          
          {stringPlaceholders.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Placeholders:</p>
              <div className="flex flex-wrap gap-1">
                {stringPlaceholders.slice(0, 3).map((placeholder: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {placeholder}
                  </Badge>
                ))}
                {stringPlaceholders.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{stringPlaceholders.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button
              onClick={() => handleGeneratePDF(template.id)}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              Generate
            </Button>
            <Button
              onClick={() => handleDeleteTemplate(template.id)}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TemplateListItem = ({ template }: { template: any }) => {
    // Properly handle placeholders as Json type
    const placeholders = Array.isArray(template.placeholders) ? template.placeholders : [];
    const stringPlaceholders = placeholders.filter((p): p is string => typeof p === 'string');

    return (
      <Card key={template.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                {template.name.endsWith('.xlsx') ? (
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                ) : (
                  <FileText className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded {new Date(template.upload_date).toLocaleDateString()} • Used {template.use_count || 0} times
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {stringPlaceholders.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stringPlaceholders.length} placeholders
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {template.file_size ? (template.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button
                onClick={() => handleGeneratePDF(template.id)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-4 w-4 mr-1" />
                Generate
              </Button>
              <Button
                onClick={() => handleDeleteTemplate(template.id)}
                variant="outline"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Templates</h1>
          <p className="text-gray-600 text-sm lg:text-base">Create and manage your document templates for PDF generation.</p>
        </div>
        <UploadTemplateDialog>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg px-6 py-3 text-base">
            <Plus className="h-5 w-5 mr-2" />
            Upload New Template
          </Button>
        </UploadTemplateDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 ${stat.color} rounded-lg`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search, Filter and View Controls */}
      {templates.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <Label htmlFor="filter" className="text-sm font-medium text-gray-700">Filter:</Label>
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    <SelectItem value="docx">Word Documents</SelectItem>
                    <SelectItem value="xlsx">Excel Spreadsheets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + templatesPerPage, filteredTemplates.length)} of {filteredTemplates.length} templates
            </span>
            {totalPages > 1 && (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </div>
        </div>
      )}

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12 lg:py-16">
            <div className="mb-4">
              <FileText className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No matching templates found" : 
               filter === "all" ? "No templates yet" : `No ${filter.toUpperCase()} templates found`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery ? `No templates match "${searchQuery}". Try a different search term.` :
               filter === "all" 
                ? "Upload your first DOCX or XLSX template to get started with creating beautiful documents"
                : `Try uploading a ${filter.toUpperCase()} file or change the filter to see other templates`
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mr-4"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {viewMode === "grid" ? (
            <div className="grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {paginatedTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedTemplates.map((template) => (
                <TemplateListItem key={template.id} template={template} />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(prev => prev - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Templates;
