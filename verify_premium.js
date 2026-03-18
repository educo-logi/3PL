const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/cai/01_3pl/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: wData } = await supabase.from('warehouses').select('id, company_name, is_premium');
  const { data: cData } = await supabase.from('customers').select('id, company_name, is_premium');
  
  console.log("=== Warehouses ===");
  let wPremiumCount = 0;
  if (wData) {
    wData.forEach(w => {
      if (w.is_premium) wPremiumCount++;
      console.log(`[${w.is_premium ? 'PREMIUM' : 'Normal '}] ${w.company_name} (ID: ${w.id})`);
    });
  }
  console.log(`Total Premium Warehouses: ${wPremiumCount}`);
  
  console.log("\n=== Customers ===");
  let cPremiumCount = 0;
  if (cData) {
    cData.forEach(c => {
      if (c.is_premium) cPremiumCount++;
      console.log(`[${c.is_premium ? 'PREMIUM' : 'Normal '}] ${c.company_name} (ID: ${c.id})`);
    });
  }
  console.log(`Total Premium Customers: ${cPremiumCount}`);
}

check();
