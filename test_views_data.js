import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const dotenv = fs.readFileSync(envPath, 'utf-8');
const env = {};
dotenv.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  try {
    const { data: pageViewsData, error } = await supabase
      .from('page_views')
      .select('page_path, viewed_at')
      .order('viewed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    console.log('--- page_views Table Rows (Top 10) ---');
    pageViewsData.forEach((row, i) => {
      console.log(`[${i+1}] Path: ${row.page_path} | Viewed At: ${row.viewed_at}`);
    });

  } catch (e) {
    console.error('Error:', e);
  }
}

check();
