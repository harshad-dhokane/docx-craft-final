import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useUserSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const setupNewUser = async () => {
      if (!user) return;

      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Create profile for new user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't show error to user as this might happen on every login attempt
          } else {
            console.log('Profile created successfully for user:', user.id);
          }
        }

        // Log user login activity
        const { error: activityError } = await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'user_login',
            resource_type: 'auth',
            resource_id: user.id,
            metadata: {
              email: user.email,
              login_time: new Date().toISOString(),
              user_agent: navigator.userAgent,
            },
          });

        if (activityError) {
          console.error('Error logging activity:', activityError);
        }

      } catch (error) {
        console.error('Error in user setup:', error);
      }
    };

    setupNewUser();
  }, [user]);

  return { user };
};