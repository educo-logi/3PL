import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');
const notFoundPath = join(distDir, '404.html');

if (existsSync(indexPath)) {
    copyFileSync(indexPath, notFoundPath);
    console.log('✓ 404.html created successfully for SPA routing');
} else {
    console.error('✗ index.html not found in dist directory');
    process.exit(1);
}
