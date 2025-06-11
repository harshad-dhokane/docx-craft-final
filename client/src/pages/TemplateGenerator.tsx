
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CompactFieldTypeSelector from "@/components/form/CompactFieldTypeSelector";
import { useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { generateEnhancedPDF } from "@/utils/enhancedPdfGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TemplateGenerator = () => {
  const [match, params] = useRoute("/templates/:templateId/generate");
  const [, setLocation] = useLocation();
  const templateId = params?.templateId;
  const { templates } = useTemplates();
  const { user } = useAuth();
  const { toast } = useToast();
  const [placeholderData, setPlaceholderData] = useState<Record<string, string>>({});
  const [pdfName, setPdfName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState<Record<string, boolean>>({});
  const [generatingFormat, setGeneratingFormat] = useState<'pdf' | 'docx' | 'xlsx' | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const template = templates.find(t => t.id === templateId);

  useEffect(() => {
    if (templates.length > 0) {
      setIsLoading(false);
    }
  }, [templates]);

  useEffect(() => {
    if (template) {
      // Initialize placeholder data - properly handle Json type
      const initialData: Record<string, string> = {};
      const placeholders = Array.isArray(template.placeholders) ? template.placeholders : [];
      placeholders.forEach((placeholder: any) => {
        if (typeof placeholder === 'string') {
          initialData[placeholder] = "";
        }
      });
      setPlaceholderData(initialData);
      
      // Set default PDF name
      setPdfName(`${template.name.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}`);
    }
  }, [template]);

  const handleInputChange = (placeholder: string, value: string) => {
    setPlaceholderData(prev => ({
      ...prev,
      [placeholder]: value
    }));
    // Clear any previous errors when user starts typing
    if (generationError) {
      setGenerationError(null);
    }
  };

  const handleGenerateDocument = async (format: 'pdf' | 'docx' | 'xlsx' = 'pdf') => {
    if (!template || !templateId || !user) return;

    // Clear previous errors and success states for other formats
    setGenerationError(null);
    setDownloadSuccess({}); // Clear all previous success states
    setGeneratingFormat(format);

    // Use a default document name if none is provided
    const documentName = pdfName.trim() || `${template.name.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}`;
    setPdfName(documentName);

    console.log('Starting document generation...', {
      templateId,
      templateName: template.name,
      format,
      placeholderData
    });

    try {
      // Convert Json placeholders to string array
      const placeholders = Array.isArray(template.placeholders) 
        ? template.placeholders.filter((p): p is string => typeof p === 'string')
        : [];

      await generateEnhancedPDF({
        templateId: templateId,
        templateName: template.name,
        placeholderData,
        placeholders,
        format,
        userId: user.id
      });

      setDownloadSuccess({ [format]: true }); // Only set success for this specific format
      toast({
        title: "Success",
        description: `Your ${format.toUpperCase()} document has been generated and downloaded successfully.`,
      });

      // Reset success state after 3 seconds
      setTimeout(() => {
        setDownloadSuccess({});
      }, 3000);

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate document';
      setGenerationError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGeneratingFormat(null);
    }
  };

  // Check if all required fields are filled - properly handle Json type
  const templatePlaceholders = Array.isArray(template?.placeholders) ? template.placeholders : [];
  const hasRequiredData = templatePlaceholders.some((placeholder: any) => 
    typeof placeholder === 'string' && placeholderData[placeholder]?.trim()
  );

  const isGenerating = generatingFormat !== null;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/templates")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !template ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Template Not Found</h3>
              <p className="text-muted-foreground text-center">
                The template you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => setLocation('/templates')}>
                View All Templates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Document: {template.name}
                </CardTitle>
                <CardDescription>
                  Fill in the required data and generate your customized document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Name Section */}
                <div className="space-y-2">
                  <Label htmlFor="pdfName" className="text-sm font-medium">Document Name</Label>
                  <Input
                    id="pdfName"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    placeholder="Enter document name"
                    className="h-11"
                  />
                </div>

                {/* Error Display */}
                {generationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {generationError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-3">
                  {template.name.endsWith('.xlsx') ? (
                    // Excel template - show both Excel and PDF buttons
                    <>
                      <Button
                        onClick={() => handleGenerateDocument('xlsx')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'xlsx' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.xlsx ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Excel
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleGenerateDocument('pdf')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        variant="secondary"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'pdf' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.pdf ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    // Word template - show DOCX and PDF buttons
                    <>
                      <Button
                        onClick={() => handleGenerateDocument('docx')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        variant="default"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'docx' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.docx ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate DOCX
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleGenerateDocument('pdf')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        variant="secondary"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'pdf' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.pdf ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {!hasRequiredData && (
                  <p className="text-sm text-muted-foreground">
                    Please fill in at least one field to generate the document.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Template Data Form */}
            {templatePlaceholders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Data</CardTitle>
                  <CardDescription>
                    Complete the fields below to populate your document ({templatePlaceholders.length} fields)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {templatePlaceholders.map((placeholder: any) => {
                      if (typeof placeholder === 'string') {
                        return (
                          <CompactFieldTypeSelector
                            key={placeholder}
                            placeholder={placeholder}
                            value={placeholderData[placeholder] || ""}
                            onChange={(value) => handleInputChange(placeholder, value)}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TemplateGenerator;
