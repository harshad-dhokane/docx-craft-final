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

async function setupStorage() {
  console.log('Setting up storage buckets...');

  // All allowed MIME types for docx, xlsx, pdf, images
  const allowedDocTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'        // XLSX
  ];
  const allowedImageTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp'
  ];

  // Create templates bucket
  const { error: templatesError } = await supabase
    .storage
    .createBucket('templates', {
      public: false,
      allowedMimeTypes: allowedDocTypes,
      fileSizeLimit: 20971520 // 20MB
    });
  if (templatesError && !templatesError.message.includes('already exists')) {
    console.error('Error creating templates bucket:', templatesError.message);
  } else {
    console.log('Templates bucket ready');
  }

  // Create generated_pdfs bucket
  const { error: pdfsError } = await supabase
    .storage
    .createBucket('generated_pdfs', {
      public: false,
      allowedMimeTypes: allowedDocTypes,
      fileSizeLimit: 20971520 // 20MB
    });
  if (pdfsError && !pdfsError.message.includes('already exists')) {
    console.error('Error creating generated_pdfs bucket:', pdfsError.message);
  } else {
    console.log('Generated PDFs bucket ready');
  }

  // Create profile-images bucket for avatars
  const { error: avatarsError } = await supabase
    .storage
    .createBucket('profile-images', {
      public: true,
      allowedMimeTypes: allowedImageTypes,
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    });
  if (avatarsError && !avatarsError.message.includes('already exists')) {
    console.error('Error creating profile-images bucket:', avatarsError.message);
  } else {
    console.log('Profile-images bucket ready');
    
    // Update bucket public access and CORS settings
    const { error: updateError } = await supabase
      .storage
      .updateBucket('profile-images', {
        public: true,
        allowedMimeTypes: allowedImageTypes,
        fileSizeLimit: 5 * 1024 * 1024
      });
    
    if (updateError) {
      console.error('Error updating profile-images bucket:', updateError.message);
    } else {
      console.log('Profile-images bucket updated successfully');
    }
  }

  console.log('Storage setup completed!');
}

setupStorage(); 