import { createClient } from '@supabase/supabase-js';

// We'll replace these with real environment variables later
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUB_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Key missing. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
