import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Download, FileText, Trash2, Calendar, HardDrive, Activity, TrendingUp, Filter, Search, Grid3X3, List } from "lucide-react";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";
import { GeneratedPDF } from '@/hooks/useGeneratedPDFs';

// Helper functions
const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, index) * 100) / 100 + ' ' + sizes[index];
};

const getFileType = (fileName: string, filePath: string) => {
  const name = fileName.toLowerCase();
  const path = filePath.toLowerCase();
  
  if (name.includes("xlsx") || name.includes("excel") || path.includes("xlsx")) {
    return { type: "Excel", color: "bg-green-100 text-green-700", icon: "📊" };
  } else if (name.includes("docx") || name.includes("word") || path.includes("docx")) {
    return { type: "Word", color: "bg-blue-100 text-blue-700", icon: "📄" };
  } else {
    return { type: "PDF", color: "bg-red-100 text-red-700", icon: "📕" };
  }
};

const CreatedFiles = () => {
  const { generatedPDFs, isLoading, downloadPDF, deletePDF } = useGeneratedPDFs();
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const filesPerPage = 6; // Show 6 files per page

  // Get unique templates for dropdown
  const templates = useMemo(() => {
    const uniqueTemplates = generatedPDFs.reduce((acc, pdf) => {
      if (!acc.find(t => t.id === pdf.template_id)) {
        acc.push({
          id: pdf.template_id,
          name: pdf.template_name || 'Unknown Template'
        });
      }
      return acc;
    }, [] as { id: string; name: string }[]);
    return uniqueTemplates;
  }, [generatedPDFs]);

  // Filter and search files
  const filteredFiles = useMemo(() => {
    let filtered = generatedPDFs;
    
    // Apply template filter first
    if (templateFilter !== "all") {
      filtered = filtered.filter(pdf => pdf.template_id === templateFilter);
    }
    
    // Apply type filter
    if (fileTypeFilter !== "all") {
      filtered = filtered.filter(pdf => {
        const fileName = pdf.name.toLowerCase();
        const filePath = pdf.file_path.toLowerCase();
        switch (fileTypeFilter) {
          case "pdf":
            return fileName.includes("pdf") || filePath.includes("pdf");
          case "docx":
            return fileName.includes("docx") || fileName.includes("word") || filePath.includes("docx");
          case "excel":
            return fileName.includes("xlsx") || fileName.includes("excel") || filePath.includes("xlsx");
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(pdf =>
        pdf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pdf.template_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [generatedPDFs, fileTypeFilter, searchQuery, templateFilter]);

  // Paginate filtered files
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + filesPerPage);

  // Reset to page 1 when filter or search changes
  const handleFilterChange = (newFilter: string) => {
    setFileTypeFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTemplateFilterChange = (templateId: string) => {
    setTemplateFilter(templateId);
    setCurrentPage(1);
  };

  const totalSize = filteredFiles.reduce((acc, pdf) => acc + (pdf.file_size || 0), 0);
  const recentFiles = filteredFiles.filter(pdf => {
    const genDate = new Date(pdf.generated_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return genDate > weekAgo;
  }).length;

  // Get selected template info for display
  const selectedTemplate = templates.find(t => t.id === templateFilter);
  const selectedTemplateName = selectedTemplate?.name || 'All Templates';

  const stats = [
    {
      title: "Total Files",
      value: filteredFiles.length.toString(),
      description: templateFilter !== "all" ? `Files from ${selectedTemplateName}` : "Generated documents",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Storage Used",
      value: formatFileSize(totalSize),
      description: "Total file size",
      icon: HardDrive,
      color: "bg-green-500",
    },
    {
      title: "This Week",
      value: recentFiles.toString(),
      description: "Recently generated",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your created files...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Created Files</h1>
        <p className="text-gray-600 text-sm lg:text-base">View and manage all your generated documents and files.</p>
      </div>

      {/* Analytics Cards */}
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
      {generatedPDFs.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Template:</span>
                <Select value={templateFilter} onValueChange={handleTemplateFilterChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <Select value={fileTypeFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="pdf">PDF Files</SelectItem>
                    <SelectItem value="docx">Word Documents</SelectItem>
                    <SelectItem value="excel">Excel Files</SelectItem>
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
              Showing {startIndex + 1}-{Math.min(startIndex + filesPerPage, filteredFiles.length)} of {filteredFiles.length} files
              {templateFilter !== "all" && ` from ${selectedTemplateName}`}
            </span>
            {totalPages > 1 && (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </div>
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12 lg:py-16">
            <div className="mb-4">
              <FileText className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No matching files found" :
               templateFilter !== "all" ? `No files found for ${selectedTemplateName}` :
               fileTypeFilter === "all" ? "No Files Generated Yet" : `No ${fileTypeFilter.toUpperCase()} Files Found`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery ? `No files match "${searchQuery}". Try a different search term.` :
               templateFilter !== "all" ? `You haven't generated any files using ${selectedTemplateName} yet.` :
               fileTypeFilter === "all" 
                ? "You haven't generated any documents yet. Start by creating a document from one of your templates."
                : `You haven't generated any ${fileTypeFilter.toUpperCase()} files yet.`
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
            {templateFilter !== "all" && (
              <Button 
                variant="outline" 
                onClick={() => setTemplateFilter("all")}
                className="mr-4"
              >
                Show All Templates
              </Button>
            )}
            {fileTypeFilter !== "all" && (
              <Button 
                variant="outline" 
                onClick={() => setFileTypeFilter("all")}
                className="mr-4"
              >
                Show All Files
              </Button>
            )}
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/templates">Browse Templates</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {paginatedFiles.map((pdf) => (
                <FileCard key={pdf.id} pdf={pdf} downloadPDF={downloadPDF} deletePDF={deletePDF} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedFiles.map((pdf) => (
                <FileListItem key={pdf.id} pdf={pdf} downloadPDF={downloadPDF} deletePDF={deletePDF} />
              ))}
            </div>
          )}
          
          {/* Updated Pagination */}
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

interface FileComponentProps {
  pdf: GeneratedPDF;
  downloadPDF: (id: string, type?: 'excel' | 'docx' | 'pdf') => void;
  deletePDF: (id: string) => void;
}

const FileCard = ({ pdf, downloadPDF, deletePDF }: FileComponentProps) => {
  const fileType = getFileType(pdf.name, pdf.file_path);
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {pdf.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              From: {pdf.template_name}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <span className="text-lg">{fileType.icon}</span>
            <Badge className={`${fileType.color} border-0`}>
              {fileType.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(pdf.generated_date), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <HardDrive className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-sm text-gray-600">{formatFileSize(pdf.file_size)}</span>
          </div>
        </div>
         
        {pdf.placeholder_data && Object.keys(pdf.placeholder_data).length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-700 font-medium mb-2">Template Data:</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {Object.entries(pdf.placeholder_data).slice(0, 3).map(([key, value]) => (
                <div key={key} className="text-xs text-gray-600 bg-gray-50 rounded p-1">
                  <span className="font-medium">{key}:</span> {String(value).substring(0, 25)}
                  {String(value).length > 25 && '...'}
                </div>
              ))}
              {Object.keys(pdf.placeholder_data).length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{Object.keys(pdf.placeholder_data).length - 3} more fields
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <div className="flex gap-2">
            {fileType.type === 'Excel' ? (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => downloadPDF(pdf.id, 'excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                {pdf.pdf_path && (
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => downloadPDF(pdf.id, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </>
            ) : fileType.type === 'PDF' ? (
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => downloadPDF(pdf.id, 'pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            ) : fileType.type === 'Word' ? (
              <>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => downloadPDF(pdf.id, 'docx')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                {pdf.pdf_path && (
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => downloadPDF(pdf.id, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </>
            ) : null}
            <Button 
              size="sm" 
              variant="outline"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={() => deletePDF(pdf.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FileListItem = ({ pdf, downloadPDF, deletePDF }: FileComponentProps) => {
  const fileType = getFileType(pdf.name, pdf.file_path);
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{fileType.icon}</span>
              <Badge className={`${fileType.color} border-0`}>
                {fileType.type}
              </Badge>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{pdf.name}</h3>
              <p className="text-sm text-gray-500">
                From: {pdf.template_name} • {formatDistanceToNow(new Date(pdf.generated_date), { addSuffix: true })}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {formatFileSize(pdf.file_size)}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {fileType.type === 'Excel' ? (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => downloadPDF(pdf.id, 'excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                {pdf.pdf_path && (
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => downloadPDF(pdf.id, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </>
            ) : fileType.type === 'PDF' ? (
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => downloadPDF(pdf.id, 'pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            ) : fileType.type === 'Word' ? (
              <>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => downloadPDF(pdf.id, 'docx')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                {pdf.pdf_path && (
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => downloadPDF(pdf.id, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </>
            ) : null}
            <Button 
              size="sm" 
              variant="outline"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={() => deletePDF(pdf.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatedFiles;
