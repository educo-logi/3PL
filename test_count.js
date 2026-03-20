import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// .env 파일 파싱
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
    const { count: pageViewsCount, error: err1 } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true });

    const { count: paymentCount, error: err2 } = await supabase
      .from('payment_history')
      .select('*', { count: 'exact', head: true });

    console.log('--- Supabase Row Count ---');
    console.log(`page_views: ${pageViewsCount} rows`);
    console.log(`payment_history: ${paymentCount} rows`);
    if (err1) console.error('page_views error:', err1.message);
    if (err2) console.error('payment_history error:', err2.message);

  } catch (e) {
    console.error('Test Error:', e);
  }
}

check();
