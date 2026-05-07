import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { mode: 'production' };
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? argv[++i] : '1';
  }
  return args;
}

function readJson(relativePath, fallback = null) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(relativePath, data) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function run(script, args = [], options = {}) {
  const result = spawnSync(process.execPath, [path.join('tools', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  return {
    script,
    command: `node tools/${script} ${args.join(' ')}`.trim(),
    status: result.status,
    stdout: '',
    stderr: result.error ? String(result.error.message || result.error) : '',
    ok: result.status === 0,
    required: options.required !== false
  };
}

function fileSize(relativePath) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? fs.statSync(file).size : 0;
}

function existsFile(relativePath) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function existsDir(relativePath) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) && fs.statSync(file).isDirectory();
}

function walk(dir) {
  const ignoredDirectories = new Set(['node_modules', '.git', '.vite']);
  const start = path.join(root, dir);
  if (!fs.existsSync(start)) return [];
  const result = [];
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) result.push(rel(fullPath));
    }
  }

  return result.sort();
}

function hasForbiddenPath() {
  const forbidden = [];

  for (const file of walk('.')) {
    const normalized = file.replace(/^\.\//, '');
    if (normalized.includes('/node_modules/') || normalized.startsWith('node_modules/')) forbidden.push(normalized);
    if (normalized.includes('/.vite/') || normalized.startsWith('.vite/')) forbidden.push(normalized);
    if (normalized.includes('/.git/') || normalized.startsWith('.git/')) forbidden.push(normalized);
    if (normalized.endsWith('.zip') || normalized.endsWith('.tgz')) forbidden.push(normalized);
    if (normalized === '.env' || normalized.startsWith('.env.')) forbidden.push(normalized);
  }

  return [...new Set(forbidden)].sort();
}

function includesAll(list, required) {
  return required.filter((item) => !list.includes(item));
}

const args = parseArgs(process.argv);
const mode = String(args.mode || 'production').toLowerCase();
const allowedModes = new Set(['pilot', 'production']);
const failures = [];
const warnings = [];
const commands = [];

if (!allowedModes.has(mode)) {
  failures.push({ code: 'invalid_mode', message: `Invalid publish mode: ${mode}. Use pilot or production.` });
}

const requiredFiles = [
  'README.md',
  'LICENSE',
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
  'docs/production-data-contract.md',
  'docs/production-psgc-cache.md',
  'docs/production-psgc-file-import.md',
  'docs/production-psgc-thresholds.md',
  'docs/psgc-source-validation.md',
  'docs/sukimart-integration-checklist.md',
  'tools/production-thresholds.js',
  'tools/check-production-readiness.js',
  'tools/check-release-readiness.js',
  'tools/check-host-api-freeze.js',
  'tools/check-github-publish-readiness.js',
  '.github/workflows/package-ci.yml',
  '.gitignore',
  '.npmignore'
];

const requiredDirs = ['src', 'dist', 'demo', 'data', 'docs', 'tools', 'examples'];

for (const file of requiredFiles) {
  if (!existsFile(file)) failures.push({ code: 'missing_required_file', message: `Missing ${file}.`, file });
  else if (fileSize(file) <= 0) failures.push({ code: 'empty_required_file', message: `${file} is empty.`, file });
}

for (const dir of requiredDirs) {
  if (!existsDir(dir)) failures.push({ code: 'missing_required_dir', message: `Missing ${dir}/.`, dir });
}

for (const localOnlyDirectory of ['node_modules', '.vite', '.git']) {
  if (existsDir(localOnlyDirectory)) {
    warnings.push({
      code: 'local_only_directory_present',
      message: `${localOnlyDirectory} exists locally and is ignored for publish checks. Do not commit or package it.`,
      path: localOnlyDirectory
    });
  }
}

const forbiddenPaths = hasForbiddenPath();
if (forbiddenPaths.length > 0) {
  failures.push({
    code: 'forbidden_files_present',
    message: 'Repository contains generated, secret, or archive files that should not be published.',
    paths: forbiddenPaths.slice(0, 50),
    count: forbiddenPaths.length
  });
}

const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
if (!packageJson) {
  failures.push({ code: 'missing_package_json', message: 'package.json is missing or invalid.' });
} else {
  const requiredScripts = [
    'build',
    'verify-static-data',
    'check-host-api',
    'check-production-hardening',
    'check-vendor-consumption',
    'check-pilot-readiness',
    'check-production-readiness',
    'check-publish-readiness',
    'check-publish-readiness:pilot',
    'check-publish-readiness:production',
    'validate-psgc-source',
    'smoke-psgc-source',
    'build-production-psgc-cache:file'
  ];
  const scripts = packageJson.scripts || {};
  for (const script of requiredScripts) {
    if (!scripts[script]) failures.push({ code: 'missing_script', message: `Missing npm script: ${script}.`, script });
  }

  const requiredPackageFiles = ['src', 'dist', 'data', 'tools', 'docs', 'examples', 'README.md', 'LICENSE'];
  const missingPackageFiles = includesAll(packageJson.files || [], requiredPackageFiles);
  if (missingPackageFiles.length > 0) {
    failures.push({ code: 'package_files_incomplete', message: 'package.json files list is incomplete.', missing: missingPackageFiles });
  }

  if (packageJson.license !== 'MIT') {
    failures.push({ code: 'unexpected_license', message: 'package.json license must be MIT.', actual: packageJson.license || '' });
  }
}

if (!packageLock) {
  failures.push({ code: 'missing_package_lock', message: 'package-lock.json is missing or invalid.' });
} else if (packageJson && packageLock.version !== packageJson.version) {
  failures.push({ code: 'package_lock_version_mismatch', message: 'package-lock.json version does not match package.json.', packageVersion: packageJson.version, lockVersion: packageLock.version });
}

const baseCommands = [
  run('write-production-thresholds-report.js'),
  run('verify-static-data.js', ['--strict', '0']),
  run('check-host-api-freeze.js'),
  run('check-production-hardening.js'),
  run('check-vendor-consumption.js'),
  run('check-release-readiness.js', ['--scope', mode === 'production' ? 'production' : 'pilot'])
];
commands.push(...baseCommands);

if (mode === 'production') {
  commands.push(run('check-production-readiness.js', ['--geometry-policy', 'limited']));
} else {
  warnings.push({
    code: 'pilot_publish_only',
    message: 'Pilot publish readiness does not certify unrestricted production address coverage. Run npm run check-publish-readiness for production mode.'
  });
}

for (const command of commands) {
  if (!command.ok && command.required) {
    failures.push({ code: 'required_command_failed', message: `${command.command} failed.`, command: command.command, status: command.status });
  }
  if (command.stderr) {
    warnings.push({ code: 'command_stderr', command: command.command, message: command.stderr });
  }
}

const staticReport = readJson('data/static-data-report.json');
const productionReport = readJson('data/production-readiness-report.json');
const hostReport = readJson('data/host-api-freeze-report.json');
const hardeningReport = readJson('data/production-hardening-report.json');
const vendorReport = readJson('data/vendor-consumption-report.json');
const thresholdReport = readJson('data/production-psgc-thresholds-report.json');

if (mode === 'production') {
  if (staticReport?.coverage?.productionHierarchyReady !== true) {
    failures.push({
      code: 'production_hierarchy_not_ready',
      message: 'Production publish requires nationwide PSGC hierarchy readiness.',
      actual: staticReport?.psgc?.counts || {},
      thresholds: staticReport?.coverage?.thresholds || thresholdReport?.thresholds || {}
    });
  }

  if (productionReport?.ok !== true) {
    failures.push({ code: 'production_report_not_ok', message: 'data/production-readiness-report.json is not OK.' });
  }
}

if (hostReport?.ok !== true) failures.push({ code: 'host_api_report_not_ok', message: 'Host API freeze report is not OK.' });
if (hardeningReport?.summary?.failed !== 0) failures.push({ code: 'hardening_report_not_ok', message: 'Production hardening report is not OK.' });
if (!(vendorReport?.ok === true || vendorReport?.summary?.failed === 0)) failures.push({ code: 'vendor_report_not_ok', message: 'Vendor consumption report is not OK.' });

const report = {
  generatedAt: new Date().toISOString(),
  mode,
  version: packageJson?.version || '',
  summary: {
    requiredFiles: requiredFiles.length,
    requiredDirs: requiredDirs.length,
    forbiddenPathCount: forbiddenPaths.length,
    distFiles: {
      es: fileSize('dist/location-map-picker.es.js'),
      umd: fileSize('dist/location-map-picker.umd.js'),
      css: fileSize('dist/location-map-picker.css')
    },
    productionHierarchyReady: staticReport?.coverage?.productionHierarchyReady === true,
    productionReverseFillReady: staticReport?.coverage?.productionReverseFillReady === true,
    psgcCounts: staticReport?.psgc?.counts || {},
    thresholds: staticReport?.coverage?.thresholds || thresholdReport?.thresholds || {},
    hostApiOk: hostReport?.ok === true,
    hardeningOk: hardeningReport?.summary?.failed === 0,
    vendorConsumptionOk: vendorReport?.ok === true || vendorReport?.summary?.failed === 0
  },
  commands,
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson('data/github-publish-readiness-report.json', report);

console.log(`GitHub publish readiness (${mode}): ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Version: ${report.version}`);
console.log(`Production hierarchy ready: ${report.summary.productionHierarchyReady ? 'yes' : 'no'}`);
console.log(`Host API: ${report.summary.hostApiOk ? 'OK' : 'failed'}`);
console.log(`Hardening: ${report.summary.hardeningOk ? 'OK' : 'failed'}`);
console.log(`Vendor consumption: ${report.summary.vendorConsumptionOk ? 'OK' : 'failed'}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log('Wrote data/github-publish-readiness-report.json');

process.reallyExit(report.ok ? 0 : 1);
