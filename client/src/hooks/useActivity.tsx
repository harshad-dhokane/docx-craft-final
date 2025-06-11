
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user,
  });

  const logActivityMutation = useMutation({
    mutationFn: async ({ 
      action, 
      resource_type, 
      resource_id, 
      metadata 
    }: {
      action: string;
      resource_type?: string;
      resource_id?: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action,
          resource_type: resource_type || null,
          resource_id: resource_id || null,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs', user?.id] });
    },
  });

  return {
    activities,
    isLoading,
    logActivity: logActivityMutation.mutate,
    isLogging: logActivityMutation.isPending,
  };
}
