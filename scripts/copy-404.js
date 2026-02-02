import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');
const notFoundPath = join(distDir, '404.html');

const redirectScript = `
<script>
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    const params = new URLSearchParams(search);
    if (!params.has('redirect')) {
        window.location.href = '/?redirect=' + encodeURIComponent(path + search) + hash;
    }
</script>
`;

if (existsSync(indexPath)) {
    let content = readFileSync(indexPath, 'utf-8');
    // Inject script before </head>
    content = content.replace('</head>', `${redirectScript}</head>`);

    writeFileSync(notFoundPath, content);
    console.log('✓ 404.html created with redirection script');
} else {
    console.error('✗ index.html not found in dist directory');
    process.exit(1);
}
