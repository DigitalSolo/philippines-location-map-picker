import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/host/autoMountLocationMapPickers.js',
  'src/index.js',
  'src/index.d.ts',
  'docs/AUTO_MOUNT.md',
  'examples/auto-mount-umd.html',
  'demo/auto-mount.html',
  'demo/auto-mount.js'
];

const failures = [];

function read(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel} is missing`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

for (const rel of requiredFiles) {
  read(rel);
}

const source = read('src/host/autoMountLocationMapPickers.js');
const index = read('src/index.js');
const types = read('src/index.d.ts');
const example = read('examples/auto-mount-umd.html');

const checks = [
  ['source exports autoMountLocationMapPickers', source.includes('export function autoMountLocationMapPickers')],
  ['source exports destroyAutoMountedLocationMapPickers', source.includes('export function destroyAutoMountedLocationMapPickers')],
  ['source reads data-location-map-picker', source.includes('[data-location-map-picker]')],
  ['source creates mountLocationMapPickerField', source.includes('mountLocationMapPickerField')],
  ['index exports autoMountLocationMapPickers', index.includes('autoMountLocationMapPickers')],
  ['types expose auto mount options', types.includes('LocationMapPickerAutoMountOptions')],
  ['example uses one data mount', example.includes('data-location-map-picker') && !example.includes('type="hidden"')],
  ['example calls UMD auto mount', example.includes('PhilippinesLocationMapPicker.autoMountLocationMapPickers()')]
];

for (const [label, passed] of checks) {
  if (!passed) {
    failures.push(label);
  }
}

const report = {
  generated_at: new Date().toISOString(),
  ok: failures.length === 0,
  failures,
  checked_files: requiredFiles
};

const reportPath = path.join(root, 'data/auto-mount-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
