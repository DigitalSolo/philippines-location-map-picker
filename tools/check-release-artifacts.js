import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listFiles(relativePath) {
  const dir = path.join(root, relativePath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

function walkPublishableFiles(dir, relativeBase = '') {
  const ignoredDirectories = new Set(['node_modules', '.git', '.vite']);
  const files = [];

  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...walkPublishableFiles(fullPath, relativePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath.replace(/\\/g, '/'));
    }
  }

  return files;
}

const requiredFiles = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  '.gitignore',
  '.npmignore',
  'package.json',
  'package-lock.json',
  'index.html',
  'favicon.ico',
  'src/index.js',
  'src/index.d.ts',
  'dist/location-map-picker.es.js',
  'dist/location-map-picker.umd.js',
  'dist/location-map-picker.css',
  'demo/index.html',
  'demo/demo.js',
  '.github/workflows/package-ci.yml',
  'docs/github-release-handoff.md',
  'docs/release-notes-v1.0.65.md',
  'docs/sukimart-production-integration.md',
  'data/production-readiness-report.json',
  'data/github-publish-readiness-report.json',
  'data/static-data-verification-report.json',
  'data/production-psgc-thresholds-report.json'
];

const localOnlyDirectories = ['node_modules', '.vite', '.git'];
const requiredGitignorePatterns = ['node_modules/', '.vite/', '.env', '*.zip'];
const requiredNpmignorePatterns = ['node_modules/', '.vite/', '*.zip'];
const forbiddenPublishablePatterns = [/^node_modules\//, /^\.vite\//, /^\.git\//, /\.zip$/i, /\.tgz$/i];

const failures = [];
const warnings = [];

function addFailure(code, message, details = {}) {
  failures.push({ code, message, ...details });
}

function addWarning(code, message, details = {}) {
  warnings.push({ code, message, ...details });
}

for (const file of requiredFiles) {
  if (!exists(file)) addFailure('missing_required_file', `Required release file is missing: ${file}`, { file });
}

const gitignore = readText('.gitignore');
for (const pattern of requiredGitignorePatterns) {
  if (!gitignore.includes(pattern)) addFailure('missing_gitignore_pattern', `.gitignore must include ${pattern}`, { pattern });
}

const npmignore = readText('.npmignore');
for (const pattern of requiredNpmignorePatterns) {
  if (!npmignore.includes(pattern)) addFailure('missing_npmignore_pattern', `.npmignore must include ${pattern}`, { pattern });
}

for (const directory of localOnlyDirectories) {
  if (exists(directory)) {
    addWarning('local_only_directory_present', `${directory} exists locally and is ignored for release checks. Do not commit or package it.`, { path: directory });
  }
}

const publishableFiles = walkPublishableFiles(root);
const forbiddenPublishableFiles = publishableFiles.filter((file) => forbiddenPublishablePatterns.some((pattern) => pattern.test(file)));

if (forbiddenPublishableFiles.length > 0) {
  addFailure('forbidden_publishable_file_present', 'Forbidden publishable file(s) found.', {
    files: forbiddenPublishableFiles.slice(0, 50),
    count: forbiddenPublishableFiles.length
  });
}

const packageJson = exists('package.json') ? readJson('package.json') : {};
if (packageJson.version !== '1.0.65') {
  addFailure('version_mismatch', 'package.json version must be 1.0.65 for this release.', { actual: packageJson.version });
}

const productionReadiness = exists('data/production-readiness-report.json') ? readJson('data/production-readiness-report.json') : null;
if (!productionReadiness?.ok) addFailure('production_readiness_not_ok', 'Production readiness report must be OK.');
if (!productionReadiness?.summary?.productionHierarchyReady) addFailure('production_hierarchy_not_ready', 'Production hierarchy must be ready.');

if (productionReadiness?.summary?.productionReverseFillReady) {
  addWarning('reverse_fill_full_geometry_enabled', 'Reverse-fill appears production-ready. Confirm that full geometry was intentionally bundled.');
}

const publishReadiness = exists('data/github-publish-readiness-report.json') ? readJson('data/github-publish-readiness-report.json') : null;
if (!publishReadiness?.ok) addFailure('github_publish_readiness_not_ok', 'GitHub publish readiness report must be OK.');

const staticVerification = exists('data/static-data-verification-report.json') ? readJson('data/static-data-verification-report.json') : null;
if (staticVerification?.summary?.psgcBarangays !== 42010 && staticVerification?.psgc?.barangays !== 42010) {
  const actual = staticVerification?.summary?.psgcBarangays ?? staticVerification?.psgc?.barangays ?? null;
  addWarning('barangay_count_not_42010', 'Static verification barangay count should be reviewed.', { actual });
}

const psgcFiles = {
  regions: exists('data/psgc/regions.json'),
  provinces: listFiles('data/psgc/provinces').length,
  cities: listFiles('data/psgc/cities').length,
  barangays: listFiles('data/psgc/barangays').length
};

if (!psgcFiles.regions || psgcFiles.provinces === 0 || psgcFiles.cities === 0 || psgcFiles.barangays === 0) {
  addFailure('psgc_cache_missing', 'PSGC cache folders must be populated.', { psgcFiles });
}

const report = {
  generatedAt: new Date().toISOString(),
  version: packageJson.version || '',
  requiredFilesChecked: requiredFiles.length,
  publishableFilesChecked: publishableFiles.length,
  psgcFiles,
  warnings,
  failures,
  ok: failures.length === 0
};

fs.writeFileSync(path.join(root, 'data', 'release-artifacts-report.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Release artifact check: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Version: ${report.version}`);
console.log(`Required files checked: ${report.requiredFilesChecked}`);
console.log(`Publishable files checked: ${report.publishableFilesChecked}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log('Wrote data/release-artifacts-report.json');

if (!report.ok) process.exitCode = 1;
