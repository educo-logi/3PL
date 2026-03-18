const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkhudonnukctvrxreekk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHVkb25udWtjdHZyeHJlZWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNjU2MDQsImV4cCI6MjA4MDc0MTYwNH0.Gww86GWMJzasaiI3b0S33VOmpz3yjwe7XF0MLWc1nVw'
);

async function check() {
  const { data, error } = await supabase.from('premium_applications').select('*');
  console.log('--- premium_applications ---');
  if (error) console.error('ERROR:', error.message, error.code);
  else console.log('DATA COUNT:', data.length, 'ITEMS:', data);

  const { data: data2, error: error2 } = await supabase.from('payment_history').select('*');
  console.log('--- payment_history ---');
  if (error2) console.error('ERROR2:', error2.message);
  else console.log('DATA2 COUNT:', data2.length);
}

check();
