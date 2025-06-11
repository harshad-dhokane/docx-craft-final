
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfWeek, startOfMonth, subDays, format } from 'date-fns';

export function useAnalytics() {
  const { user } = useAuth();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get templates count
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('id, use_count, upload_date, name')
        .eq('user_id', user.id);

      if (templatesError) throw templatesError;

      // Get generated PDFs count
      const { data: generatedPDFs, error: pdfsError } = await supabase
        .from('generated_pdfs')
        .select('id, generated_date, file_size')
        .eq('user_id', user.id);

      if (pdfsError) throw pdfsError;

      // Get activity logs
      const { data: activityLogs, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activityError) throw activityError;

      // Calculate statistics
      const totalTemplates = templates.length;
      const totalPDFs = generatedPDFs.length;
      const totalUsage = templates.reduce((sum, t) => sum + (t.use_count || 0), 0);
      const totalStorage = generatedPDFs.reduce((sum, p) => sum + (p.file_size || 0), 0);

      // Weekly data for charts
      const now = new Date();
      const weeklyData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'MMM dd');
        const pdfsOnDate = generatedPDFs.filter(pdf => 
          format(new Date(pdf.generated_date), 'MMM dd') === dateStr
        ).length;
        
        weeklyData.push({
          date: dateStr,
          pdfs: pdfsOnDate,
        });
      }

      // Monthly template usage - use template name or fallback to ID
      const monthlyUsage = templates.map(template => ({
        name: template.name ? (template.name.length > 20 ? template.name.substring(0, 20) + '...' : template.name) : `Template ${template.id.substring(0, 8)}`,
        usage: template.use_count || 0,
      })).sort((a, b) => b.usage - a.usage).slice(0, 5);

      // Recent activity (last 7 days)
      const sevenDaysAgo = subDays(now, 7);
      const recentPDFs = generatedPDFs.filter(pdf => 
        new Date(pdf.generated_date) > sevenDaysAgo
      ).length;

      const recentTemplates = templates.filter(template => 
        new Date(template.upload_date) > sevenDaysAgo
      ).length;

      return {
        totalTemplates,
        totalPDFs,
        totalUsage,
        totalStorage,
        weeklyData,
        monthlyUsage,
        recentPDFs,
        recentTemplates,
        activityLogs: activityLogs.slice(0, 10), // Last 10 activities
      };
    },
    enabled: !!user,
  });

  return {
    analyticsData,
    isLoading,
  };
}
