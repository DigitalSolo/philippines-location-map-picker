import fs from 'node:fs';
import path from 'node:path';
import { barangayCodeCandidates, cityCodeCandidates, deriveCityId, sameCity } from '../src/geo/psgcCodes.js';

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

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function rowId(row) {
  return String(row && (row.id || row.code) || '').trim();
}

function rowName(row) {
  return String(row && row.name || '').trim();
}

const polygonIds = new Set();

function hasPolygon(geoRoot, barangayId) {
  if (polygonIds.has(barangayId)) {
    return true;
  }
  for (const candidate of barangayCodeCandidates(barangayId)) {
    if (polygonIds.has(candidate)) {
      return true;
    }
  }
  return false;
}

const args = parseArgs(process.argv);
const psgcRoot = args.psgc || 'data/psgc';
const geoRoot = args.geo || 'data/geo';
const outFile = args.out || path.join(geoRoot, 'geometry-coverage-report.json');

const psgcBarangays = new Map();
const psgcCityBarangayCounts = new Map();

for (const file of walkJsonFiles(path.join(psgcRoot, 'barangays'))) {
  const cityIdFromFile = path.basename(file, '.json');
  const rows = readJson(file, []);
  if (!Array.isArray(rows)) {
    continue;
  }

  for (const row of rows) {
    const id = rowId(row);
    if (!id) {
      continue;
    }
    psgcBarangays.set(id, {
      id,
      name: rowName(row),
      city_id: cityIdFromFile
    });
    psgcCityBarangayCounts.set(cityIdFromFile, (psgcCityBarangayCounts.get(cityIdFromFile) || 0) + 1);
  }
}

const barangayBounds = readJson(path.join(geoRoot, 'bounds', 'barangays.json'), {});
const centroidData = readJson(path.join(geoRoot, 'centroids', 'barangays.json'), {});
const geometryIds = new Set([...Object.keys(barangayBounds), ...Object.keys(centroidData)]);

for (const file of walkJsonFiles(path.join(geoRoot, 'polygons', 'barangays'))) {
  const polygonId = path.basename(file, '.json');
  polygonIds.add(polygonId);
  geometryIds.add(polygonId);
}

const missingGeometry = [];
const withGeometry = [];

for (const barangay of psgcBarangays.values()) {
  const boundsPresent = Boolean(barangayBounds[barangay.id]);
  const centroidPresent = Boolean(centroidData[barangay.id]);
  const polygonPresent = hasPolygon(geoRoot, barangay.id);

  const row = {
    id: barangay.id,
    name: barangay.name,
    city_id: barangay.city_id,
    bounds: boundsPresent,
    centroid: centroidPresent,
    polygon: polygonPresent
  };

  if (boundsPresent || centroidPresent || polygonPresent) {
    withGeometry.push(row);
  } else {
    missingGeometry.push(row);
  }
}

function psgcHasBarangayId(id) {
  const candidates = barangayCodeCandidates(id);
  return candidates.some((candidate) => psgcBarangays.has(candidate));
}

function geometryBelongsToCity(geometryBarangayId, cityId) {
  const geometryCityId = deriveCityId(geometryBarangayId);
  return sameCity(geometryCityId, cityId) || cityCodeCandidates(cityId).includes(geometryCityId);
}

const geometryWithoutPsgc = [...geometryIds]
  .filter((id) => !psgcHasBarangayId(id))
  .sort()
  .map((id) => ({
    id,
    city_id: deriveCityId(id),
    bounds: Boolean(barangayBounds[id]),
    centroid: Boolean(centroidData[id]),
    polygon: hasPolygon(geoRoot, id)
  }));

const cityCoverage = [];
const psgcCityIds = [...psgcCityBarangayCounts.keys()].filter(Boolean).sort();
const geometryIdsCoveredByPsgcCities = new Set();

for (const cityId of psgcCityIds) {
  const geometryForCity = [...geometryIds].filter((id) => geometryBelongsToCity(id, cityId));
  geometryForCity.forEach((id) => geometryIdsCoveredByPsgcCities.add(id));

  const psgcCount = psgcCityBarangayCounts.get(cityId) || 0;
  const geometryCount = geometryForCity.length;

  cityCoverage.push({
    city_id: cityId,
    psgc_barangays: psgcCount,
    geometry_barangays: geometryCount,
    missing_geometry: Math.max(0, psgcCount - geometryCount)
  });
}

const geometryOnlyCityIds = new Set(
  [...geometryIds]
    .filter((id) => !geometryIdsCoveredByPsgcCities.has(id))
    .map((id) => deriveCityId(id))
    .filter(Boolean)
);

for (const cityId of [...geometryOnlyCityIds].sort()) {
  const geometryCount = [...geometryIds].filter((id) => deriveCityId(id) === cityId).length;
  cityCoverage.push({
    city_id: cityId,
    psgc_barangays: 0,
    geometry_barangays: geometryCount,
    missing_geometry: 0
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  psgcRoot,
  geoRoot,
  counts: {
    psgcBarangays: psgcBarangays.size,
    geometryBarangays: geometryIds.size,
    withGeometry: withGeometry.length,
    missingGeometry: missingGeometry.length,
    geometryWithoutPsgc: geometryWithoutPsgc.length
  },
  cityCoverage,
  missingGeometry,
  geometryWithoutPsgc
};

writeJson(outFile, report);
console.log(`PSGC barangays: ${report.counts.psgcBarangays}`);
console.log(`Geometry barangays: ${report.counts.geometryBarangays}`);
console.log(`Missing geometry: ${report.counts.missingGeometry}`);
console.log(`Geometry without PSGC: ${report.counts.geometryWithoutPsgc}`);
console.log(`Wrote ${outFile}`);
