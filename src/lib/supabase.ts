import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fldcouaymmbbiugexvwj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZGNvdWF5bW1iYml1Z2V4dndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTAzNzQsImV4cCI6MjEwNjg2NjM3NH0.D06Taj77gdbQP1VBtqOdAUhJ_E9o1XziinMMqTsKy2I';

// 클라이언트 & 공용 Supabase 인스턴스
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버사이드 Supabase 인스턴스
export const getSupabaseServer = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
};
