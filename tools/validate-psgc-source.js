import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionHierarchyThresholds, productionSourceMetadata } from './production-thresholds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const DEFAULT_HIERARCHY_THRESHOLDS = productionHierarchyThresholds();
const DEFAULT_THRESHOLDS = {
  regions: DEFAULT_HIERARCHY_THRESHOLDS.regions,
  provinces: DEFAULT_HIERARCHY_THRESHOLDS.provinces,
  cities: DEFAULT_HIERARCHY_THRESHOLDS.citiesAndMunicipalities,
  barangays: DEFAULT_HIERARCHY_THRESHOLDS.barangays
};

function parseArgs(argv) {
  const args = {
    report: 'data/psgc-source-validation-report.json',
    minRegions: String(DEFAULT_THRESHOLDS.regions),
    minProvinces: String(DEFAULT_THRESHOLDS.provinces),
    minCities: String(DEFAULT_THRESHOLDS.cities),
    minBarangays: String(DEFAULT_THRESHOLDS.barangays)
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

function resolveInsidePackage(relativePath) {
  const clean = String(relativePath || '').replace(/^[\\/]+/, '');
  const resolved = path.resolve(root, clean);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Refusing to write outside the package root: ${relativePath}`);
  }
  return resolved;
}

function resolveInputPath(value) {
  if (!value) return '';
  if (path.isAbsolute(value)) return path.resolve(value);
  return path.resolve(process.cwd(), value);
}

function cleanCode(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getFirst(row, keys) {
  for (const key of keys) {
    if (!key) continue;
    const normalized = normalizeKey(key);
    if (Object.prototype.hasOwnProperty.call(row, normalized)) {
      return row[normalized];
    }
  }
  return '';
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((items) => items.some((item) => cleanText(item) !== ''));
  if (nonEmptyRows.length === 0) return { headers: [], rows: [] };

  const headers = nonEmptyRows[0].map((header, index) => normalizeKey(header || `column_${index + 1}`));
  return {
    headers,
    rows: nonEmptyRows.slice(1).map((items, rowIndex) => {
      const obj = { __sourceRow: rowIndex + 2 };
      headers.forEach((header, index) => {
        obj[header] = cleanText(items[index]);
      });
      return obj;
    })
  };
}

function normalizeObjectKeys(row, sourceRow) {
  const normalized = { __sourceRow: sourceRow };
  Object.entries(row || {}).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value;
  });
  return normalized;
}

function readRows(inputFile) {
  const text = readText(inputFile);
  const ext = path.extname(inputFile).toLowerCase();

  if (ext === '.json' || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    const parsed = JSON.parse(text);
    let rows = [];

    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (Array.isArray(parsed.data)) {
      rows = parsed.data;
    } else if (Array.isArray(parsed.items)) {
      rows = parsed.items;
    } else if (Array.isArray(parsed.records)) {
      rows = parsed.records;
    } else if (Array.isArray(parsed.features)) {
      rows = parsed.features.map((feature) => feature.properties || feature.attributes || feature);
    } else {
      throw new Error('JSON input must be an array or contain data/items/records/features array.');
    }

    const normalizedRows = rows.map((row, index) => normalizeObjectKeys(row, index + 1));
    const headers = [...new Set(normalizedRows.flatMap((row) => Object.keys(row).filter((key) => key !== '__sourceRow')))];
    return { headers, rows: normalizedRows };
  }

  return parseCsv(text);
}

function toTenDigitPsgcCode(value, level = '') {
  const code = cleanCode(value);

  if (code.length === 10) return code;

  if (level === 'region' && code.length === 2) return `${code}00000000`;

  if (level === 'province') {
    if (code.length === 4) return `${code.slice(0, 2)}0${code.slice(2, 4)}00000`;
    if (code.length === 5) return `${code}00000`;
  }

  if (level === 'city') {
    if (code.length === 6) return `${code.slice(0, 2)}0${code.slice(2, 4)}${code.slice(4, 6)}000`;
    if (code.length === 7) return `${code}000`;
  }

  if (level === 'barangay') {
    if (code.length === 9) return `${code.slice(0, 2)}0${code.slice(2, 4)}${code.slice(4, 6)}${code.slice(6, 9)}`;
  }

  if (code.length === 9) return toTenDigitPsgcCode(code, 'barangay');
  if (code.length === 7 || code.length === 6) return toTenDigitPsgcCode(code, 'city');
  if (code.length === 5 || code.length === 4) return toTenDigitPsgcCode(code, 'province');
  if (code.length === 2) return toTenDigitPsgcCode(code, 'region');

  return '';
}

function normalizeLevel(value, code = '') {
  const text = normalizeKey(value);

  if (['reg', 'region', 'regions'].includes(text)) return 'region';
  if (['prov', 'province', 'provinces'].includes(text)) return 'province';
  if ([
    'city',
    'municipality',
    'city_municipality',
    'city_municipality_district',
    'submun',
    'sub_mun',
    'submunicipality',
    'sub_municipality',
    'city_mun',
    'cities_municipalities',
    'city_or_municipality',
    'city_municipalities'
  ].includes(text)) return 'city';
  if (['bgy', 'brgy', 'barangay', 'barangays', 'village'].includes(text)) return 'barangay';

  const clean = cleanCode(code);
  if (clean.length === 10) {
    if (clean.endsWith('00000000')) return 'region';
    if (clean.endsWith('00000')) return 'province';
    if (clean.endsWith('000')) return 'city';
    return 'barangay';
  }
  if (clean.length === 2) return 'region';
  if (clean.length === 4 || clean.length === 5) return 'province';
  if (clean.length === 6 || clean.length === 7) return 'city';
  if (clean.length === 9) return 'barangay';

  return '';
}

function deriveRegionId(value) {
  const code = cleanCode(value);
  const tenDigit = code.length === 10 ? code : toTenDigitPsgcCode(code);
  if (tenDigit.length === 10) return `${tenDigit.slice(0, 2)}00000000`;
  if (code.length >= 2) return `${code.slice(0, 2)}00000000`;
  return '';
}

function deriveProvinceId(value) {
  const code = cleanCode(value);
  const tenDigit = code.length === 10 ? code : toTenDigitPsgcCode(code);
  if (tenDigit.length === 10) return `${tenDigit.slice(0, 5)}00000`;
  return '';
}

function deriveCityId(value) {
  const code = cleanCode(value);
  const tenDigit = code.length === 10 ? code : toTenDigitPsgcCode(code);
  if (tenDigit.length === 10) return `${tenDigit.slice(0, 7)}000`;
  return '';
}

function addFailure(failures, code, message, details = {}) {
  failures.push({ code, message, ...details });
}

function addWarning(warnings, code, message, details = {}) {
  warnings.push({ code, message, ...details });
}

function numberArg(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function packageRelative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function validateSource(rows, args) {
  const codeColumns = [args.codeColumn, 'code', 'psgc_code', 'psgc', '10_digit_psgc', 'ten_digit_psgc', 'psgc_10_digit_code', 'psgc10digitcode', 'correspondence_code'].filter(Boolean);
  const nameColumns = [args.nameColumn, 'name', 'area_name', 'geographic_name', 'location_name', 'psgc_name'].filter(Boolean);
  const levelColumns = [args.levelColumn, 'level', 'type', 'geographic_level', 'geo_level'].filter(Boolean);

  const failures = [];
  const warnings = [];
  const seen = new Map();
  const regions = new Map();
  const provinces = new Map();
  const cities = new Map();
  const barangays = new Map();
  const emptyNameSamples = [];
  const invalidCodeSamples = [];

  rows.forEach((row, index) => {
    const sourceRow = row.__sourceRow || index + 1;
    const rawCode = getFirst(row, codeColumns);
    const rawName = getFirst(row, nameColumns);
    const guessedLevel = normalizeLevel(getFirst(row, levelColumns), rawCode);
    const id = toTenDigitPsgcCode(rawCode, guessedLevel);
    const name = cleanText(rawName);

    if (!rawCode || !id || !guessedLevel) {
      invalidCodeSamples.push({ sourceRow, rawCode, level: guessedLevel });
      return;
    }

    if (!name) {
      emptyNameSamples.push({ sourceRow, id, level: guessedLevel });
      return;
    }

    if (seen.has(id)) {
      const first = seen.get(id);
      addFailure(failures, 'duplicate_psgc_code', `Duplicate PSGC code ${id}.`, {
        id,
        firstRow: first.sourceRow,
        duplicateRow: sourceRow,
        firstName: first.name,
        duplicateName: name
      });
      return;
    }

    const item = {
      sourceRow,
      id,
      code: id,
      name,
      level: guessedLevel,
      regionId: deriveRegionId(id),
      provinceId: deriveProvinceId(id),
      cityId: deriveCityId(id)
    };

    seen.set(id, item);

    if (guessedLevel === 'region') regions.set(id, item);
    else if (guessedLevel === 'province') provinces.set(id, item);
    else if (guessedLevel === 'city') cities.set(id, item);
    else if (guessedLevel === 'barangay') barangays.set(id, item);
  });

  if (invalidCodeSamples.length > 0) {
    addFailure(failures, 'invalid_or_unrecognized_code', 'One or more rows have missing/unrecognized PSGC codes or levels.', {
      count: invalidCodeSamples.length,
      samples: invalidCodeSamples.slice(0, 25)
    });
  }

  if (emptyNameSamples.length > 0) {
    addFailure(failures, 'missing_name', 'One or more rows have missing location names.', {
      count: emptyNameSamples.length,
      samples: emptyNameSamples.slice(0, 25)
    });
  }

  for (const province of provinces.values()) {
    if (!regions.has(province.regionId)) {
      addFailure(failures, 'province_missing_region_parent', `Province ${province.id} is missing region parent ${province.regionId}.`, {
        provinceId: province.id,
        expectedRegionId: province.regionId,
        sourceRow: province.sourceRow
      });
    }
  }

  for (const city of cities.values()) {
    if (!regions.has(city.regionId)) {
      addFailure(failures, 'city_missing_region_parent', `City/municipality ${city.id} is missing region parent ${city.regionId}.`, {
        cityId: city.id,
        expectedRegionId: city.regionId,
        sourceRow: city.sourceRow
      });
      continue;
    }

    const isProvinceLess = city.provinceId === city.id;
    if (!isProvinceLess && !provinces.has(city.provinceId)) {
      addWarning(warnings, 'city_missing_province_parent', `City/municipality ${city.id} has no province parent ${city.provinceId}; treating it as province-less under its region.`, {
        cityId: city.id,
        expectedProvinceId: city.provinceId,
        sourceRow: city.sourceRow
      });
    }
  }

  for (const barangay of barangays.values()) {
    const city = cities.get(barangay.cityId);
    if (!city) {
      addFailure(failures, 'barangay_missing_city_parent', `Barangay ${barangay.id} is missing city/municipality parent ${barangay.cityId}.`, {
        barangayId: barangay.id,
        expectedCityId: barangay.cityId,
        sourceRow: barangay.sourceRow
      });
      continue;
    }

    if (!regions.has(barangay.regionId)) {
      addFailure(failures, 'barangay_missing_region_parent', `Barangay ${barangay.id} is missing region parent ${barangay.regionId}.`, {
        barangayId: barangay.id,
        expectedRegionId: barangay.regionId,
        sourceRow: barangay.sourceRow
      });
    }

    const cityIsProvinceLess = city.provinceId === city.id;
    if (!cityIsProvinceLess && !provinces.has(barangay.provinceId)) {
      addWarning(warnings, 'barangay_missing_province_parent', `Barangay ${barangay.id} has no province parent ${barangay.provinceId}; city/municipality parent is authoritative.`, {
        barangayId: barangay.id,
        expectedProvinceId: barangay.provinceId,
        sourceRow: barangay.sourceRow
      });
    }
  }

  const thresholds = {
    regions: numberArg(args.minRegions, DEFAULT_THRESHOLDS.regions),
    provinces: numberArg(args.minProvinces, DEFAULT_THRESHOLDS.provinces),
    cities: numberArg(args.minCities, DEFAULT_THRESHOLDS.cities),
    barangays: numberArg(args.minBarangays, DEFAULT_THRESHOLDS.barangays)
  };

  const counts = {
    totalRows: rows.length,
    recognizedRows: seen.size,
    regions: regions.size,
    provinces: provinces.size,
    citiesAndMunicipalities: cities.size,
    barangays: barangays.size
  };

  if (counts.regions < thresholds.regions) {
    addFailure(failures, 'region_count_below_threshold', 'Region count is below the required threshold.', {
      actual: counts.regions,
      required: thresholds.regions
    });
  }

  if (counts.provinces < thresholds.provinces) {
    addFailure(failures, 'province_count_below_threshold', 'Province count is below the required threshold.', {
      actual: counts.provinces,
      required: thresholds.provinces
    });
  }

  if (counts.citiesAndMunicipalities < thresholds.cities) {
    addFailure(failures, 'city_count_below_threshold', 'City/municipality count is below the required threshold.', {
      actual: counts.citiesAndMunicipalities,
      required: thresholds.cities
    });
  }

  if (counts.barangays < thresholds.barangays) {
    addFailure(failures, 'barangay_count_below_threshold', 'Barangay count is below the required threshold.', {
      actual: counts.barangays,
      required: thresholds.barangays
    });
  }

  if (counts.totalRows !== counts.recognizedRows) {
    addWarning(warnings, 'row_count_mismatch', 'Not every source row became a recognized unique PSGC row.', {
      totalRows: counts.totalRows,
      recognizedRows: counts.recognizedRows
    });
  }

  return {
    thresholds,
    counts,
    warnings,
    failures,
    ok: failures.length === 0
  };
}

const args = parseArgs(process.argv);
const inputFile = resolveInputPath(args.input || args.file);
const reportFile = resolveInsidePackage(args.report || 'data/psgc-source-validation-report.json');
const failures = [];
const warnings = [];
let headers = [];
let rows = [];
let sourceReport = null;

if (!inputFile) {
  addFailure(failures, 'missing_input', 'Pass --input path/to/psgc.csv or --input path/to/psgc.json.');
} else if (!fs.existsSync(inputFile)) {
  addFailure(failures, 'input_not_found', `Input file not found: ${inputFile}`);
}

if (failures.length === 0) {
  const parsed = readRows(inputFile);
  headers = parsed.headers;
  rows = parsed.rows;
  sourceReport = validateSource(rows, args);
  warnings.push(...sourceReport.warnings);
  failures.push(...sourceReport.failures);
}

const report = {
  generatedAt: new Date().toISOString(),
  input: inputFile,
  inputFormat: inputFile ? path.extname(inputFile).replace('.', '').toLowerCase() || 'auto' : '',
  headers,
  sourceMetadata: productionSourceMetadata(),
  thresholds: sourceReport?.thresholds || {
    regions: numberArg(args.minRegions, DEFAULT_THRESHOLDS.regions),
    provinces: numberArg(args.minProvinces, DEFAULT_THRESHOLDS.provinces),
    cities: numberArg(args.minCities, DEFAULT_THRESHOLDS.cities),
    barangays: numberArg(args.minBarangays, DEFAULT_THRESHOLDS.barangays)
  },
  counts: sourceReport?.counts || null,
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson(reportFile, report);

console.log(`PSGC source validation: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Input: ${inputFile || '(missing)'}`);
if (report.counts) {
  console.log(`Rows: ${report.counts.totalRows}`);
  console.log(`Regions: ${report.counts.regions}`);
  console.log(`Provinces: ${report.counts.provinces}`);
  console.log(`Cities/municipalities: ${report.counts.citiesAndMunicipalities}`);
  console.log(`Barangays: ${report.counts.barangays}`);
}
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Wrote ${packageRelative(reportFile)}`);

if (!report.ok) {
  process.exitCode = 1;
}
