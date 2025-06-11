
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, Plus, Calendar, Trash2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTemplates } from "@/hooks/useTemplates";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { Link } from "wouter";
import UploadTemplateDialog from "@/components/UploadTemplateDialog";

const Dashboard = () => {
  const { templates, isLoading: templatesLoading } = useTemplates();
  const { generatedPDFs, isLoading: pdfsLoading, downloadPDF, deletePDF } = useGeneratedPDFs();

  const handleUseTemplate = (templateId: string) => {
    window.location.href = `/templates/${templateId}/generate`;
  };

  const handleDownloadPDF = (pdfId: string) => {
    downloadPDF(pdfId, 'pdf');
  };

  if (templatesLoading || pdfsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalUsage = templates.reduce((sum, t) => sum + t.use_count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-base lg:text-lg text-gray-600">Manage your templates and generated documents</p>
          </div>
          <UploadTemplateDialog>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg px-6 py-3 text-base"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload New Template
            </Button>
          </UploadTemplateDialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Templates</p>
                  <p className="text-2xl lg:text-3xl font-bold">{templates.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FileText className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Generated PDFs</p>
                  <p className="text-2xl lg:text-3xl font-bold">{generatedPDFs.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Download className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Usage</p>
                  <p className="text-2xl lg:text-3xl font-bold">{totalUsage}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl lg:text-3xl font-bold">98%</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Upload className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Templates Section */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Your Templates
              </CardTitle>
              <CardDescription className="text-sm lg:text-base">
                Manage and use your uploaded document templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                  <p className="text-sm lg:text-base text-gray-500 mb-4">Upload your first template to get started</p>
                  <UploadTemplateDialog>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Template
                    </Button>
                  </UploadTemplateDialog>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {templates.slice(0, 5).map((template) => {
                    // Safely get placeholders count with proper type checking
                    const placeholdersCount = Array.isArray(template.placeholders) ? template.placeholders.length : 0;
                    
                    return (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm lg:text-base">{template.name}</h3>
                            <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                              <span>Used {template.use_count} times</span>
                              <span>•</span>
                              <span>{placeholdersCount} fields</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Use
                        </Button>
                      </div>
                    );
                  })}
                  {templates.length > 5 && (
                    <div className="text-center pt-2">
                      <Link to="/templates">
                        <Button variant="ghost" size="sm">
                          View all {templates.length} templates
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated PDFs Section */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl text-gray-900 flex items-center">
                <Download className="h-5 w-5 mr-2 text-green-600" />
                Recent PDFs
              </CardTitle>
              <CardDescription className="text-sm lg:text-base">
                Download and manage your generated documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedPDFs.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Download className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No PDFs generated</h3>
                  <p className="text-sm lg:text-base text-gray-500">Use a template to generate your first PDF</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generatedPDFs.slice(0, 5).map((pdf) => (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <FileText className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm lg:text-base">{pdf.name}</h3>
                          <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                            <span>{new Date(pdf.generated_date).toLocaleDateString()}</span>
                            {pdf.file_size && (
                              <>
                                <span>•</span>
                                <span>{Math.round(pdf.file_size / 1024)} KB</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(pdf.id)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePDF(pdf.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {generatedPDFs.length > 5 && (
                    <div className="text-center pt-2">
                      <Link to="/generated-pdfs">
                        <Button variant="ghost" size="sm">
                          View all {generatedPDFs.length} PDFs
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
