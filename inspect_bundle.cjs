const fs = require('fs');
const path = require('path');

const file = 'c:\\cai\\01_3pl\\dist\\assets\\index-e5f74397.js';

try {
  const content = fs.readFileSync(file, 'utf8');
  const index = content.indexOf('pgProvider');
  
  if (index !== -1) {
    console.log('--- pgProvider found ---');
    console.log(content.substring(index - 200, index + 200));
  } else {
    console.log('❌ pgProvider not found in bundle.');
  }

  // Also search for the live key just in case
  const liveKey = 'live_ck_d46qopOB89zKkYkvjwWE3ZmM75y0';
  if (content.includes(liveKey)) {
    console.log('✅ Found live key in content!');
  } else {
    console.log('❌ Live key NOT found in content.');
  }

} catch (err) {
  console.error(err);
}
