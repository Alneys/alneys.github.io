import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DATA_FILE = resolve(import.meta.dirname, '../.temp/bundle-stats.json');
const PROJECT_ROOT = resolve(import.meta.dirname, '..');

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

/**
 * Extract the real package name from a path:
 *   .pnpm/echarts@6.1.0/node_modules/echarts/lib/... -> echarts
 *   node_modules/@vue/runtime-core/dist/... -> @vue/runtime-core
 */
function pkgNameFromPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const pnpmMatch = normalized.match(/\.pnpm\/[^/]+\/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  if (pnpmMatch) return pnpmMatch[1];
  const plainMatch = normalized.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  if (plainMatch) return plainMatch[1];
  return 'unknown';
}

function collectLeaves(node, parts, prefix = '') {
  const results = [];
  const fullName = prefix ? `${prefix}/${node.name}` : node.name;
  if (node.children) {
    for (const child of node.children) {
      results.push(...collectLeaves(child, parts, fullName));
    }
  }
  if (node.uid && parts[node.uid]) {
    results.push({ name: fullName, ...parts[node.uid] });
  }
  return results;
}

function isFromNodeModules(modulePath) {
  return modulePath.includes('node_modules');
}

/**
 * Shorten a full visualizer tree path for display:
 *   root/assets/xxx.js/C:/.../node_modules/pkg/file.js
 *   -> node_modules/pkg/file.js  (or src/views/... for source files)
 */
function shortName(modulePath) {
  const normalized = modulePath.replace(/\\/g, '/');
  // Strip the visualizer tree prefix (root/assets/chunk-name/)
  const afterPrefix = normalized.replace(/^root\/(?:assets\/[^/]+\/)?/, '');
  // Make relative to project root if it's an absolute path
  const root = PROJECT_ROOT.replace(/\\/g, '/');
  if (afterPrefix.startsWith(root)) {
    return afterPrefix.slice(root.length + 1);
  }
  return afterPrefix;
}

let data;
try {
  data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
} catch {
  console.error(`Error: cannot read ${DATA_FILE}. Run \`ANALYZE_JSON=true pnpm build\` first.`);
  process.exit(1);
}

const { tree, nodeParts } = data;
const leaves = collectLeaves(tree, nodeParts);

const total = leaves.reduce((s, m) => s + (m.gzipLength || 0), 0);
const totalBrotli = leaves.reduce((s, m) => s + (m.brotliLength || 0), 0);

leaves.sort((a, b) => (b.gzipLength || 0) - (a.gzipLength || 0));

const depLeaves = leaves.filter((m) => isFromNodeModules(m.name));
const srcLeaves = leaves.filter((m) => !isFromNodeModules(m.name));
const depSize = depLeaves.reduce((s, m) => s + (m.gzipLength || 0), 0);
const srcSize = srcLeaves.reduce((s, m) => s + (m.gzipLength || 0), 0);

// Aggregate by real npm package name
const depPackages = {};
for (const m of depLeaves) {
  const pkg = pkgNameFromPath(m.name);
  depPackages[pkg] = (depPackages[pkg] || 0) + (m.gzipLength || 0);
}

const topDeps = Object.entries(depPackages)
  .sort((a, b) => b[1] - a[1]);

// Aggregate by output chunk
const chunkSizes = {};
for (const m of leaves) {
  const chunkMatch = m.name.match(/\/assets\/([^/]+)\//);
  const chunk = chunkMatch ? chunkMatch[1] : 'other';
  chunkSizes[chunk] = (chunkSizes[chunk] || 0) + (m.gzipLength || 0);
}
const topChunks = Object.entries(chunkSizes).sort((a, b) => b[1] - a[1]);

// --- output ---
console.log('# Bundle Analysis Report\n');
console.log(`| Metric | Value |`);
console.log(`|--------|-------|`);
console.log(`| Total modules | ${leaves.length} |`);
console.log(`| Total size (gzip) | ${formatSize(total)} |`);
if (totalBrotli) console.log(`| Brotli size | ${formatSize(totalBrotli)} |`);

console.log(`\n## Size by Category\n`);
console.log(`| Category | Size | Share |`);
console.log(`|----------|------|-------|`);
console.log(`| node_modules | ${formatSize(depSize)} | ${(depSize / total * 100).toFixed(1)}% |`);
console.log(`| src | ${formatSize(srcSize)} | ${(srcSize / total * 100).toFixed(1)}% |`);

console.log(`\n## Top 10 Largest Modules\n`);
console.log(`| Size | Share | Path |`);
console.log(`|------|-------|------|`);
for (const m of leaves.slice(0, 10)) {
  const gzipSize = m.gzipLength || 0;
  const pct = (gzipSize / total * 100).toFixed(1);
  console.log(`| ${formatSize(gzipSize).padStart(8)} | ${pct.padStart(5)}% | ${shortName(m.name)} |`);
}

console.log(`\n## Dependencies by Package\n`);
console.log(`| Package | Size | Share of deps |`);
console.log(`|---------|------|--------------|`);
for (const [pkg, size] of topDeps) {
  const pct = (size / depSize * 100).toFixed(1);
  console.log(`| ${pkg} | ${formatSize(size)} | ${pct}% |`);
}

console.log(`\n## Output Chunks\n`);
console.log(`| Chunk | Size | Share |`);
console.log(`|-------|------|-------|`);
for (const [chunk, size] of topChunks) {
  const pct = (size / total * 100).toFixed(1);
  console.log(`| ${chunk} | ${formatSize(size)} | ${pct}% |`);
}
