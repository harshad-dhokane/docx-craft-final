import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncProfiles() {
  console.log('Syncing user profiles...');

  try {
    // Get all users using the admin API
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users.users.length} users`);

    // For each user, check if they have a profile and create one if they don't
    for (const user of users.users) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        console.log(`Creating profile for user ${user.email}`);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: user.user_metadata?.full_name || user.email,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error creating profile for ${user.email}:`, insertError.message);
        } else {
          // Create activity log for the sync
          await supabase
            .from('activity_logs')
            .insert({
              user_id: user.id,
              action: 'profile_synced',
              resource_type: 'auth',
              resource_id: user.id,
              metadata: {
                email: user.email,
                synced_at: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            });
        }
      }
    }

    console.log('Profile sync completed!');
  } catch (error) {
    console.error('Error syncing profiles:', error);
    process.exit(1);
  }
}

syncProfiles(); 