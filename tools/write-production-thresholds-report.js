import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionSourceMetadata } from './production-thresholds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'data', 'production-psgc-thresholds-report.json');
const demoReportPath = path.join(root, 'demo', 'data', 'production-psgc-thresholds-report.json');

const report = {
  generatedAt: new Date().toISOString(),
  ...productionSourceMetadata(),
  ok: true
};

for (const file of [reportPath, demoReportPath]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
}

console.log('Wrote data/production-psgc-thresholds-report.json');
console.log('Wrote demo/data/production-psgc-thresholds-report.json');
