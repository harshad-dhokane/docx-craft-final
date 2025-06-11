
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, FileSpreadsheet, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

interface UploadTemplateDialogProps {
  children: React.ReactNode;
}

const UploadTemplateDialog = ({ children }: UploadTemplateDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { uploadTemplate } = useTemplates();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.xlsx')
    )) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a .docx or .xlsx file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadLoading(true);
    try {
      await uploadTemplate(selectedFile);
      setSelectedFile(null);
      setOpen(false);
      // Reset file input
      const fileInput = document.getElementById('dialog-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      toast({
        title: "Success",
        description: "Template uploaded successfully!",
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.xlsx')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    return <FileText className="h-5 w-5 text-blue-600" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-800">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload New Template</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Upload a .docx or .xlsx file to create a new template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dialog-file-upload" className="text-sm font-medium text-gray-700">
              Select DOCX or XLSX File
            </Label>
            <Input
              id="dialog-file-upload"
              type="file"
              accept=".docx,.xlsx"
              onChange={handleFileSelect}
              className="mt-1 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                {getFileIcon(selectedFile.name)}
                <div>
                  <span className="text-sm font-medium text-gray-800">{selectedFile.name}</span>
                  <Badge variant="outline" className="ml-2 bg-white">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploadLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadTemplateDialog;
