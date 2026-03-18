const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zkhudonnukctvrxreekk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHVkb25udWtjdHZyeHJlZWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNjU2MDQsImV4cCI6MjA4MDc0MTYwNH0.Gww86GWMJzasaiI3b0S33VOmpz3yjwe7XF0MLWc1nVw';
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
