import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  avatar_url: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ display_name, avatar_url }: { display_name?: string; avatar_url?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const updates = {
        id: user.id,
        display_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      try {
        // Delete existing avatar if any
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('profile-images')
          .list(user.id);

        if (listError) {
          console.error('Error listing existing files:', listError);
          throw listError;
        }

        if (existingFiles?.length) {
          const { error: removeError } = await supabase.storage
            .from('profile-images')
            .remove(existingFiles.map(f => `${user.id}/${f.name}`));

          if (removeError) {
            console.error('Error removing existing avatar:', removeError);
            throw removeError;
          }
        }

        // Upload new avatar with explicit content type and metadata
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: '3600',
            duplex: 'half'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL for the avatar
        const { data: publicUrl } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName, {
            download: false,
            transform: {
              width: 200,
              height: 200,
              resize: 'cover'
            }
          });

        if (!publicUrl?.publicUrl) {
          throw new Error('Failed to get public URL for avatar');
        }

        // Update profile with public URL
        const { data: profile, error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            avatar_url: publicUrl.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }

        return profile;
      } catch (error) {
        console.error('Avatar upload error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Avatar Updated",
        description: "Your profile image has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfileMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    isUploading: uploadAvatarMutation.isPending,
  };
}
