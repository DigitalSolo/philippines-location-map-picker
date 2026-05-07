import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INDEX_JS = path.join(ROOT, 'src', 'index.js');
const INDEX_DTS = path.join(ROOT, 'src', 'index.d.ts');
const HOST_DIR = path.join(ROOT, 'src', 'host');

const REQUIRED_EXPORTS = [
  'LocationMapPicker',
  'LocationPicker',
  'MapPicker',
  'StaticJsonProvider',
  'StaticGeometryProvider',
  'CompositeLocationProvider',
  'PsgcCloudProvider',
  'ApiProvider',
  'ArcGisBarangayGeometryProvider',
  'createStaticLocationProvider',
  'createStaticLocationMapPicker',
  'mountStaticLocationMapPickerField',
  'bindLocationMapPickerForm',
  'bindLocationMapPickerFieldControls',
  'createLocationMapPickerSubmitPayload',
  'createLocationMapPickerSubmitPayloadFromValue',
  'createLocationMapPickerSubmitResult',
  'blockInvalidLocationMapPickerSubmit',
  'writeLocationMapPickerSubmitPayloadToForm',
  'readLocationMapPickerSubmitPayloadFromForm',
  'createLocationMapPickerInitialValueFromSubmitPayload',
  'createLocationMapPickerInitialValueFromForm',
  'formatLocationMapPickerValueLabel',
  'hasLocationMapPickerSelection',
  'selectedLocationMapPickerLevel',
  'createLocationMapPickerHostConfig',
  'defaultLocationMapPickerFieldNames',
  'pointInPolygon',
  'normalizeBounds',
  'boundsCenter',
  'boundsContains',
  'cleanPsgcCode',
  'isTenDigitPsgc',
  'isLegacyNineDigitPsgc',
  'toTenDigitPsgcCode',
  'deriveRegionId',
  'deriveProvinceId',
  'deriveCityId',
  'deriveBarangayCityId',
  'PROVIDER_CONTRACT_VERSION',
  'cleanProviderText',
  'cleanProviderNumber',
  'normalizeProviderArray',
  'normalizeProviderRow',
  'emptyProviderLocation',
  'formatProviderLocationLabel',
  'normalizeLocationValue',
  'normalizePinValue',
  'normalizeBoundsValue',
  'normalizeReverseMatch',
  'createProviderError',
  'createProviderNoMatch',
  'safeProviderCall'
];

const FORBIDDEN_HOST_HELPER_PATTERNS = [
  { pattern: /scenarioMode/g, reason: 'demo scenario selector leaked into host helper code' },
  { pattern: /demoForm/g, reason: 'demo form id leaked into host helper code' },
  { pattern: /demo-location-instance/g, reason: 'demo css class leaked into host helper code' },
  { pattern: /\/demo\//g, reason: 'demo path leaked into host helper code' },
  { pattern: /localhost/g, reason: 'localhost assumption leaked into host helper code' },
  { pattern: /127\.0\.0\.1/g, reason: 'localhost IP assumption leaked into host helper code' },
  { pattern: /\/assets\/vendor\/philippines-location-map-picker/g, reason: 'host vendor path must be caller-provided, not hard-coded in helpers' }
];

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function walkJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walkJsFiles(file));
    else if (entry.isFile() && file.endsWith('.js')) result.push(file);
  }
  return result.sort();
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function exportIsPresent(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

const indexJs = readText(INDEX_JS);
const exportedSourceText = [
  indexJs,
  readText(path.join(ROOT, 'src', 'geo', 'psgcCodes.js')),
  readText(path.join(ROOT, 'src', 'providers', 'providerContract.js'))
].join('\n');
const indexDts = readText(INDEX_DTS);
const failures = [];
const warnings = [];

if (!indexJs.trim()) failures.push('Missing or empty src/index.js.');
if (!indexDts.trim()) failures.push('Missing or empty src/index.d.ts.');

for (const name of REQUIRED_EXPORTS) {
  if (!exportIsPresent(exportedSourceText, name)) failures.push(`src/index.js or re-exported source is missing frozen export: ${name}`);
  if (!exportIsPresent(indexDts, name)) failures.push(`src/index.d.ts is missing frozen type declaration/export: ${name}`);
}

for (const file of walkJsFiles(HOST_DIR)) {
  const text = readText(file);
  for (const check of FORBIDDEN_HOST_HELPER_PATTERNS) {
    let match;
    check.pattern.lastIndex = 0;
    while ((match = check.pattern.exec(text)) !== null) {
      failures.push(`${path.relative(ROOT, file).replace(/\\/g, '/')}:${lineNumber(text, match.index)} ${check.reason}`);
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  requiredExports: REQUIRED_EXPORTS,
  scannedHostHelperFiles: walkJsFiles(HOST_DIR).map((file) => path.relative(ROOT, file).replace(/\\/g, '/')),
  warnings,
  failures,
  ok: failures.length === 0
};

const outFile = path.join(ROOT, 'data', 'host-api-freeze-report.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');

console.log(`Host API freeze check: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Frozen exports checked: ${REQUIRED_EXPORTS.length}`);
console.log(`Host helper files scanned: ${report.scannedHostHelperFiles.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Wrote ${path.relative(ROOT, outFile).replace(/\\/g, '/')}`);

if (!report.ok) process.exitCode = 1;
