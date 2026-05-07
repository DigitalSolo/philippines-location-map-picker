import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = { scope: 'pilot' };
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? argv[++i] : '1';
  }
  return args;
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function rel(file) {
  return path.relative(process.cwd(), file).replace(/\\/g, '/');
}

const args = parseArgs(process.argv);
const scope = String(args.scope || 'pilot').trim().toLowerCase();
const allowedScopes = new Set(['pilot', 'production']);
const failures = [];
const warnings = [];

if (!allowedScopes.has(scope)) {
  failures.push(`Unknown release readiness scope: ${scope}. Use pilot or production.`);
}

const verificationFile = path.join(process.cwd(), 'data', 'static-data-verification-report.json');
const staticReportFile = path.join(process.cwd(), 'data', 'static-data-report.json');
const hostReportFile = path.join(process.cwd(), 'data', 'host-api-freeze-report.json');

const verification = readJson(verificationFile);
const staticReport = readJson(staticReportFile);
const hostReport = readJson(hostReportFile);

if (!verification) failures.push(`Missing ${rel(verificationFile)}. Run npm run verify-static-data first.`);
else if (verification.ok !== true) failures.push(`${rel(verificationFile)} is not OK.`);

if (!staticReport) failures.push(`Missing ${rel(staticReportFile)}. Run npm run audit-static-data first.`);
if (!hostReport) failures.push(`Missing ${rel(hostReportFile)}. Run npm run check-host-api first.`);
else if (hostReport.ok !== true) failures.push(`${rel(hostReportFile)} is not OK.`);

const summary = verification?.summary || {};
const coverage = staticReport?.coverage || {};
const coverageLevel = String(summary.coverageLevel || coverage.level || 'unknown');
const productionReady = summary.productionReady === true || coverage.productionReady === true;
const productionHierarchyReady = summary.productionHierarchyReady === true || coverage.productionHierarchyReady === true;
const productionReverseFillReady = summary.productionReverseFillReady === true || coverage.productionReverseFillReady === true;
const missingGeometry = Number(summary.missingGeometry || 0);
const geometryWithoutPsgc = Number(summary.geometryWithoutPsgc || 0);
const geometryComponentGaps = Number(summary.geometryComponentGaps || 0);
const staticWarnings = Number(summary.staticWarnings || 0);

if (geometryWithoutPsgc !== 0) {
  if (scope === 'production' && productionHierarchyReady && !productionReverseFillReady) {
    warnings.push(`Limited-geometry production release: ${geometryWithoutPsgc} geometry row(s) do not match the production PSGC hierarchy and will be ignored.`);
  } else {
    failures.push(`Geometry without cached PSGC must be 0; found ${geometryWithoutPsgc}.`);
  }
}
if (geometryComponentGaps !== 0) failures.push(`Geometry component gaps must be 0; found ${geometryComponentGaps}.`);
if (staticWarnings !== 0) failures.push(`Static warnings must be 0; found ${staticWarnings}.`);

if (scope === 'production' && !productionHierarchyReady) {
  failures.push('Production release requires broad Philippines PSGC hierarchy coverage. Current report is not hierarchy-ready.');
}

if (scope === 'production' && productionHierarchyReady && !productionReverseFillReady) {
  warnings.push('Production release is hierarchy-ready with limited geometry. Reverse-fill remains partial until nationwide barangay geometry is cached.');
}

if (scope === 'pilot' && !productionHierarchyReady) {
  warnings.push('Pilot release only: current static cache is structurally valid but not broad enough for unrestricted nationwide production address capture.');
}

if (scope === 'pilot' && productionHierarchyReady && !productionReverseFillReady) {
  warnings.push('Pilot/release branch has production PSGC hierarchy but limited geometry. This is acceptable for hierarchy-first publishing.');
}

if (scope === 'pilot' && !productionHierarchyReady && missingGeometry !== 0) {
  failures.push(`Missing geometry must be 0 for a pilot cache subset; found ${missingGeometry}.`);
}

const report = {
  generatedAt: new Date().toISOString(),
  scope,
  summary: {
    coverageLevel,
    productionReady,
    productionHierarchyReady,
    productionReverseFillReady,
    psgcBarangays: Number(summary.psgcBarangays || staticReport?.psgc?.counts?.barangays || 0),
    geometryBarangays: Number(summary.geometryBarangays || staticReport?.geo?.counts?.barangayPolygonFiles || 0),
    missingGeometry,
    geometryWithoutPsgc,
    geometryComponentGaps,
    staticWarnings,
    frozenHostApiOk: hostReport?.ok === true
  },
  warnings,
  failures,
  ok: failures.length === 0
};

const outFile = path.join(process.cwd(), 'data', `release-readiness-${scope}-report.json`);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');

console.log(`Release readiness (${scope}): ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Coverage level: ${coverageLevel}`);
console.log(`Production broad coverage: ${productionReady ? 'yes' : 'no'}`);
console.log(`Frozen host API: ${hostReport?.ok === true ? 'OK' : 'missing/failed'}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Wrote ${rel(outFile)}`);

if (!report.ok) process.exitCode = 1;
