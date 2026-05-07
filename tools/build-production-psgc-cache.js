import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionHierarchyThresholds, productionSourceMetadata } from './production-thresholds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const THRESHOLDS = productionHierarchyThresholds();

function parseArgs(argv) {
  const args = {
    source: 'psgc-cloud',
    input: '',
    out: 'data/psgc',
    baseUrl: 'https://psgc.cloud/api/v2',
    delayMs: '300',
    resume: '1',
    force: '0',
    maxRetries: '12',
    retryDelayMs: '3000',
    retryMultiplier: '2',
    maxRetryDelayMs: '120000',
    timeoutMs: '60000'
  };

  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? argv[++i] : '1';
  }

  return args;
}

function cleanRelativePath(value, fallback) {
  return String(value || fallback).replace(/^[\\/]+/, '').replace(/[\\/]+$/, '');
}

function resolveInsidePackage(relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Refusing to write outside the package root: ${relativePath}`);
  }
  return resolved;
}

function packageRelative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function removeGeneratedCache(outDir) {
  for (const name of ['regions.json', 'provinces', 'cities', 'barangays', 'cache-psgc-cloud-report.json', 'import-psgc-report.json']) {
    const target = path.join(outDir, name);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join('tools', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return {
    script,
    command: `node tools/${script} ${args.join(' ')}`.trim(),
    status: result.status,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim(),
    ok: result.status === 0
  };
}

function countRowsInJsonFiles(dir) {
  if (!fs.existsSync(dir)) return { files: 0, rows: 0 };

  let files = 0;
  let rows = 0;
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) {
        continue;
      }

      files += 1;
      const json = readJson(fullPath, []);
      if (Array.isArray(json)) {
        rows += json.length;
      } else if (json && typeof json === 'object') {
        rows += Object.keys(json).length;
      }
    }
  }

  return { files, rows };
}

function summarizePsgc(outDir) {
  const regions = readJson(path.join(outDir, 'regions.json'), []);
  const provinces = countRowsInJsonFiles(path.join(outDir, 'provinces'));
  const cities = countRowsInJsonFiles(path.join(outDir, 'cities'));
  const barangays = countRowsInJsonFiles(path.join(outDir, 'barangays'));

  return {
    regions: Array.isArray(regions) ? regions.length : 0,
    provinceFiles: provinces.files,
    provinces: provinces.rows,
    cityFiles: cities.files,
    citiesAndMunicipalities: cities.rows,
    barangayFiles: barangays.files,
    barangays: barangays.rows
  };
}


function hasCloudCacheProgress(outDir, reportPath) {
  if (fs.existsSync(path.join(outDir, 'cache-psgc-cloud-report.json'))) {
    return true;
  }

  if (!fs.existsSync(reportPath)) {
    return false;
  }

  try {
    const report = readJson(reportPath, null);
    const counts = report && report.source === 'psgc-cloud' ? report.counts : null;
    return Boolean(
      counts &&
      (
        Number(counts.regions || 0) > 0 ||
        Number(counts.provinces || 0) > 0 ||
        Number(counts.citiesAndMunicipalities || 0) > 0 ||
        Number(counts.barangays || 0) > 0
      )
    );
  } catch {
    return false;
  }
}

function isProductionHierarchyReady(counts) {
  return (
    Number(counts.regions || 0) >= THRESHOLDS.regions &&
    Number(counts.provinces || 0) >= THRESHOLDS.provinces &&
    Number(counts.citiesAndMunicipalities || 0) >= THRESHOLDS.citiesAndMunicipalities &&
    Number(counts.barangays || 0) >= THRESHOLDS.barangays
  );
}

const args = parseArgs(process.argv);
const source = String(args.source || 'psgc-cloud').toLowerCase();
const out = cleanRelativePath(args.out, 'data/psgc');
const outDir = resolveInsidePackage(out);
const reportPath = resolveInsidePackage(cleanRelativePath(args.report, 'data/production-psgc-cache-report.json'));
const commands = [];
const warnings = [];
const failures = [];

const shouldResume = String(args.resume || '1') !== '0' && String(args.force || '0') !== '1';
const cloudProgressExists = hasCloudCacheProgress(outDir, reportPath);

if (source === 'psgc-cloud') {
  if (!shouldResume || !cloudProgressExists) {
    removeGeneratedCache(outDir);
  }

  const command = run('cache-psgc-cloud.js', [
    '--out', out,
    '--base-url', String(args.baseUrl || 'https://psgc.cloud/api/v2'),
    '--delay-ms', String(args.delayMs || '300'),
    '--resume', shouldResume ? '1' : '0',
    '--force', String(args.force || '0'),
    '--max-retries', String(args.maxRetries || '12'),
    '--retry-delay-ms', String(args.retryDelayMs || '3000'),
    '--retry-multiplier', String(args.retryMultiplier || '2'),
    '--max-retry-delay-ms', String(args.maxRetryDelayMs || '120000'),
    '--timeout-ms', String(args.timeoutMs || '60000')
  ]);

  commands.push(command);

  if (!command.ok) {
    failures.push({
      code: 'psgc_cloud_cache_failed',
      message: 'PSGC Cloud cache command failed. Check internet/DNS access and the PSGC Cloud API response.',
      status: command.status
    });
  }

  if (command.stderr) {
    warnings.push(command.stderr);
  }
} else if (['file', 'flat-file', 'csv', 'json'].includes(source)) {
  removeGeneratedCache(outDir);
  const input = String(args.input || args.file || '').trim();

  if (!input) {
    failures.push({
      code: 'missing_input',
      message: 'File-based PSGC cache builds require --input path/to/psgc.csv or --input path/to/psgc.json.'
    });
  } else {
    const shouldValidate = String(args.skipValidate || '0') !== '1';
    let validationCommand = null;

    if (shouldValidate) {
      validationCommand = run('validate-psgc-source.js', [
        '--input', input,
        '--report', 'data/psgc-source-validation-report.json'
      ]);

      commands.push(validationCommand);

      if (!validationCommand.ok) {
        failures.push({
          code: 'psgc_source_validation_failed',
          message: 'Flat-file PSGC source validation failed. Fix the source file before importing.',
          status: validationCommand.status
        });
      }

      if (validationCommand.stderr) {
        warnings.push(validationCommand.stderr);
      }
    }

    if (!validationCommand || validationCommand.ok) {
      const command = run('import-psgc.js', [
        '--input', input,
        '--out', out,
        '--reset', '0'
      ]);

      commands.push(command);

      if (!command.ok) {
        failures.push({
          code: 'psgc_file_import_failed',
          message: 'Flat-file PSGC import failed. Check the source file columns and import report.',
          status: command.status
        });
      }

      if (command.stderr) {
        warnings.push(command.stderr);
      }
    }
  }
} else {
  failures.push({
    code: 'unsupported_source',
    message: `Unsupported PSGC cache source: ${source}. Supported sources: psgc-cloud, file.`
  });
}

const counts = summarizePsgc(outDir);
const productionHierarchyReady = isProductionHierarchyReady(counts);

if (!productionHierarchyReady) {
  failures.push({
    code: 'production_hierarchy_below_threshold',
    message: 'Generated PSGC hierarchy is below the production nationwide thresholds.',
    actual: counts,
    required: THRESHOLDS
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source,
  out,
  thresholds: THRESHOLDS,
  sourceMetadata: productionSourceMetadata(),
  counts,
  productionHierarchyReady,
  commands,
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson(reportPath, report);

console.log(`Production PSGC cache: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Output: ${out}`);
console.log(`Regions: ${counts.regions}`);
console.log(`Provinces: ${counts.provinces}`);
console.log(`Cities/municipalities: ${counts.citiesAndMunicipalities}`);
console.log(`Barangays: ${counts.barangays}`);
console.log(`Production hierarchy ready: ${productionHierarchyReady ? 'yes' : 'no'}`);
console.log(`Wrote ${packageRelative(reportPath)}`);

if (!report.ok) {
  process.exitCode = 1;
}
