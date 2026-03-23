const fs = require('fs');
const path = require('path');

const distDir = 'c:\\cai\\01_3pl\\dist\\assets';
const searchString = '지영동';
const unicodeEscape = '\\uc9c0\\uc601\\ub3d9'; // 지영동

console.log(`Searching for '${searchString}' and '${unicodeEscape}' in ${distDir}...`);

try {
  const files = fs.readdirSync(distDir);
  let found = false;

  for (const file of files) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(distDir, file), 'utf8');
      if (content.includes(searchString) || content.includes(unicodeEscape)) {
        console.log(`✅ Found in file: ${file}`);
        found = true;
      }
    }
  }

  if (!found) {
    console.log('❌ Not found in any dist JS files.');
  }
} catch (err) {
  console.error('Error reading dist directory:', err);
}
