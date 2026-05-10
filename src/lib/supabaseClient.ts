import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export status for UI warnings
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing or using placeholders. ' +
    'The app will run in Demo/Mock mode. ' +
    'To fix this on Netlify, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your site settings.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
