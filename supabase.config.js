// supabase.config.js
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://vivrrjuvflitikpzdffx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdnJyanV2ZmxpdGlrcHpkZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTA5MzIsImV4cCI6MjA2NTk4NjkzMn0._6kZY7bwIObunHRx203ki2xUIw6LvyyqydXL4V51Tp8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: require('@react-native-async-storage/async-storage').default,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase client initialized');