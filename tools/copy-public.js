import fs from 'node:fs';
import path from 'node:path';
const target = process.argv[2];
if (!target) { console.error('Usage: npm run copy-public -- C:\www\sukimart\public_html\assets\vendor\philippines-location-map-picker'); process.exit(1); }
const root = path.resolve(new URL('..', import.meta.url).pathname);
function copyDir(src, dest) { fs.mkdirSync(dest, { recursive: true }); for (const entry of fs.readdirSync(src, { withFileTypes: true })) { const from = path.join(src, entry.name); const to = path.join(dest, entry.name); if (entry.isDirectory()) copyDir(from, to); else fs.copyFileSync(from, to); } }
copyDir(path.join(root, 'dist'), path.join(target, 'dist'));
copyDir(path.join(root, 'data'), path.join(target, 'data'));
console.log(`Copied dist/ and data/ to ${target}`);
