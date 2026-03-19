import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('warehouses').select('*');
  console.log('--- Warehouses ---');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));

  const { data: cData, error: cError } = await supabase.from('customers').select('*');
  console.log('--- Customers ---');
  if (cError) console.error(cError);
  else console.log(JSON.stringify(cData, null, 2));
}

test();
