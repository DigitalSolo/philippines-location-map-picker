import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'data', 'vendor-consumption-report.json');

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function read(relPath) {
  return fs.existsSync(path.join(root, relPath)) ? fs.readFileSync(path.join(root, relPath), 'utf8') : '';
}

function readJson(relPath) {
  return JSON.parse(read(relPath));
}

function walk(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

function lineHits(relPath, pattern) {
  const text = read(relPath);
  const hits = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (pattern.test(line)) hits.push(`${relPath}:${index + 1}`);
  });
  return hits;
}

function check(id, label, pass, message, details = {}) {
  return { id, label, pass: Boolean(pass), message, details };
}

const packageJson = readJson('package.json');
const indexJs = read('src/index.js');
const indexDts = read('src/index.d.ts');
const readme = read('README.md');
const sukiMartChecklist = read('docs/sukimart-integration-checklist.md');
const vendorDoc = read('docs/vendor-consumption.md');
const hostContractDoc = read('docs/host-field-contract.md');
const distFiles = ['dist/location-map-picker.es.js', 'dist/location-map-picker.umd.js', 'dist/location-map-picker.css'];
const distText = distFiles.map((file) => read(file)).join('\n');

const forbiddenDistPatterns = [
  { pattern: /demo\//i, reason: 'demo path leaked into dist output' },
  { pattern: /demo-location-instance/i, reason: 'demo css class leaked into dist output' },
  { pattern: /scenarioMode/i, reason: 'demo scenario mode leaked into dist output' },
  { pattern: /127\.0\.0\.1|localhost/i, reason: 'local dev host leaked into dist output' }
];

const forbiddenDistHits = forbiddenDistPatterns.flatMap((item) => {
  return distFiles.flatMap((file) => lineHits(file, item.pattern).map((hit) => `${hit} ${item.reason}`));
});

const documentedFields = [
  'barangay_id',
  'pin_lat',
  'pin_lng',
  'location_picker_value_json',
  'location_picker_validation_json'
];
const docsText = [readme, sukiMartChecklist, vendorDoc, hostContractDoc].join('\n');
const missingDocumentedFields = documentedFields.filter((field) => !docsText.includes(field));

const sourceFiles = walk(path.join(root, 'src')).filter((file) => file.endsWith('.js'));
const sourceText = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const hardCodedVendorBaseHits = sourceFiles.flatMap((file) => {
  const relPath = rel(file);
  return lineHits(relPath, /\/assets\/vendor\/philippines-location-map-picker/).map((hit) => `${hit} host vendor path must be caller-provided`);
});

const checks = [
  check(
    'package_exports_entrypoints',
    'Package entrypoints are exported',
    packageJson.exports?.['.']?.import === './dist/location-map-picker.es.js'
      && packageJson.exports?.['.']?.require === './dist/location-map-picker.umd.js'
      && packageJson.exports?.['.']?.types === './src/index.d.ts'
      && packageJson.exports?.['./style.css'] === './dist/location-map-picker.css',
    'package.json exports ESM, UMD, types, and CSS entrypoints.'
  ),
  check(
    'dist_artifacts_exist',
    'Dist artifacts exist',
    distFiles.every((file) => exists(file) && read(file).trim().length > 0),
    'Built ESM, UMD, and CSS files are present.'
  ),
  check(
    'host_config_exported',
    'Host config helper is exported',
    indexJs.includes('createLocationMapPickerHostConfig')
      && indexJs.includes('defaultLocationMapPickerFieldNames')
      && indexDts.includes('LocationMapPickerHostConfigOptions')
      && indexDts.includes('createLocationMapPickerHostConfig'),
    'The generic host configuration helper and its types are exposed from the public entrypoint.'
  ),
  check(
    'explicit_base_url_required',
    'Explicit baseUrl required',
    read('src/host/createStaticLocationMapPicker.js').includes('requires baseUrl')
      && read('src/host/createLocationMapPickerHostConfig.js').includes('requires baseUrl'),
    'Static host consumption requires the caller to provide the package data base URL.'
  ),
  check(
    'no_demo_leaks_in_dist',
    'No demo-only assumptions in dist',
    forbiddenDistHits.length === 0,
    forbiddenDistHits.length === 0 ? 'No known demo-only markers were found in dist.' : forbiddenDistHits.join('; '),
    { hits: forbiddenDistHits }
  ),
  check(
    'no_hard_coded_vendor_base_in_src',
    'No hard-coded host vendor base in source',
    hardCodedVendorBaseHits.length === 0,
    hardCodedVendorBaseHits.length === 0 ? 'Source helpers leave vendor paths to the host application.' : hardCodedVendorBaseHits.join('; '),
    { hits: hardCodedVendorBaseHits }
  ),
  check(
    'host_field_contract_documented',
    'Host field contract documented',
    missingDocumentedFields.length === 0 && exists('docs/host-field-contract.md'),
    missingDocumentedFields.length === 0 ? 'Package-owned submit fields are documented.' : `Missing documented fields: ${missingDocumentedFields.join(', ')}`,
    { fields: documentedFields }
  ),
  check(
    'sukimart_vendor_path_documented',
    'SukiMart vendor path documented',
    sukiMartChecklist.includes('/packages/philippines-location-map-picker') && sukiMartChecklist.includes('barangay_id'),
    'SukiMart checklist documents the local vendor path and authoritative barangay_id storage.'
  ),
  check(
    'no_delivery_rules_in_package',
    'No host business rules in package source',
    !/delivery[-_ ]?zone|shipping[-_ ]?fee|vendor[-_ ]?coverage|rdc/i.test(sourceText),
    'Package source remains limited to picking, pinning, reverse-fill, validation, and submit serialization.'
  ),
  check(
    'vendor_consumption_doc_exists',
    'Vendor consumption doc exists',
    exists('docs/vendor-consumption.md') && vendorDoc.includes('createLocationMapPickerHostConfig'),
    'docs/vendor-consumption.md documents the generic host-consumption flow.'
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
  console.error(`Vendor consumption check failed: ${summary.failed}/${summary.total} check(s) failed.`);
  checks.filter((item) => !item.pass).forEach((item) => console.error(`- ${item.id}: ${item.message}`));
  process.exit(1);
}

console.log(`Vendor consumption check passed: ${summary.passed}/${summary.total} checks.`);
console.log(`Wrote ${rel(reportPath)}`);
