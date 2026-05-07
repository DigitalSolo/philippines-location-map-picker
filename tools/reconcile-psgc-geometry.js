import fs from 'node:fs';
import path from 'node:path';
import {
  barangayCodeCandidates,
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

function walkJsonFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function rowId(row) {
  return cleanPsgcCode(row?.id || row?.code || row?.psgcCode || row?.psgc_code || row?.psgc_10d);
}

function rowName(row) {
  return String(row?.name || row?.barangayName || row?.barangay_name || row?.brgy_name || '').trim();
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bbarangay\b/g, 'brgy')
    .replace(/\bpoblacion\b/g, 'pob')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addMapList(map, key, value) {
  if (!key) {
    return;
  }
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

function firstExactOrCandidate(map, id) {
  const exact = map.get(id);
  if (exact && exact.length > 0) {
    return exact[0];
  }

  for (const candidate of barangayCodeCandidates(id)) {
    const rows = map.get(candidate);
    if (rows && rows.length > 0) {
      return rows[0];
    }
  }

  return null;
}

function hasCandidateMatch(map, id) {
  return Boolean(firstExactOrCandidate(map, id));
}

function loadRegions(psgcRoot) {
  const rows = readJson(path.join(psgcRoot, 'regions.json'), []);
  const regions = new Map();
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const id = rowId(row);
      if (id) {
        regions.set(id, { id, name: rowName(row) });
      }
    }
  }
  return regions;
}

function loadProvinces(psgcRoot) {
  const provinces = new Map();
  for (const file of walkJsonFiles(path.join(psgcRoot, 'provinces'))) {
    const regionId = path.basename(file, '.json');
    const rows = readJson(file, []);
    if (!Array.isArray(rows)) {
      continue;
    }
    for (const row of rows) {
      const id = rowId(row);
      if (id) {
        provinces.set(id, { id, name: rowName(row), regionId });
      }
    }
  }
  return provinces;
}

function loadCities(psgcRoot, provinces) {
  const cities = new Map();
  for (const file of walkJsonFiles(path.join(psgcRoot, 'cities'))) {
    const parentId = path.basename(file, '.json');
    const rows = readJson(file, []);
    if (!Array.isArray(rows)) {
      continue;
    }
    for (const row of rows) {
      const id = rowId(row);
      if (!id) {
        continue;
      }
      const parentProvince = provinces.get(parentId);
      cities.set(id, {
        id,
        name: rowName(row),
        provinceId: parentProvince ? parentProvince.id : deriveProvinceId(id),
        regionId: parentProvince ? parentProvince.regionId : parentId
      });
    }
  }
  return cities;
}

function loadPsgcBarangays(psgcRoot, cities, provinces, regions) {
  const barangays = [];
  for (const file of walkJsonFiles(path.join(psgcRoot, 'barangays'))) {
    const cityIdFromFile = path.basename(file, '.json');
    const city = cities.get(cityIdFromFile) || null;
    const rows = readJson(file, []);
    if (!Array.isArray(rows)) {
      continue;
    }
    for (const row of rows) {
      const id = rowId(row);
      if (!id) {
        continue;
      }
      const cityId = city?.id || cityIdFromFile || deriveCityId(id);
      const provinceId = city?.provinceId || deriveProvinceId(id);
      const regionId = city?.regionId || deriveRegionId(id);
      barangays.push({
        id,
        name: rowName(row),
        normalizedName: normalizeName(rowName(row)),
        cityId,
        cityName: cities.get(cityId)?.name || '',
        provinceId,
        provinceName: provinces.get(provinceId)?.name || '',
        regionId,
        regionName: regions.get(regionId)?.name || ''
      });
    }
  }
  return barangays;
}

function loadGeometryNamesFromReports(geoRoot) {
  const names = new Map();
  const meta = new Map();
  const reportFiles = [
    path.join(geoRoot, 'cache-arcgis-report.json'),
    path.join(geoRoot, 'import-barangays-report.json')
  ];

  for (const reportFile of reportFiles) {
    const report = readJson(reportFile, null);
    if (!report) {
      continue;
    }

    const importedRows = Array.isArray(report.imported) ? report.imported : [];
    for (const row of importedRows) {
      const id = cleanPsgcCode(row.barangayId || row.id);
      if (!id) {
        continue;
      }
      const name = row.barangayName || row.name || '';
      if (name) {
        names.set(id, String(name).trim());
      }
      meta.set(id, {
        cityId: cleanPsgcCode(row.cityId || row.city_id || deriveCityId(id)),
        provinceId: cleanPsgcCode(row.provinceId || row.province_id || deriveProvinceId(id)),
        regionId: cleanPsgcCode(row.regionId || row.region_id || deriveRegionId(id)),
        cityName: row.cityName || '',
        provinceName: row.provinceName || '',
        regionName: row.regionName || '',
        reportFile: path.relative(process.cwd(), reportFile)
      });
    }
  }

  return { names, meta };
}

function loadGeometryBarangays(geoRoot) {
  const bounds = readJson(path.join(geoRoot, 'bounds', 'barangays.json'), {});
  const centroids = readJson(path.join(geoRoot, 'centroids', 'barangays.json'), {});
  const { names, meta } = loadGeometryNamesFromReports(geoRoot);
  const rows = new Map();

  function ensure(id) {
    const cleanId = cleanPsgcCode(id);
    if (!cleanId) {
      return null;
    }
    if (!rows.has(cleanId)) {
      const reportMeta = meta.get(cleanId) || {};
      rows.set(cleanId, {
        id: cleanId,
        name: names.get(cleanId) || '',
        normalizedName: normalizeName(names.get(cleanId) || ''),
        cityId: reportMeta.cityId || deriveCityId(cleanId),
        provinceId: reportMeta.provinceId || deriveProvinceId(cleanId),
        regionId: reportMeta.regionId || deriveRegionId(cleanId),
        cityName: reportMeta.cityName || '',
        provinceName: reportMeta.provinceName || '',
        regionName: reportMeta.regionName || '',
        reportFile: reportMeta.reportFile || '',
        bounds: false,
        centroid: false,
        polygon: false
      });
    }
    return rows.get(cleanId);
  }

  for (const id of Object.keys(bounds || {})) {
    const row = ensure(id);
    if (row) {
      row.bounds = true;
    }
  }

  for (const id of Object.keys(centroids || {})) {
    const row = ensure(id);
    if (row) {
      row.centroid = true;
    }
  }

  for (const file of walkJsonFiles(path.join(geoRoot, 'polygons', 'barangays'))) {
    const id = path.basename(file, '.json');
    const row = ensure(id);
    if (row) {
      row.polygon = true;
    }
  }

  return [...rows.values()];
}

function publicPsgcRow(row) {
  return {
    id: row.id,
    name: row.name,
    cityId: row.cityId,
    cityName: row.cityName,
    provinceId: row.provinceId,
    provinceName: row.provinceName,
    regionId: row.regionId,
    regionName: row.regionName
  };
}

function publicGeometryRow(row) {
  return {
    id: row.id,
    name: row.name,
    cityId: row.cityId,
    cityName: row.cityName,
    provinceId: row.provinceId,
    provinceName: row.provinceName,
    regionId: row.regionId,
    regionName: row.regionName,
    bounds: row.bounds,
    centroid: row.centroid,
    polygon: row.polygon,
    reportFile: row.reportFile
  };
}

function componentGaps(geometry) {
  const missing = [];
  if (!geometry.bounds) {
    missing.push('bounds');
  }
  if (!geometry.centroid) {
    missing.push('centroid');
  }
  if (!geometry.polygon) {
    missing.push('polygon');
  }
  return missing;
}

const args = parseArgs(process.argv);
const psgcRoot = args.psgc || 'data/psgc';
const geoRoot = args.geo || 'data/geo';
const outFile = args.out || path.join(geoRoot, 'psgc-geometry-reconciliation-report.json');

const regions = loadRegions(psgcRoot);
const provinces = loadProvinces(psgcRoot);
const cities = loadCities(psgcRoot, provinces);
const psgcBarangays = loadPsgcBarangays(psgcRoot, cities, provinces, regions);
const geometryBarangays = loadGeometryBarangays(geoRoot);

const psgcByCandidate = new Map();
const geometryByCandidate = new Map();
const psgcNameCityIndex = new Map();

for (const row of psgcBarangays) {
  for (const candidate of barangayCodeCandidates(row.id)) {
    addMapList(psgcByCandidate, candidate, row);
  }

  const cityScopedName = `${row.cityId}|${row.normalizedName}`;
  addMapList(psgcNameCityIndex, cityScopedName, row);
}

for (const row of geometryBarangays) {
  for (const candidate of barangayCodeCandidates(row.id)) {
    addMapList(geometryByCandidate, candidate, row);
  }
}

const exactMatches = [];
const codeFormatMatches = [];
const geometryComponentGaps = [];
const geometryNameMismatches = [];
const psgcWithoutGeometry = [];
const geometryWithoutPsgc = [];
const possibleRenamedOrStaleGeometry = [];
const staleGeometryCodes = [];

for (const psgc of psgcBarangays) {
  const geometry = firstExactOrCandidate(geometryByCandidate, psgc.id);

  if (!geometry) {
    psgcWithoutGeometry.push(publicPsgcRow(psgc));
    continue;
  }

  const matchRow = {
    psgc: publicPsgcRow(psgc),
    geometry: publicGeometryRow(geometry)
  };

  if (geometry.id === psgc.id) {
    exactMatches.push(matchRow);
  } else {
    codeFormatMatches.push({
      ...matchRow,
      note: 'IDs differ, but PSGC candidate forms match.'
    });
  }

  const missingComponents = componentGaps(geometry);
  if (missingComponents.length > 0) {
    geometryComponentGaps.push({
      ...matchRow,
      missingComponents
    });
  }

  if (geometry.name && psgc.normalizedName && geometry.normalizedName && geometry.normalizedName !== psgc.normalizedName) {
    geometryNameMismatches.push({
      ...matchRow,
      note: 'Same code/candidate match, but names differ.'
    });
  }
}

for (const geometry of geometryBarangays) {
  const psgc = firstExactOrCandidate(psgcByCandidate, geometry.id);
  if (psgc) {
    continue;
  }

  const baseGeometry = publicGeometryRow(geometry);
  geometryWithoutPsgc.push(baseGeometry);

  let possibleMatches = [];
  if (geometry.normalizedName) {
    possibleMatches = psgcNameCityIndex.get(`${geometry.cityId}|${geometry.normalizedName}`) || [];
  }

  if (possibleMatches.length > 0) {
    possibleRenamedOrStaleGeometry.push({
      geometry: baseGeometry,
      possiblePsgcMatches: possibleMatches.map(publicPsgcRow),
      note: 'Geometry code is not present in PSGC cache, but name/city matches a PSGC barangay.'
    });
  } else {
    staleGeometryCodes.push({
      geometry: baseGeometry,
      note: 'Geometry code is not present in PSGC cache and no same-city name match was found.'
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  psgcRoot,
  geoRoot,
  counts: {
    psgcBarangays: psgcBarangays.length,
    geometryBarangays: geometryBarangays.length,
    exactMatches: exactMatches.length,
    codeFormatMatches: codeFormatMatches.length,
    psgcWithoutGeometry: psgcWithoutGeometry.length,
    geometryWithoutPsgc: geometryWithoutPsgc.length,
    possibleRenamedOrStaleGeometry: possibleRenamedOrStaleGeometry.length,
    staleGeometryCodes: staleGeometryCodes.length,
    geometryNameMismatches: geometryNameMismatches.length,
    geometryComponentGaps: geometryComponentGaps.length
  },
  psgcWithoutGeometry,
  geometryWithoutPsgc,
  possibleRenamedOrStaleGeometry,
  staleGeometryCodes,
  codeFormatMatches,
  geometryNameMismatches,
  geometryComponentGaps
};

writeJson(outFile, report);
console.log(`PSGC barangays: ${report.counts.psgcBarangays}`);
console.log(`Geometry barangays: ${report.counts.geometryBarangays}`);
console.log(`Exact matches: ${report.counts.exactMatches}`);
console.log(`Code-format matches: ${report.counts.codeFormatMatches}`);
console.log(`PSGC without geometry: ${report.counts.psgcWithoutGeometry}`);
console.log(`Geometry without PSGC: ${report.counts.geometryWithoutPsgc}`);
console.log(`Possible renamed/stale geometry: ${report.counts.possibleRenamedOrStaleGeometry}`);
console.log(`Stale geometry codes: ${report.counts.staleGeometryCodes}`);
console.log(`Name mismatches: ${report.counts.geometryNameMismatches}`);
console.log(`Component gaps: ${report.counts.geometryComponentGaps}`);
console.log(`Wrote ${outFile}`);
