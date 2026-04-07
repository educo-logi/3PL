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
  const { data, error } = await supabase.from('customers').select('premium_expires_at').limit(1);
  console.log('Customers premium_expires_at error:', error?.message);

  const { error: error2 } = await supabase.from('customers').select('premium_end_date').limit(1);
  console.log('Customers premium_end_date error:', error2?.message);

  const { error: error3 } = await supabase.from('customers').select('is_premium').limit(1);
  console.log('Customers is_premium error:', error3?.message);
  
  const { error: error4 } = await supabase.from('customers').select('detail_address').limit(1);
  console.log('Customers detail_address error:', error4?.message);

  const { error: error5 } = await supabase.from('customers').select('business_number').limit(1);
  console.log('Customers business_number error:', error5?.message);
}
run();
