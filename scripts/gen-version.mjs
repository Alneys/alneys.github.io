import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const now = new Date();
const buildId = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);

const payload = {
  buildId,
  publishedAt: now.toISOString(),
};

const versionJsonPath = path.join(distDir, 'version.json');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(distDir)) {
  console.error('[gen-version] dist directory not found, run vite build first');
  process.exitCode = 1;
} else {
  fs.writeFileSync(versionJsonPath, JSON.stringify(payload, null, 2) + '\n');

  const versionScript = `<script>window.__APP_VERSION__=${JSON.stringify(payload)};</script>`;
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  if (!indexHtml.includes('__APP_VERSION__')) {
    indexHtml = indexHtml.replace('</head>', `${versionScript}\n  </head>`);
    fs.writeFileSync(indexHtmlPath, indexHtml);
  }

  console.log(`[gen-version] buildId=${buildId}`);
}