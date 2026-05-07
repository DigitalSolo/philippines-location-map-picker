import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'data', 'production-hardening-report.json');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function check(id, label, pass, message, details = {}) {
  return { id, label, pass: Boolean(pass), message, details };
}

const packageJson = JSON.parse(read('package.json'));
const demoHtml = read('demo/index.html');
const demoJs = read('demo/demo.js');
const mapPickerJs = read('src/MapPicker.js');
const locationPickerJs = read('src/LocationPicker.js');
const locationMapPickerJs = read('src/LocationMapPicker.js');
const readme = read('README.md');

const textFiles = walk(root).filter((filePath) => {
  const rel = relative(filePath);
  if (rel.startsWith('data/')) return false;
  if (rel.startsWith('dist/')) return false;
  if (rel.endsWith('.png') || rel.endsWith('.jpg') || rel.endsWith('.jpeg') || rel.endsWith('.webp')) return false;
  return /\.(js|ts|css|html|md|json)$/.test(filePath);
});

const cdnPattern = /https?:\/\/(?:[^\s'"`<>]*\.)?(?:unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|stackpath\.bootstrapcdn\.com|maxcdn\.bootstrapcdn\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\b/i;
const cdnHits = textFiles.flatMap((filePath) => {
  const text = fs.readFileSync(filePath, 'utf8');
  return cdnPattern.test(text) ? [relative(filePath)] : [];
});

const inlineHandlerPattern = /\son[a-z]+\s*=/i;
const inlineHandlerHits = textFiles.flatMap((filePath) => {
  const rel = relative(filePath);
  if (!/\.html$/.test(rel)) return [];
  const text = fs.readFileSync(filePath, 'utf8');
  return inlineHandlerPattern.test(text) ? [rel] : [];
});

const checks = [
  check(
    'no_runtime_dependencies',
    'No runtime npm dependencies',
    !packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0,
    packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0
      ? 'Runtime dependencies are present; the host may need additional package assets.'
      : 'Package has no runtime npm dependency list.'
  ),
  check(
    'no_cdn_asset_dependency',
    'No CDN asset dependency',
    cdnHits.length === 0,
    cdnHits.length === 0
      ? 'No known CDN asset URLs were found in package source, demo, docs, or package metadata.'
      : `Known CDN URL patterns found in: ${cdnHits.join(', ')}.`,
    { hits: cdnHits }
  ),
  check(
    'offline_default_tiles',
    'Offline map tile default',
    mapPickerJs.includes("this.tileUrlTemplate = options.tileUrlTemplate == null ? '' : String(options.tileUrlTemplate).trim();") && mapPickerJs.includes("if (!this.tileUrlTemplate)"),
    'Default map rendering does not call a remote tile server; hosts can explicitly provide local or remote tiles when wanted.'
  ),
  check(
    'static_mode_package_relative_data',
    'Static mode package-relative data',
    demoJs.includes('DEMO_DATA_BASE_URL') && demoJs.includes("new URL('./data', import.meta.url)") && !demoJs.includes("createStaticLocationProvider({ baseUrl: '/data' })"),
    'Demo static mode resolves data relative to the package so /assets/vendor/philippines-location-map-picker works.'
  ),
  check(
    'missing_static_failure_case',
    'Missing static files failure case',
    demoHtml.includes('missing-static-files') && demoJs.includes('MISSING_STATIC_DATA_BASE_URL') && demoJs.includes('Provider load failed:'),
    'Demo includes an intentional missing-static-data scenario and visible provider load failure messaging.'
  ),
  check(
    'reverse_no_match_user_message',
    'Reverse-fill no-match message',
    locationMapPickerJs.includes('No cached barangay boundary matched that pin. The saved address was not changed.') && demoJs.includes('move the pin inside cached geometry or expand the static geometry cache'),
    'Reverse-fill no-match tells the user the saved address was not changed and what to do next.'
  ),
  check(
    'modal_accessibility_guardrails',
    'Modal accessibility guardrails',
    locationPickerJs.includes('element.inert = true') && !locationPickerJs.includes("setAttribute('aria-hidden'") && !locationPickerJs.includes('setAttribute(\"aria-hidden\"') && locationPickerJs.includes('enforceModalFocus'),
    'Modal flow uses inert background handling and focus enforcement without aria-hidden on focused ancestors.'
  ),
  check(
    'no_inline_event_handlers',
    'No inline event handlers',
    inlineHandlerHits.length === 0,
    inlineHandlerHits.length === 0
      ? 'No inline on* event handler attributes found in HTML/Markdown templates.'
      : `Inline handler attributes found in: ${inlineHandlerHits.join(', ')}.`,
    { hits: inlineHandlerHits }
  ),
  check(
    'host_import_path_documented',
    'Host import path documented',
    readme.includes('/assets/vendor/philippines-location-map-picker/') && readme.includes('createStaticLocationMapPicker'),
    'README documents local vendor-path consumption and static provider usage.'
  ),
  check(
    'production_hardening_doc_exists',
    'Production hardening doc exists',
    exists('docs/production-hardening.md'),
    'docs/production-hardening.md is present.'
  )
];

const summary = {
  total: checks.length,
  passed: checks.filter((item) => item.pass).length,
  failed: checks.filter((item) => !item.pass).length
};

const report = {
  generatedAt: new Date().toISOString(),
  packageName: packageJson.name,
  packageVersion: packageJson.version,
  summary,
  checks
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

if (summary.failed > 0) {
  console.error(`Production hardening check failed: ${summary.failed}/${summary.total} check(s) failed.`);
  checks.filter((item) => !item.pass).forEach((item) => console.error(`- ${item.id}: ${item.message}`));
  process.exit(1);
}

console.log(`Production hardening check passed: ${summary.passed}/${summary.total} checks.`);
