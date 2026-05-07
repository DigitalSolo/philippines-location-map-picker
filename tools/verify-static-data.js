import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (part.startsWith('--')) {
      const key = part.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
      args[key] = value;
    }
  }
  return args;
}

function cleanRelativePath(value, fallback) {
  return String(value || fallback).replace(/^[\\/]+/, '').replace(/[\\/]+$/, '');
}

function resolveFromPackageRoot(value) {
  return path.resolve(packageRoot, value);
}

function packageRelative(value) {
  return path.relative(packageRoot, value).replace(/\\/g, '/');
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function runTool(scriptName, args) {
  const result = spawnSync(process.execPath, [path.join('tools', scriptName), ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return {
    script: scriptName,
    command: `node tools/${scriptName} ${args.join(' ')}`.trim(),
    status: result.status,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim(),
    ok: result.status === 0
  };
}

function pushFailure(failures, code, message, details = {}) {
  failures.push({ code, message, ...details });
}

const args = parseArgs(process.argv);
const psgc = cleanRelativePath(args.psgc, 'data/psgc');
const geo = cleanRelativePath(args.geo, 'data/geo');
const out = cleanRelativePath(args.out, 'data/static-data-verification-report.json');
const strict = args.strict !== '0' && args.strict !== 'false';

const coverageReportPath = path.join(geo, 'geometry-coverage-report.json');
const reconciliationReportPath = path.join(geo, 'psgc-geometry-reconciliation-report.json');
const staticReportPath = cleanRelativePath(args.staticReport, 'data/static-data-report.json');

const commands = [
  runTool('audit-geometry-coverage.js', ['--psgc', psgc, '--geo', geo, '--out', coverageReportPath]),
  runTool('reconcile-psgc-geometry.js', ['--psgc', psgc, '--geo', geo, '--out', reconciliationReportPath]),
  runTool('audit-static-data.js', ['--psgc', psgc, '--geo', geo, '--out', staticReportPath])
];

const failures = [];
const warnings = [];

for (const command of commands) {
  if (!command.ok) {
    pushFailure(failures, 'tool_failed', `${command.script} exited with status ${command.status}.`, { script: command.script });
  }
  if (command.stderr) {
    warnings.push(`${command.script}: ${command.stderr}`);
  }
}

const coverage = readJson(resolveFromPackageRoot(coverageReportPath), null);
const reconciliation = readJson(resolveFromPackageRoot(reconciliationReportPath), null);
const staticReport = readJson(resolveFromPackageRoot(staticReportPath), null);

if (!coverage) {
  pushFailure(failures, 'coverage_report_missing', 'Geometry coverage report was not generated.');
} else {
  const counts = coverage.counts || {};
  if (Number(counts.psgcBarangays || 0) <= 0) {
    pushFailure(failures, 'psgc_barangays_empty', 'PSGC barangay cache has no rows.');
  }
  if (Number(counts.geometryBarangays || 0) <= 0) {
    pushFailure(failures, 'geometry_barangays_empty', 'Geometry cache has no barangay rows.');
  }
  if (strict && Number(counts.missingGeometry || 0) > 0) {
    pushFailure(failures, 'missing_geometry', 'One or more PSGC barangays have no matching static geometry.', {
      count: Number(counts.missingGeometry || 0)
    });
  }
}

if (!reconciliation) {
  pushFailure(failures, 'reconciliation_report_missing', 'PSGC/geometry reconciliation report was not generated.');
} else if (strict) {
  const counts = reconciliation.counts || {};
  if (Number(counts.psgcWithoutGeometry || 0) > 0) {
    pushFailure(failures, 'psgc_without_geometry', 'One or more PSGC barangays are missing geometry.', {
      count: Number(counts.psgcWithoutGeometry || 0)
    });
  }
  if (Number(counts.geometryWithoutPsgc || 0) > 0) {
    pushFailure(failures, 'geometry_without_psgc', 'One or more geometry barangays do not match the PSGC cache.', {
      count: Number(counts.geometryWithoutPsgc || 0)
    });
  }
  if (Number(counts.geometryComponentGaps || 0) > 0) {
    pushFailure(failures, 'geometry_component_gaps', 'One or more matched geometry rows are missing bounds, centroid, or polygon data.', {
      count: Number(counts.geometryComponentGaps || 0)
    });
  }
}

if (!staticReport) {
  pushFailure(failures, 'static_report_missing', 'Static data audit report was not generated.');
} else {
  for (const warning of staticReport.warnings || []) {
    warnings.push(warning);
  }
  if (strict && staticReport.ok !== true) {
    pushFailure(failures, 'static_audit_warnings', 'Static data audit reported warnings in strict mode.', {
      count: Array.isArray(staticReport.warnings) ? staticReport.warnings.length : 0
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  strict,
  psgcRoot: psgc,
  geoRoot: geo,
  reports: {
    coverage: coverageReportPath,
    reconciliation: reconciliationReportPath,
    staticData: staticReportPath
  },
  commands,
  summary: {
    psgcBarangays: Number(coverage?.counts?.psgcBarangays || 0),
    geometryBarangays: Number(coverage?.counts?.geometryBarangays || 0),
    missingGeometry: Number(coverage?.counts?.missingGeometry || 0),
    geometryWithoutPsgc: Number(reconciliation?.counts?.geometryWithoutPsgc || 0),
    geometryComponentGaps: Number(reconciliation?.counts?.geometryComponentGaps || 0),
    staticWarnings: Array.isArray(staticReport?.warnings) ? staticReport.warnings.length : 0,
    coverageLevel: staticReport?.coverage?.level || 'unknown',
    productionReady: staticReport?.coverage?.productionReady === true,
    productionHierarchyReady: staticReport?.coverage?.productionHierarchyReady === true,
    productionReverseFillReady: staticReport?.coverage?.productionReverseFillReady === true,
    geometryPolicyRecommendation: staticReport?.coverage?.geometryPolicyRecommendation || 'unknown'
  },
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson(resolveFromPackageRoot(out), report);

console.log(`Static data verification: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`PSGC barangays: ${report.summary.psgcBarangays}`);
console.log(`Geometry barangays: ${report.summary.geometryBarangays}`);
console.log(`Missing geometry: ${report.summary.missingGeometry}`);
console.log(`Geometry without PSGC: ${report.summary.geometryWithoutPsgc}`);
console.log(`Component gaps: ${report.summary.geometryComponentGaps}`);
console.log(`Coverage level: ${report.summary.coverageLevel}`);
console.log(`Production hierarchy coverage: ${report.summary.productionHierarchyReady ? 'yes' : 'no'}`);
console.log(`Production reverse-fill coverage: ${report.summary.productionReverseFillReady ? 'yes' : 'no'}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Wrote ${packageRelative(resolveFromPackageRoot(out))}`);

if (!report.ok) {
  process.exitCode = 1;
}
