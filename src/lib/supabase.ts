import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Allow runtime override via localStorage for convenient testing/demo configuration
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('turnos_supabase_url') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('turnos_supabase_key') || '' : '';

export const supabaseUrl = storedUrl || envUrl;
export const supabaseAnonKey = storedKey || envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('placeholder')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Error initializing Supabase client:', err);
    supabase = null;
  }
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('turnos_supabase_url', url.trim());
      localStorage.setItem('turnos_supabase_key', key.trim());
    } else {
      localStorage.removeItem('turnos_supabase_url');
      localStorage.removeItem('turnos_supabase_key');
    }
    window.location.reload();
  }
}
