import fs from 'node:fs';

const file = process.argv[2];

if (!file) {
  console.error('Usage: npm run inspect-geojson -- path\\to\\boundaries.geojson');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const features = Array.isArray(data.features) ? data.features : [];

console.log(`features: ${features.length}`);

for (let i = 0; i < Math.min(features.length, 5); i += 1) {
  console.log(`\nFeature ${i + 1}`);
  console.log(JSON.stringify(features[i].properties || {}, null, 2));
}
