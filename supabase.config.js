// supabase.config.js
import { createClient } from '@supabase/supabase-js';
import config from './config.js';

// Replace with your actual Supabase project values
const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: require('@react-native-async-storage/async-storage').default,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase client initialized');