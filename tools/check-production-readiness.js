import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'data', 'production-readiness-report.json');

function parseArgs(argv) {
  const args = { geometryPolicy: 'limited' };
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

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function failure(failures, code, message, details = {}) {
  failures.push({ code, message, ...details });
}

const args = parseArgs(process.argv);
const geometryPolicy = String(args.geometryPolicy || 'limited').toLowerCase();
const validPolicies = new Set(['limited', 'full']);
const failures = [];
const warnings = [];

if (!validPolicies.has(geometryPolicy)) {
  failure(failures, 'invalid_geometry_policy', `Unknown geometry policy: ${geometryPolicy}. Use limited or full.`);
}

const staticReport = readJson('data/static-data-report.json');
const verificationReport = readJson('data/static-data-verification-report.json');
const hardeningReport = readJson('data/production-hardening-report.json');
const hostReport = readJson('data/host-api-freeze-report.json');

if (!staticReport) {
  failure(failures, 'static_report_missing', 'Missing data/static-data-report.json. Run npm run refresh-data-reports first.');
} else {
  const coverage = staticReport.coverage || {};
  if (coverage.productionHierarchyReady !== true) {
    failure(
      failures,
      'production_hierarchy_not_ready',
      'Nationwide PSGC hierarchy is not ready. Production address save requires broad Region/Province/City/Barangay coverage before publication.',
      {
        actual: staticReport.psgc?.counts || {},
        thresholds: coverage.thresholds || {}
      }
    );
  }

  if (geometryPolicy === 'full' && coverage.productionReverseFillReady !== true) {
    failure(
      failures,
      'production_reverse_fill_not_ready',
      'Full-geometry production mode requires nationwide barangay geometry coverage for reverse-fill.',
      {
        actual: staticReport.geo?.counts || {},
        thresholds: coverage.thresholds || {}
      }
    );
  }

  if (geometryPolicy === 'limited' && coverage.productionReverseFillReady !== true) {
    warnings.push('Limited-geometry production mode: PSGC selection is production-valid; reverse-fill remains available only where geometry exists.');
  }
}

if (!verificationReport) {
  failure(failures, 'verification_report_missing', 'Missing data/static-data-verification-report.json. Run npm run refresh-data-reports first.');
} else {
  const summary = verificationReport.summary || {};
  const geometryWithoutPsgc = Number(summary.geometryWithoutPsgc || 0);
  const geometryComponentGaps = Number(summary.geometryComponentGaps || 0);
  const missingGeometry = Number(summary.missingGeometry || 0);

  if (geometryPolicy === 'full' && geometryWithoutPsgc > 0) {
    failure(failures, 'geometry_without_psgc', 'Full-geometry production mode cannot contain geometry rows that do not match the PSGC hierarchy.', { count: geometryWithoutPsgc });
  }

  if (geometryPolicy === 'limited' && geometryWithoutPsgc > 0) {
    warnings.push(`Limited-geometry production mode: ${geometryWithoutPsgc} geometry row(s) do not match the production PSGC hierarchy and will be ignored by PSGC-authoritative address selection.`);
  }

  if (geometryComponentGaps > 0) {
    failure(failures, 'geometry_component_gaps', 'Geometry cache has matched rows missing bounds, centroid, or polygon data.', { count: geometryComponentGaps });
  }

  if (geometryPolicy === 'full' && missingGeometry > 0) {
    failure(failures, 'missing_geometry', 'Full-geometry production mode cannot have PSGC barangays without geometry.', { count: missingGeometry });
  }
}

if (!hostReport || hostReport.ok !== true) {
  failure(failures, 'host_api_not_frozen', 'Host API freeze report is missing or failed. Run npm run refresh-data-reports first.');
}

if (!hardeningReport || hardeningReport.summary?.failed !== 0) {
  failure(failures, 'production_hardening_not_ready', 'Production hardening report is missing or failed. Run npm run refresh-data-reports first.');
}

const report = {
  generatedAt: new Date().toISOString(),
  geometryPolicy,
  summary: {
    productionHierarchyReady: staticReport?.coverage?.productionHierarchyReady === true,
    productionReverseFillReady: staticReport?.coverage?.productionReverseFillReady === true,
    psgcCounts: staticReport?.psgc?.counts || {},
    geoCounts: staticReport?.geo?.counts || {},
    thresholds: staticReport?.coverage?.thresholds || {},
    hardeningOk: hardeningReport?.summary?.failed === 0,
    hostApiOk: hostReport?.ok === true
  },
  commands: [],
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson(reportPath, report);

console.log(`Production readiness (${geometryPolicy} geometry): ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`PSGC hierarchy ready: ${report.summary.productionHierarchyReady ? 'yes' : 'no'}`);
console.log(`Reverse-fill geometry ready: ${report.summary.productionReverseFillReady ? 'yes' : 'no'}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log('Wrote data/production-readiness-report.json');

process.exit(report.ok ? 0 : 1);
