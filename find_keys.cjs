const fs = require('fs');
const path = require('path');

const distDir = 'c:\\cai\\01_3pl\\dist\\assets';
const liveKey = 'live_ck_d46qopOB89zKkYkvjwWE3ZmM75y0';
const testKey = 'test_ck_ZLKGPx4M3MGk5NPWgyaRrBaWypv1';

console.log(`Searching for keys in ${distDir}...`);

try {
  const files = fs.readdirSync(distDir);
  let foundLive = false;
  let foundTest = false;

  for (const file of files) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(distDir, file), 'utf8');
      if (content.includes(liveKey)) {
        console.log(`✅ Found LIVE Key in: ${file}`);
        foundLive = true;
      }
      if (content.includes(testKey)) {
        console.log(`⚠️ Found TEST Key in: ${file}`);
        foundTest = true;
      }
      if (content.includes('test_ck_')) {
         console.log(`🔍 Found 'test_ck_' in: ${file}`);
      }
      if (content.includes('live_ck_')) {
         console.log(`🔍 Found 'live_ck_' in: ${file}`);
      }
    }
  }

  if (!foundLive && !foundTest) {
    console.log('❌ Neither key found in any dist JS files.');
  }
} catch (err) {
  console.error('Error reading dist directory:', err);
}
