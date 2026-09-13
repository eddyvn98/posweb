import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const includeExt = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html', '.md']);
const skipDirs = new Set(['node_modules', 'dist', '.git', 'playwright-report', 'test-results', 'backups']);
const skipFiles = new Set(['src/lib/mockData.js']);
const suspicious = [
  /Ã¡|Ã¢|Ã£|Ã¨|Ã©|Ãª|Ã¬|Ã­|Ã²|Ã³|Ã´|Ãµ|Ã¹|Ãº|Ã½|Ãđ|ÃĐ/g,
  /Â |Â¡|Â¢|Â£|Â¤|Â¥|Â¦|Â§|Â¨|Â©|Âª|Â«|Â¬|Â®|Â¯/g,
  /Ä‘|ÄĐ|áº|á»/g,
  /\uFFFD/g
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name), out);
      continue;
    }
    const full = path.join(dir, entry.name);
    if (includeExt.has(path.extname(full))) out.push(full);
  }
  return out;
}

const files = walk(path.join(root, 'src')).concat(walk(path.join(root, 'bot_backend')).filter(Boolean));
const hits = [];

for (const f of files) {
  const relativePath = path.relative(root, f).replace(/\\/g, '/');
  if (skipFiles.has(relativePath)) continue;
  
  const text = fs.readFileSync(f, 'utf8');
  const bad = suspicious.some((re) => re.test(text));
  if (bad) hits.push(relativePath);
}

if (hits.length) {
  console.error('Mojibake check failed. Suspicious files:');
  for (const f of hits) console.error(`- ${f}`);
  process.exit(1);
}

console.log('Mojibake check passed.');
