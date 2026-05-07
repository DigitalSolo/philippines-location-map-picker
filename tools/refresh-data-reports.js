import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    copyDemo: '1',
    allowProductionFail: '1'
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

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function copyIfExists(fromRel, toRel, copied, missing) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);

  if (!fs.existsSync(from)) {
    missing.push(fromRel);
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied.push({ from: fromRel, to: toRel });
}

const args = parseArgs(process.argv);
const copyDemo = String(args.copyDemo || '1') !== '0' && String(args.copyDemo || '').toLowerCase() !== 'false';
const allowProductionFail = String(args.allowProductionFail || '1') !== '0' && String(args.allowProductionFail || '').toLowerCase() !== 'false';

const commands = [
  run('verify-static-data.js', ['--strict', '0']),
  run('check-host-api-freeze.js'),
  run('check-production-hardening.js'),
  run('check-vendor-consumption.js'),
  run('check-release-readiness.js', ['--scope', 'pilot']),
  run('check-release-readiness.js', ['--scope', 'production'], { required: false }),
  run('check-production-readiness.js', ['--geometry-policy', 'limited'], { required: !allowProductionFail })
];

const copied = [];
const missing = [];
const failures = [];
const warnings = [];

for (const command of commands) {
  if (!command.ok && command.required) {
    failures.push({
      code: 'required_command_failed',
      command: command.command,
      status: command.status
    });
  } else if (!command.ok) {
    warnings.push({
      code: 'optional_command_failed',
      command: command.command,
      status: command.status
    });
  }

  if (command.stderr) {
    warnings.push({
      code: 'stderr',
      command: command.command,
      message: command.stderr
    });
  }
}

const reportFiles = [
  'data/static-data-report.json',
  'data/static-data-verification-report.json',
  'data/host-api-freeze-report.json',
  'data/production-hardening-report.json',
  'data/vendor-consumption-report.json',
  'data/release-readiness-pilot-report.json',
  'data/release-readiness-production-report.json',
  'data/production-readiness-report.json',
  'data/production-psgc-cache-report.json',
  'data/psgc-source-validation-report.json',
  'data/production-psgc-thresholds-report.json',
  'data/github-publish-readiness-report.json',
  'data/official-psgc-source-report.json'
];

if (copyDemo) {
  for (const file of reportFiles) {
    copyIfExists(file, `demo/${file}`, copied, missing);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  copyDemo,
  allowProductionFail,
  commands,
  copied,
  missing,
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson(path.join(root, 'data', 'data-refresh-report.json'), report);

if (copyDemo) {
  copyIfExists('data/data-refresh-report.json', 'demo/data/data-refresh-report.json', copied, missing);
}

console.log(`Data report refresh: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Copied reports: ${copied.length}`);
console.log(`Missing optional reports: ${missing.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log('Wrote data/data-refresh-report.json');

process.reallyExit(report.ok ? 0 : 1);
