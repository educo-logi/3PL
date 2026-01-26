import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

// Simple .env parser
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
// Hide key in output for security, just show length
console.log('Key length:', supabaseAnonKey.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { count, error } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('Connection successful! Row count:', count);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
