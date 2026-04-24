import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

export function versionCheckPlugin(): Plugin {
  return {
    name: 'version-check-plugin',
    enforce: 'post',
    closeBundle() {
      const rootDir = fileURLToPath(new URL('../../', import.meta.url));
      const distDir = path.resolve(rootDir, 'dist');
      const now = new Date();
      const buildId = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const payload = { buildId, publishedAt: now.toISOString() };

      const versionJsonPath = path.join(distDir, 'version.json');
      const indexHtmlPath = path.join(distDir, 'index.html');

      if (fs.existsSync(distDir)) {
        fs.writeFileSync(versionJsonPath, JSON.stringify(payload, null, 2) + '\n');
        let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
        if (!indexHtml.includes('__APP_VERSION__')) {
          indexHtml = indexHtml.replace(
            '</head>',
            `<script>window.__APP_VERSION__=${JSON.stringify(payload)};</script>\n  </head>`,
          );
          fs.writeFileSync(indexHtmlPath, indexHtml);
        }
        console.log(`[version-check-plugin] buildId=${buildId}`);
      }
    },
  };
}
