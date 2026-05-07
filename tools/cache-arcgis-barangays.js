import fs from 'node:fs';
import path from 'node:path';
import {
  barangayCodeCandidates,
  cityCodeCandidates,
  cleanPsgcCode,
  deriveCityId,
  deriveProvinceId,
  deriveRegionId,
  provinceCodeCandidates,
  regionCodeCandidates
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

  if (geometry.type === 'Polygon') {
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
  if (step <= 1 || ring.length <= 12) {
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

function polygonFromGeometry(geometry, precision, simplifyStep) {
  return simplifyRing(largestRing(geometry), simplifyStep)
    .map(([lng, lat]) => ({
      lat: round(lat, precision),
      lng: round(lng, precision)
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function boundsAndCentroid(polygon) {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  let latSum = 0;
  let lngSum = 0;
  let count = 0;

  polygon.forEach((point) => {
    south = Math.min(south, point.lat);
    west = Math.min(west, point.lng);
    north = Math.max(north, point.lat);
    east = Math.max(east, point.lng);
    latSum += point.lat;
    lngSum += point.lng;
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

function escapeSql(value) {
  return String(value || '').replace(/'/g, "''");
}

function sqlIn(field, values) {
  const cleanValues = [...new Set(values.map(cleanPsgcCode).filter(Boolean))];

  if (cleanValues.length === 0) {
    return '';
  }

  return cleanValues.map((value) => `${field}='${escapeSql(value)}'`).join(' OR ');
}

function sqlLike(field, prefixes) {
  const cleanPrefixes = [...new Set(prefixes.map(cleanPsgcCode).filter(Boolean))];

  if (cleanPrefixes.length === 0) {
    return '';
  }

  return cleanPrefixes.map((value) => `${field} LIKE '${escapeSql(value)}%'`).join(' OR ');
}

function orGroup(parts) {
  const cleanParts = parts.filter(Boolean);
  if (cleanParts.length === 0) {
    return '';
  }
  return `(${cleanParts.join(' OR ')})`;
}

function featureKey(feature) {
  const props = feature && feature.properties ? feature.properties : {};
  return String(props.psgc_10d || props.brgy_code || feature.id || JSON.stringify(props)).trim();
}

async function queryArcGis(baseUrl, params) {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/query`);

  Object.entries({
    f: 'geojson',
    outFields: 'OBJECTID,reg_name,prov_name,city_name,brgy_name,reg_code,prov_code,city_code,brgy_code,psgc_10d',
    outSR: '4326',
    returnGeometry: 'true',
    returnExceededLimitFeatures: 'true',
    ...params
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ArcGIS request failed (${response.status}) ${url.toString()}`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message || 'ArcGIS request failed.');
  }

  return json;
}

async function queryArcGisAll(baseUrl, params, pageSize, maxPages) {
  const allFeatures = [];
  const seenKeys = new Set();
  const pageSummaries = [];
  let offset = 0;
  let page = 1;

  while (page <= maxPages) {
    const data = await queryArcGis(baseUrl, {
      ...params,
      orderByFields: params.orderByFields || 'OBJECTID ASC',
      resultOffset: offset,
      resultRecordCount: pageSize
    });
    const features = Array.isArray(data.features) ? data.features : [];
    let duplicateCount = 0;
    let acceptedCount = 0;

    for (const feature of features) {
      const key = featureKey(feature);
      if (seenKeys.has(key)) {
        duplicateCount += 1;
        continue;
      }
      seenKeys.add(key);
      allFeatures.push(feature);
      acceptedCount += 1;
    }

    pageSummaries.push({
      page,
      offset,
      returned: features.length,
      accepted: acceptedCount,
      duplicates: duplicateCount,
      exceededTransferLimit: Boolean(data.exceededTransferLimit)
    });

    if (!data.exceededTransferLimit && features.length < pageSize) {
      break;
    }

    if (features.length === 0 || acceptedCount === 0) {
      break;
    }

    offset += features.length;
    page += 1;
    console.log(`Fetched ArcGIS page ${page}, unique features so far: ${allFeatures.length}`);
  }

  return {
    type: 'FeatureCollection',
    features: allFeatures,
    paging: {
      pageSize,
      maxPages,
      pagesFetched: pageSummaries.length,
      pageSummaries,
      stoppedAtMaxPages: pageSummaries.length >= maxPages
    }
  };
}

function prefixesFromCandidates(candidates) {
  return candidates
    .map((candidate) => cleanPsgcCode(candidate).replace(/0+$/, ''))
    .filter(Boolean);
}

function buildWhere(args) {
  if (args.where) {
    return args.where;
  }

  if (args.barangay) {
    const candidates = barangayCodeCandidates(args.barangay);
    return orGroup([
      sqlIn('psgc_10d', candidates),
      sqlIn('brgy_code', candidates)
    ]);
  }

  if (args.city) {
    const candidates = cityCodeCandidates(args.city);
    return orGroup([
      sqlIn('city_code', candidates),
      sqlLike('psgc_10d', prefixesFromCandidates(candidates))
    ]);
  }

  if (args.province) {
    const candidates = provinceCodeCandidates(args.province);
    return orGroup([
      sqlIn('prov_code', candidates),
      sqlLike('psgc_10d', prefixesFromCandidates(candidates))
    ]);
  }

  if (args.region) {
    const candidates = regionCodeCandidates(args.region);
    return orGroup([
      sqlIn('reg_code', candidates),
      sqlLike('psgc_10d', prefixesFromCandidates(candidates))
    ]);
  }

  throw new Error('Provide --barangay, --city, --province, --region, or --where.');
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
const out = args.out || 'data/geo';
const baseUrl = args.baseUrl || args['base-url'] || 'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4';
const precision = Number(args.precision || 6);
const simplifyStep = Math.max(1, Number(args['simplify-step'] || 3));
const pageSize = Math.max(1, Number(args['page-size'] || 1000));
const maxPages = Math.max(1, Number(args['max-pages'] || 100));
const where = buildWhere(args);

console.log(`Querying ArcGIS barangay boundaries with: ${where}`);

const data = await queryArcGisAll(baseUrl, {
  where,
  geometryPrecision: precision
}, pageSize, maxPages);

const features = Array.isArray(data.features) ? data.features : [];
console.log(`Unique features returned: ${features.length}`);

const boundsFile = path.join(out, 'bounds', 'barangays.json');
const centroidsFile = path.join(out, 'centroids', 'barangays.json');
const cityBoundsFile = path.join(out, 'bounds', 'cities.json');
const provinceBoundsFile = path.join(out, 'bounds', 'provinces.json');
const regionBoundsFile = path.join(out, 'bounds', 'regions.json');

const barangayBounds = readJson(boundsFile, {});
const barangayCentroids = readJson(centroidsFile, {});
const cityBounds = readJson(cityBoundsFile, {});
const provinceBounds = readJson(provinceBoundsFile, {});
const regionBounds = readJson(regionBoundsFile, {});

const importedRows = [];
const skippedRows = [];
let imported = 0;
let overwritten = 0;
let polygonFilesWritten = 0;

for (const feature of features) {
  const props = feature.properties || {};
  const barangayId = cleanPsgcCode(props.psgc_10d || props.brgy_code);

  if (!barangayId) {
    skippedRows.push({ status: 'skipped', reason: 'missing psgc_10d/brgy_code', properties: compactProperties(props) });
    continue;
  }

  const polygon = polygonFromGeometry(feature.geometry, precision, simplifyStep);

  if (polygon.length < 3) {
    skippedRows.push({ status: 'skipped', reason: 'empty polygon', barangayId, properties: compactProperties(props) });
    continue;
  }

  const calculated = boundsAndCentroid(polygon);

  if (!calculated) {
    skippedRows.push({ status: 'skipped', reason: 'empty bounds', barangayId, properties: compactProperties(props) });
    continue;
  }

  const cityId = deriveCityId(barangayId);
  const provinceId = deriveProvinceId(barangayId);
  const regionId = deriveRegionId(barangayId);

  if (!cityId || !regionId) {
    skippedRows.push({ status: 'skipped', reason: 'invalid derived parent code', barangayId, properties: compactProperties(props) });
    continue;
  }

  if (barangayBounds[barangayId] || barangayCentroids[barangayId]) {
    overwritten += 1;
  }

  barangayBounds[barangayId] = calculated.bounds.map((value) => round(value, precision));
  barangayCentroids[barangayId] = {
    lat: round(calculated.centroid.lat, precision),
    lng: round(calculated.centroid.lng, precision)
  };

  cityBounds[cityId] = expandBounds(cityBounds[cityId], barangayBounds[barangayId]);
  if (provinceId) {
    provinceBounds[provinceId] = expandBounds(provinceBounds[provinceId], barangayBounds[barangayId]);
  }
  regionBounds[regionId] = expandBounds(regionBounds[regionId], barangayBounds[barangayId]);

  const polygonFile = path.join(out, 'polygons', 'barangays', cityId, `${barangayId}.json`);
  writeJson(polygonFile, polygon);
  polygonFilesWritten += 1;

  importedRows.push({
    status: 'imported',
    barangayId,
    cityId,
    provinceId,
    regionId,
    regionName: props.reg_name || '',
    provinceName: props.prov_name || '',
    cityName: props.city_name || '',
    barangayName: props.brgy_name || '',
    pointCount: polygon.length
  });

  imported += 1;
}

for (const [id, bounds] of Object.entries(cityBounds)) {
  cityBounds[id] = bounds.map((value) => round(value, precision));
}
for (const [id, bounds] of Object.entries(provinceBounds)) {
  provinceBounds[id] = bounds.map((value) => round(value, precision));
}
for (const [id, bounds] of Object.entries(regionBounds)) {
  regionBounds[id] = bounds.map((value) => round(value, precision));
}

writeJson(boundsFile, barangayBounds);
writeJson(centroidsFile, barangayCentroids);
writeJson(cityBoundsFile, cityBounds);
writeJson(provinceBoundsFile, provinceBounds);
writeJson(regionBoundsFile, regionBounds);
writeJson(path.join(out, 'cache-arcgis-report.json'), {
  generatedAt: new Date().toISOString(),
  baseUrl,
  where,
  scope: {
    region: args.region || '',
    province: args.province || '',
    city: args.city || '',
    barangay: args.barangay || '',
    where: args.where || ''
  },
  options: {
    precision,
    simplifyStep,
    pageSize,
    maxPages
  },
  paging: data.paging,
  counts: {
    featuresReturned: features.length,
    imported,
    overwritten,
    skipped: skippedRows.length,
    polygonFilesWritten,
    barangayBounds: countKeys(barangayBounds),
    barangayCentroids: countKeys(barangayCentroids),
    cityBounds: countKeys(cityBounds),
    provinceBounds: countKeys(provinceBounds),
    regionBounds: countKeys(regionBounds)
  },
  skippedSummary: summarizeSkipped(skippedRows),
  imported: importedRows,
  skipped: skippedRows.slice(0, 500)
});

console.log(`Imported ${imported} barangay boundaries.`);
console.log(`Skipped ${skippedRows.length} features.`);
console.log(`Wrote ${path.join(out, 'cache-arcgis-report.json')}`);
