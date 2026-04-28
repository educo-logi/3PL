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
  const { data: cData, error: cError } = await supabase.from('customers').select('is_premium').limit(1);
  if (cError) {
    console.error('Customers is_premium check Error:', cError);
  } else {
    console.log('Customers is_premium column exists!');
  }
}
run();
