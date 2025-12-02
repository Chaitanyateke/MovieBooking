import { createClient } from '@supabase/supabase-js';

// Get your Supabase URL and Key from your project settings
const supabaseUrl = 'https://jigasbnuuzfiymzdfeya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZ2FzYm51dXpmaXltemRmZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTM4MTYsImV4cCI6MjA3ODUyOTgxNn0.dEV4gCHHF9KT1dlfOB170S8wqrMKiJ8jis9pkdgnRvQ';

// Create and export the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
