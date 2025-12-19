import { createClient } from '@supabase/supabase-js';

// 반드시 환경 변수로만 주입되도록 강제
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL/Anon Key가 설정되지 않았습니다. .env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정하세요.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

