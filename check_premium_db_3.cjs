const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('AnonKey:', supabaseAnonKey ? 'Exists' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: list, error: err1 } = await supabase
      .from('warehouses')
      .select('id, company_name, is_premium, premium_end_date')
      .limit(3);
    
    if (err1) console.error('Select Error:', err1);
    
    console.log('--- Warehouses ---');
    console.log(JSON.stringify(list, null, 2));
    
    if (list && list.length > 0) {
      const target = list[0];
      const nextEnd = new Date();
      nextEnd.setDate(nextEnd.getDate() + 5);
      
      console.log(`Updating ${target.id} (${target.company_name}) is_premium = true...`);
      const { data: upResult, error: err2 } = await supabase
        .from('warehouses')
        .update({
          is_premium: true,
          premium_end_date: nextEnd.toISOString()
        })
        .eq('id', target.id)
        .select();
      
      if (err2) {
        console.error('Update Error:', err2);
      } else {
        console.log('Update Success:', JSON.stringify(upResult, null, 2));
      }
    } else {
      console.log('No warehouses found.');
    }
  } catch (e) {
    console.error('Fatal:', e);
  }
}

check();
