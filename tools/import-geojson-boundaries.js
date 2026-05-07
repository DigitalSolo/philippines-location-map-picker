import fs from 'node:fs';
import path from 'node:path';
import {
  cleanPsgcCode,
  deriveCityId,
  deriveProvinceId,
  deriveRegionId
} from '../src/geo/psgcCodes.js';

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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function cleanId(value) {
  return cleanPsgcCode(value);
}

function round(value, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(Number(value) * factor) / factor;
}

function compactProperties(properties) {
  const output = {};
  for (const [key, value] of Object.entries(properties || {})) {
    if (value !== null && value !== undefined && String(value) !== '') {
      output[key] = value;
    }
  }
  return output;
}

function forEachCoordinate(geometry, callback) {
  if (!geometry) {
    return;
  }

  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => {
      ring.forEach(([lng, lat]) => callback(Number(lat), Number(lng)));
    });
    return;
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lng, lat]) => callback(Number(lat), Number(lng)));
      });
    });
  }
}

function boundsForGeometry(geometry) {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  let count = 0;
  let latSum = 0;
  let lngSum = 0;

  forEachCoordinate(geometry, (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    south = Math.min(south, lat);
    west = Math.min(west, lng);
    north = Math.max(north, lat);
    east = Math.max(east, lng);
    latSum += lat;
    lngSum += lng;
    count += 1;
  });

  if (count === 0) {
    return null;
  }

  return {
    bounds: [south, west, north, east],
    centroid: {
      lat: latSum / count,
      lng: lngSum / count
    }
  };
}

function ringArea(points) {
  let area = 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j][0] * points[i][1]) - (points[i][0] * points[j][1]);
  }

  return Math.abs(area / 2);
}

function largestRing(geometry) {
  if (!geometry) {
    return [];
  }

  const rings = [];

  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates[0])) {
    rings.push(geometry.coordinates[0]);
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      if (Array.isArray(polygon[0])) {
        rings.push(polygon[0]);
      }
    });
  }

  return rings
    .filter((ring) => Array.isArray(ring) && ring.length >= 4)
    .sort((a, b) => ringArea(b) - ringArea(a))[0] || [];
}

function simplifyRing(ring, step) {
  if (step <= 1 || ring.length <= 8) {
    return ring;
  }

  const simplified = ring.filter((_, index) => index % step === 0);
  const first = simplified[0];
  const last = simplified[simplified.length - 1];

  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    simplified.push(first);
  }

  return simplified;
}

function polygonForOutput(geometry, precision, step) {
  return simplifyRing(largestRing(geometry), step)
    .map(([lng, lat]) => ({
      lat: round(lat, precision),
      lng: round(lng, precision)
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function levelPluralName(level) {
  return level === 'city' ? 'cities' : `${level}s`;
}

function expandBounds(current, incoming) {
  if (!incoming) {
    return current || null;
  }

  if (!current) {
    return incoming.slice();
  }

  return [
    Math.min(current[0], incoming[0]),
    Math.min(current[1], incoming[1]),
    Math.max(current[2], incoming[2]),
    Math.max(current[3], incoming[3])
  ];
}

function summarizeSkipped(rows) {
  return rows.reduce((summary, row) => {
    const reason = row.reason || 'unknown';
    summary[reason] = (summary[reason] || 0) + 1;
    return summary;
  }, {});
}

function countKeys(value) {
  return Object.keys(value || {}).length;
}

const args = parseArgs(process.argv);
const input = args.input || args.i;
const out = args.out || 'data/geo';
const level = args.level || 'barangay';
const idProp = args['id-prop'] || 'code';
const precision = Number(args.precision || 6);
const simplifyStep = Math.max(1, Number(args['simplify-step'] || 1));
const merge = args.merge !== '0';

if (!input) {
  console.error([
    'Usage:',
    '  npm run import-geojson -- --input path\\to\\boundaries.geojson --level barangay --id-prop ADM4_PCODE --out data/geo',
    '',
    'First inspect available properties:',
    '  npm run inspect-geojson -- path\\to\\boundaries.geojson'
  ].join('\n'));
  process.exit(1);
}

if (!['barangay', 'city', 'province', 'region'].includes(level)) {
  console.error('Unsupported --level. Use barangay, city, province, or region.');
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(input, 'utf8'));
const features = Array.isArray(geojson.features) ? geojson.features : [];
const levelPlural = levelPluralName(level);

const boundsFile = path.join(out, 'bounds', `${levelPlural}.json`);
const centroidsFile = path.join(out, 'centroids', `${levelPlural}.json`);
const bounds = merge ? readJson(boundsFile, {}) : {};
const centroids = merge ? readJson(centroidsFile, {}) : {};
const cityBoundsFile = path.join(out, 'bounds', 'cities.json');
const provinceBoundsFile = path.join(out, 'bounds', 'provinces.json');
const regionBoundsFile = path.join(out, 'bounds', 'regions.json');
const cityBounds = merge ? readJson(cityBoundsFile, {}) : {};
const provinceBounds = merge ? readJson(provinceBoundsFile, {}) : {};
const regionBounds = merge ? readJson(regionBoundsFile, {}) : {};

const skipped = [];
const importedRows = [];
let polygonCount = 0;
let overwritten = 0;

for (const feature of features) {
  const properties = feature.properties || {};
  const id = cleanId(properties[idProp]);

  if (!id) {
    skipped.push({ reason: 'missing-id', idProp, properties: compactProperties(properties) });
    continue;
  }

  const result = boundsForGeometry(feature.geometry);
  if (!result) {
    skipped.push({ reason: 'empty-geometry', id, properties: compactProperties(properties) });
    continue;
  }

  const nextBounds = result.bounds.map((value) => round(value, precision));
  const nextCentroid = {
    lat: round(result.centroid.lat, precision),
    lng: round(result.centroid.lng, precision)
  };

  if (level === 'barangay') {
    const cityId = deriveCityId(id);
    const provinceId = deriveProvinceId(id);
    const regionId = deriveRegionId(id);
    const polygon = polygonForOutput(feature.geometry, precision, simplifyStep);

    if (!cityId || !regionId) {
      skipped.push({ reason: 'invalid-derived-parent-code', id, properties: compactProperties(properties) });
      continue;
    }

    if (polygon.length < 3) {
      skipped.push({ reason: 'empty-polygon', id, properties: compactProperties(properties) });
      continue;
    }

    if (bounds[id] || centroids[id]) {
      overwritten += 1;
    }

    bounds[id] = nextBounds;
    centroids[id] = nextCentroid;

    const polygonPath = path.join(out, 'polygons', 'barangays', cityId, `${id}.json`);
    writeJson(polygonPath, polygon);
    polygonCount += 1;

    cityBounds[cityId] = expandBounds(cityBounds[cityId], bounds[id]);
    if (provinceId) {
      provinceBounds[provinceId] = expandBounds(provinceBounds[provinceId], bounds[id]);
    }
    regionBounds[regionId] = expandBounds(regionBounds[regionId], bounds[id]);
  } else {
    if (bounds[id] || centroids[id]) {
      overwritten += 1;
    }

    bounds[id] = nextBounds;
    centroids[id] = nextCentroid;
  }

  importedRows.push({
    id,
    level,
    bounds: bounds[id],
    centroid: centroids[id]
  });
}

for (const [id, rowBounds] of Object.entries(cityBounds)) {
  cityBounds[id] = rowBounds.map((value) => round(value, precision));
}
for (const [id, rowBounds] of Object.entries(provinceBounds)) {
  provinceBounds[id] = rowBounds.map((value) => round(value, precision));
}
for (const [id, rowBounds] of Object.entries(regionBounds)) {
  regionBounds[id] = rowBounds.map((value) => round(value, precision));
}

writeJson(boundsFile, bounds);
writeJson(centroidsFile, centroids);

if (level === 'barangay') {
  writeJson(cityBoundsFile, cityBounds);
  writeJson(provinceBoundsFile, provinceBounds);
  writeJson(regionBoundsFile, regionBounds);
}

const reportFile = path.join(out, `import-${levelPlural}-report.json`);
writeJson(reportFile, {
  generatedAt: new Date().toISOString(),
  input,
  level,
  idProp,
  merge,
  options: {
    precision,
    simplifyStep
  },
  counts: {
    featureCount: features.length,
    importedCount: importedRows.length,
    overwritten,
    polygonCount,
    skippedCount: skipped.length,
    boundsCount: countKeys(bounds),
    centroidsCount: countKeys(centroids),
    cityBoundsCount: countKeys(cityBounds),
    provinceBoundsCount: countKeys(provinceBounds),
    regionBoundsCount: countKeys(regionBounds)
  },
  skippedSummary: summarizeSkipped(skipped),
  imported: importedRows.slice(0, 500),
  skipped: skipped.slice(0, 500)
});

console.log(`Imported ${importedRows.length} ${levelPlural}.`);
console.log(`Wrote ${polygonCount} polygon files.`);
if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} features. See ${reportFile}`);
}
