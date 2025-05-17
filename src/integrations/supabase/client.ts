
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://buodncdyidpsasjhkfsn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1b2RuY2R5aWRwc2FzamhrZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MDQwMjksImV4cCI6MjA1NzI4MDAyOX0.dPtQva7_NO6ty01uqtjl0ybhtalaDfFhgkouZH7a4hM";

// Configure the Supabase client with proper auth settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Create storage buckets if they don't exist
export const ensureStorageBuckets = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(bucket => bucket.name === 'resumes')) {
    await supabase.storage.createBucket('resumes', {
      public: false,
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
  }
};

// Initialize storage
ensureStorageBuckets().catch(console.error);
