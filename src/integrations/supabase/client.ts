
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://buodncdyidpsasjhkfsn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1b2RuY2R5aWRwc2FzamhrZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MDQwMjksImV4cCI6MjA1NzI4MDAyOX0.dPtQva7_NO6ty01uqtjl0ybhtalaDfFhgkouZH7a4hM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
