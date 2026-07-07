import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://vtdslsebbyqtvqpaoxke.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZHNsc2ViYnlxdHZxcGFveGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTM1MTUsImV4cCI6MjA5ODkyOTUxNX0.kYHjOpQHw5_X30wg8yD-wCyiog_QZaOXAg4gO1D-b3k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
