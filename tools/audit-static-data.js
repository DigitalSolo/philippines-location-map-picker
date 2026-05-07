import fs from 'node:fs';
import path from 'node:path';
import { productionPsgcThresholds, productionSourceMetadata } from './production-thresholds.js';

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
  return files.sort();
}

function countRowsInJsonFiles(dir) {
  let rows = 0;
  const files = walkJsonFiles(dir);

  for (const file of files) {
    const data = readJson(file, []);
    if (Array.isArray(data)) {
      rows += data.length;
    } else if (data && typeof data === 'object') {
      rows += Object.keys(data).length;
    }
  }

  return { files: files.length, rows };
}

function fileStatus(file) {
  const exists = fs.existsSync(file);
  return {
    path: file.replace(/\\/g, '/'),
    exists,
    bytes: exists ? fs.statSync(file).size : 0
  };
}

function requiredFile(root, relativePath, warnings) {
  const fullPath = path.join(root, relativePath);
  const status = fileStatus(fullPath);
  if (!status.exists) {
    warnings.push(`Missing required static data file: ${relativePath}`);
  }
  return status;
}

function optionalFile(root, relativePath) {
  return fileStatus(path.join(root, relativePath));
}

function summarizePsgc(psgcRoot, warnings) {
  const regionsFile = requiredFile(psgcRoot, 'regions.json', warnings);
  const regions = readJson(path.join(psgcRoot, 'regions.json'), []);
  const provinces = countRowsInJsonFiles(path.join(psgcRoot, 'provinces'));
  const cities = countRowsInJsonFiles(path.join(psgcRoot, 'cities'));
  const barangays = countRowsInJsonFiles(path.join(psgcRoot, 'barangays'));

  if (!Array.isArray(regions) || regions.length === 0) {
    warnings.push('PSGC regions.json has no rows.');
  }
  if (cities.rows === 0) {
    warnings.push('PSGC cities folder has no rows.');
  }
  if (barangays.rows === 0) {
    warnings.push('PSGC barangays folder has no rows.');
  }

  return {
    root: psgcRoot.replace(/\\/g, '/'),
    requiredFiles: { regions: regionsFile },
    counts: {
      regions: Array.isArray(regions) ? regions.length : 0,
      provinceFiles: provinces.files,
      provinces: provinces.rows,
      cityFiles: cities.files,
      cities: cities.rows,
      barangayFiles: barangays.files,
      barangays: barangays.rows
    }
  };
}

function summarizeGeo(geoRoot, warnings) {
  const boundsRoot = path.join(geoRoot, 'bounds');
  const centroidsRoot = path.join(geoRoot, 'centroids');
  const polygonsRoot = path.join(geoRoot, 'polygons', 'barangays');

  const bounds = {
    regions: optionalFile(geoRoot, 'bounds/regions.json'),
    provinces: optionalFile(geoRoot, 'bounds/provinces.json'),
    cities: optionalFile(geoRoot, 'bounds/cities.json'),
    barangays: optionalFile(geoRoot, 'bounds/barangays.json')
  };

  const centroids = {
    regions: optionalFile(geoRoot, 'centroids/regions.json'),
    provinces: optionalFile(geoRoot, 'centroids/provinces.json'),
    cities: optionalFile(geoRoot, 'centroids/cities.json'),
    barangays: optionalFile(geoRoot, 'centroids/barangays.json')
  };

  const polygonFiles = walkJsonFiles(polygonsRoot);
  const boundsCounts = countRowsInJsonFiles(boundsRoot);
  const centroidCounts = countRowsInJsonFiles(centroidsRoot);

  if (!bounds.barangays.exists && polygonFiles.length === 0) {
    warnings.push('No barangay geometry found. Reverse-fill in static mode will not match barangays.');
  }
  if (!bounds.cities.exists) {
    warnings.push('Missing geo/bounds/cities.json. Static reverse-fill must scan wider or rely on explicit city context.');
  }

  return {
    root: geoRoot.replace(/\\/g, '/'),
    files: {
      bounds,
      centroids,
      barangayPolygonFiles: polygonFiles.map((file) => file.replace(/\\/g, '/'))
    },
    counts: {
      boundsFiles: boundsCounts.files,
      boundsRows: boundsCounts.rows,
      centroidFiles: centroidCounts.files,
      centroidRows: centroidCounts.rows,
      barangayPolygonFiles: polygonFiles.length
    }
  };
}

function coverageAssessment(psgc, geo) {
  const counts = psgc.counts || {};
  const geoCounts = geo.counts || {};
  const regions = Number(counts.regions || 0);
  const provinces = Number(counts.provinces || 0);
  const cities = Number(counts.cities || 0);
  const barangays = Number(counts.barangays || 0);
  const polygons = Number(geoCounts.barangayPolygonFiles || 0);
  const geometryCoversCachedPsgc = barangays > 0 && polygons >= barangays;

  const thresholds = productionPsgcThresholds();
  const sourceMetadata = productionSourceMetadata();

  const broadPhilippinesPsgcCoverage =
    regions >= thresholds.regions &&
    provinces >= thresholds.provinces &&
    cities >= thresholds.citiesAndMunicipalities &&
    barangays >= thresholds.barangays;

  const broadPhilippinesGeometryCoverage = polygons >= thresholds.barangayPolygons;
  const productionHierarchyReady = broadPhilippinesPsgcCoverage;
  const productionReverseFillReady = broadPhilippinesPsgcCoverage && broadPhilippinesGeometryCoverage && geometryCoversCachedPsgc;
  const productionReady = productionReverseFillReady;

  let level = 'incomplete';
  if (productionReverseFillReady) {
    level = 'production-full-geometry';
  } else if (productionHierarchyReady) {
    level = 'production-hierarchy-limited-geometry';
  } else if (barangays > 0 && polygons > 0) {
    level = 'pilot';
  } else if (barangays > 0) {
    level = 'pilot-hierarchy-only';
  }

  const reasons = [];
  const blockers = [];

  if (!broadPhilippinesPsgcCoverage) {
    const message = 'Cached PSGC hierarchy is below nationwide Philippines coverage thresholds.';
    reasons.push(message);
    blockers.push({
      code: 'psgc_below_nationwide_threshold',
      message,
      actual: { regions, provinces, citiesAndMunicipalities: cities, barangays },
      required: {
        regions: thresholds.regions,
        provinces: thresholds.provinces,
        citiesAndMunicipalities: thresholds.citiesAndMunicipalities,
        barangays: thresholds.barangays
      }
    });
  }
  if (!broadPhilippinesGeometryCoverage) {
    reasons.push('Cached barangay geometry is below nationwide reverse-fill coverage thresholds. This is acceptable only for hierarchy-only production mode.');
  }
  if (barangays > 0 && polygons > 0 && !geometryCoversCachedPsgc) {
    reasons.push('Cached geometry does not cover every cached PSGC barangay. Reverse-fill must be treated as partial.');
  }

  return {
    level,
    productionReady,
    productionHierarchyReady,
    productionReverseFillReady,
    geometryCoversCachedPsgc,
    broadPhilippinesPsgcCoverage,
    broadPhilippinesGeometryCoverage,
    geometryPolicyRecommendation: productionReverseFillReady ? 'full' : 'limited',
    thresholds,
    sourceMetadata,
    releaseModes: {
      pilot: barangays > 0,
      productionHierarchyOnly: productionHierarchyReady,
      productionFullReverseFill: productionReverseFillReady
    },
    reasons,
    blockers
  };
}
const args = parseArgs(process.argv);
const psgcRoot = args.psgc || 'data/psgc';
const geoRoot = args.geo || 'data/geo';
const outFile = args.out || 'data/static-data-report.json';
const warnings = [];

const psgcSummary = summarizePsgc(psgcRoot, warnings);
const geoSummary = summarizeGeo(geoRoot, warnings);

const report = {
  generatedAt: new Date().toISOString(),
  expectedStructure: {
    psgc: [
      'regions.json',
      'provinces/{region_id}.json',
      'cities/{province_id}.json',
      'cities/{region_id}.json for province-less regions',
      'barangays/{city_id}.json'
    ],
    geo: [
      'bounds/regions.json',
      'bounds/provinces.json',
      'bounds/cities.json',
      'bounds/barangays.json',
      'centroids/{level}.json',
      'polygons/barangays/{city_id}/{barangay_id}.json'
    ]
  },
  psgc: psgcSummary,
  geo: geoSummary,
  coverage: coverageAssessment(psgcSummary, geoSummary),
  coverageReport: fileStatus(path.join(geoRoot, 'geometry-coverage-report.json')),
  reconciliationReport: fileStatus(path.join(geoRoot, 'psgc-geometry-reconciliation-report.json')),
  warnings,
  ok: warnings.length === 0
};

writeJson(outFile, report);
console.log(`PSGC regions: ${report.psgc.counts.regions}`);
console.log(`PSGC cities: ${report.psgc.counts.cities}`);
console.log(`PSGC barangays: ${report.psgc.counts.barangays}`);
console.log(`Geometry bounds rows: ${report.geo.counts.boundsRows}`);
console.log(`Geometry polygon files: ${report.geo.counts.barangayPolygonFiles}`);
console.log(`Coverage level: ${report.coverage.level}`);
console.log(`Production broad coverage: ${report.coverage.productionReady ? 'yes' : 'no'}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Wrote ${outFile}`);
