import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedPDF {
  id: string;
  name: string;
  file_path: string;
  pdf_path?: string;
  template_id: string;
  generated_date: string;
  file_size: number | null;
  placeholder_data: Record<string, string | number | boolean | null>;
  template_name?: string;
}

type DownloadError = {
  message: string;
  code?: string;
  details?: string;
};

export function useGeneratedPDFs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: generatedPDFs = [], isLoading } = useQuery({
    queryKey: ['generated_pdfs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('generated_pdfs')
        .select(`
          *,
          templates!inner(name)
        `)
        .eq('user_id', user.id)
        .order('generated_date', { ascending: false });

      if (error) throw error;
      
      return data.map(pdf => ({
        ...pdf,
        template_name: pdf.templates?.name || 'Unknown Template'
      })) as GeneratedPDF[];
    },
    enabled: !!user,
  });

  const downloadPDF = async (pdfId: string, type: 'excel' | 'docx' | 'pdf' = 'pdf') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to download files.",
        variant: "destructive",
      });
      return;
    }

    const pdf = generatedPDFs.find(p => p.id === pdfId);
    if (!pdf) {
      toast({
        title: "File Not Found",
        description: "The requested file could not be found.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determine which file path to use based on type
      let filePath = pdf.file_path;
      let fileName = pdf.name;
      
      if (type === 'pdf' && pdf.pdf_path) {
        filePath = pdf.pdf_path;
        fileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      } else if (type === 'excel') {
        fileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      } else if (type === 'docx') {
        fileName = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
      }

      const { data, error } = await supabase.storage
        .from('generated_pdfs')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Your ${type.toUpperCase()} file is being downloaded.`,
      });
    } catch (error) {
      const downloadError = error as DownloadError;
      toast({
        title: "Download Failed",
        description: downloadError.message || "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (pdfId: string) => {
      if (!user) throw new Error('User not authenticated');

      const pdf = generatedPDFs.find(p => p.id === pdfId);
      if (pdf) {
        // Delete from storage
        await supabase.storage
          .from('generated_pdfs')
          .remove([pdf.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('generated_pdfs')
        .delete()
        .eq('id', pdfId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated_pdfs', user?.id] });
      toast({
        title: "PDF Deleted",
        description: "PDF has been deleted successfully.",
      });
    },
    onError: (error: Error | DownloadError) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    generatedPDFs,
    isLoading,
    downloadPDF,
    deletePDF: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
