import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0]] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  const w = await supabase.from('warehouses').select('*').limit(1);
  console.log('Warehouses Columns:', Object.keys(w.data[0] || {}));

  const c = await supabase.from('customers').select('*').limit(1);
  console.log('Customers Columns:', Object.keys(c.data[0] || {}));
}
run();
