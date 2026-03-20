import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qwiwotodwfgkpdasdhhl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXdvdG9kd2Zna3BkYXNkaGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQ2MzUsImV4cCI6MjA4NjA1MDYzNX0.f01U1AB6kH_73p4BUkUHWhqIT0UwYUvAmWmyvhElIXQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});