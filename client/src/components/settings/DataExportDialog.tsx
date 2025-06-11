import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Download, FileText, Database, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DataExportDialogProps {
  children: React.ReactNode;
}

export const DataExportDialog = ({ children }: DataExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const exportUserData = async () => {
    if (!user) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    try {
      const exportData: any = {
        user_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        exported_at: new Date().toISOString(),
      };

      // Export profile data
      setExportProgress(20);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        exportData.profile = profile;
      }

      // Export templates
      setExportProgress(40);
      const { data: templates } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id);
      
      exportData.templates = templates || [];

      // Export generated PDFs
      setExportProgress(60);
      const { data: generatedPdfs } = await supabase
        .from('generated_pdfs')
        .select('*')
        .eq('user_id', user.id);
      
      exportData.generated_pdfs = generatedPdfs || [];

      // Export activity logs
      setExportProgress(80);
      const { data: activityLogs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id);
      
      exportData.activity_logs = activityLogs || [];

      setExportProgress(100);

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      });

      setTimeout(() => {
        setOpen(false);
        setExportComplete(false);
        setExportProgress(0);
      }, 2000);

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export your data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Export All Data</span>
          </DialogTitle>
          <DialogDescription>
            Download all your data including templates, generated documents, and activity logs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isExporting && !exportComplete && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">What will be exported:</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Profile information</li>
                    <li>• All templates</li>
                    <li>• Generated documents</li>
                    <li>• Activity history</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Your data will be downloaded as a JSON file that you can save and use as needed.
              </p>
            </div>
          )}

          {isExporting && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="font-medium">Exporting your data...</p>
                <p className="text-sm text-gray-600">Please wait while we prepare your data.</p>
              </div>
              <Progress value={exportProgress} className="w-full" />
              <p className="text-sm text-center text-gray-500">{exportProgress}% complete</p>
            </div>
          )}

          {exportComplete && (
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <p className="font-medium text-green-900">Export Complete!</p>
              <p className="text-sm text-gray-600">Your data has been downloaded successfully.</p>
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={exportUserData} 
            disabled={isExporting || exportComplete}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};