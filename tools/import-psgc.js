import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    out: 'data/psgc',
    reset: '0'
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
  if (!value) {
    return '';
  }

  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }

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
    const normalized = normalizeKey(key);
    if (Object.prototype.hasOwnProperty.call(row, normalized)) {
      return row[normalized];
    }
  }
  return '';
}

function uniqueRows(rows) {
  const seen = new Set();
  const unique = [];

  for (const row of rows) {
    const key = row.id || row.code || row.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }

  return unique;
}

function sortRows(rows) {
  return uniqueRows(rows).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
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
  if (nonEmptyRows.length === 0) {
    return [];
  }

  const headers = nonEmptyRows[0].map((header, index) => normalizeKey(header || `column_${index + 1}`));
  return nonEmptyRows.slice(1).map((items) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = cleanText(items[index]);
    });
    return obj;
  });
}

function normalizeObjectKeys(row) {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value;
  });
  return normalized;
}

function readRows(inputFile) {
  const ext = path.extname(inputFile).toLowerCase();
  const text = readText(inputFile);

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

    return rows.map(normalizeObjectKeys);
  }

  return parseCsv(text).map(normalizeObjectKeys);
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

function relation(row, id, name) {
  const cleanId = cleanCode(id);
  if (!cleanId) return null;
  return {
    id: cleanId,
    code: cleanId,
    name: cleanText(name || cleanId)
  };
}

function makeItem(id, name, type, extra = {}) {
  const item = {
    id,
    code: id,
    name: cleanText(name),
    type
  };

  Object.entries(extra).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      item[key] = value;
    }
  });

  return item;
}

function cleanOutFolder(outDir) {
  for (const name of ['regions.json', 'provinces', 'cities', 'barangays', 'import-psgc-report.json', 'cache-psgc-cloud-report.json']) {
    const target = path.join(outDir, name);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

function addGrouped(map, key, row) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(row);
}

function writeGrouped(outDir, folderName, groupedRows) {
  const folder = path.join(outDir, folderName);
  fs.mkdirSync(folder, { recursive: true });

  for (const [id, rows] of [...groupedRows.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    writeJson(path.join(folder, `${id}.json`), sortRows(rows));
  }
}

function fileRelative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function createNormalizedRows(rawRows, args, warnings) {
  const codeColumns = [args.codeColumn, 'code', 'psgc_code', 'psgc', '10_digit_psgc', 'ten_digit_psgc', 'psgc_10_digit_code', 'psgc10digitcode', 'correspondence_code'].filter(Boolean);
  const nameColumns = [args.nameColumn, 'name', 'area_name', 'geographic_name', 'location_name', 'psgc_name'].filter(Boolean);
  const levelColumns = [args.levelColumn, 'level', 'type', 'geographic_level', 'geo_level'].filter(Boolean);
  const regionColumns = [args.regionCodeColumn, 'region_code', 'region_id', 'region_psgc_code'].filter(Boolean);
  const provinceColumns = [args.provinceCodeColumn, 'province_code', 'province_id', 'province_psgc_code'].filter(Boolean);
  const cityColumns = [args.cityCodeColumn, 'city_code', 'municipality_code', 'city_municipality_code', 'city_id', 'municipality_id'].filter(Boolean);

  const rows = [];

  rawRows.forEach((raw, index) => {
    const rawCode = getFirst(raw, codeColumns);
    const rawName = getFirst(raw, nameColumns);
    const code = cleanCode(rawCode);
    const level = normalizeLevel(getFirst(raw, levelColumns), code);
    const tenDigitCode = toTenDigitPsgcCode(code, level);
    const id = tenDigitCode || code;
    const name = cleanText(rawName || raw.name || raw.area_name || raw.geographic_name || id);

    if (!id || !name || !level) {
      warnings.push({
        code: 'skipped_unusable_row',
        rowNumber: index + 2,
        message: 'Row is missing a usable code, name, or geographic level.',
        row: raw
      });
      return;
    }

    rows.push({
      id,
      code: id,
      name,
      level,
      regionId: toTenDigitPsgcCode(getFirst(raw, regionColumns), 'region') || deriveRegionId(id),
      provinceId: toTenDigitPsgcCode(getFirst(raw, provinceColumns), 'province') || deriveProvinceId(id),
      cityId: toTenDigitPsgcCode(getFirst(raw, cityColumns), 'city') || deriveCityId(id),
      raw
    });
  });

  return rows;
}

function buildHierarchy(rows) {
  const warnings = [];
  const failures = [];
  const regions = new Map();
  const provinces = new Map();
  const cities = new Map();
  const barangays = new Map();

  for (const row of rows) {
    if (row.level === 'region') regions.set(row.id, row);
    if (row.level === 'province') provinces.set(row.id, row);
    if (row.level === 'city') cities.set(row.id, row);
    if (row.level === 'barangay') barangays.set(row.id, row);
  }

  const provinceGroups = new Map();
  const cityGroups = new Map();
  const barangayGroups = new Map();
  const regionItems = [];

  for (const region of regions.values()) {
    regionItems.push(makeItem(region.id, region.name, 'region'));
  }

  for (const province of provinces.values()) {
    const region = regions.get(province.regionId);
    if (!region) {
      warnings.push({
        code: 'province_missing_region_parent',
        provinceId: province.id,
        expectedRegionId: province.regionId
      });
    }

    addGrouped(provinceGroups, province.regionId, makeItem(province.id, province.name, 'province', {
      region: relation(province, province.regionId, region && region.name)
    }));
  }

  for (const city of cities.values()) {
    const region = regions.get(city.regionId);
    const province = provinces.get(city.provinceId);
    const isProvinceLess = !province || province.id === city.id;
    const parentId = isProvinceLess ? city.regionId : province.id;

    if (!region) {
      warnings.push({
        code: 'city_missing_region_parent',
        cityId: city.id,
        expectedRegionId: city.regionId
      });
    }

    if (!isProvinceLess && !province) {
      warnings.push({
        code: 'city_missing_province_parent',
        cityId: city.id,
        expectedProvinceId: city.provinceId
      });
    }

    addGrouped(cityGroups, parentId, makeItem(city.id, city.name, 'city_municipality', {
      region: relation(city, city.regionId, region && region.name),
      province: isProvinceLess ? null : relation(city, province.id, province.name)
    }));
  }

  for (const barangay of barangays.values()) {
    const city = cities.get(barangay.cityId);
    const region = regions.get(barangay.regionId);
    const province = provinces.get(barangay.provinceId);

    if (!city) {
      warnings.push({
        code: 'barangay_missing_city_parent',
        barangayId: barangay.id,
        expectedCityId: barangay.cityId
      });
    }

    addGrouped(barangayGroups, barangay.cityId, makeItem(barangay.id, barangay.name, 'barangay', {
      region: relation(barangay, barangay.regionId, region && region.name),
      province: province ? relation(barangay, province.id, province.name) : null,
      city_municipality: relation(barangay, barangay.cityId, city && city.name)
    }));
  }

  if (regionItems.length === 0) failures.push({ code: 'no_regions', message: 'No region rows were imported.' });
  if (cities.size === 0) failures.push({ code: 'no_cities', message: 'No city/municipality rows were imported.' });
  if (barangays.size === 0) failures.push({ code: 'no_barangays', message: 'No barangay rows were imported.' });

  return {
    failures,
    warnings,
    regions: sortRows(regionItems),
    provinceGroups,
    cityGroups,
    barangayGroups,
    counts: {
      regions: regionItems.length,
      provinces: provinces.size,
      citiesAndMunicipalities: cities.size,
      barangays: barangays.size,
      provinceFiles: provinceGroups.size,
      cityFiles: cityGroups.size,
      barangayFiles: barangayGroups.size
    }
  };
}

const args = parseArgs(process.argv);
const inputFile = resolveInputPath(args.input || args.file);
const outDir = resolveInsidePackage(args.out || 'data/psgc');
const reportFile = args.report
  ? resolveInsidePackage(args.report)
  : path.join(outDir, 'import-psgc-report.json');
const warnings = [];
const failures = [];

if (!inputFile) {
  failures.push({ code: 'missing_input', message: 'Pass --input path/to/psgc.csv or --input path/to/psgc.json.' });
} else if (!fs.existsSync(inputFile)) {
  failures.push({ code: 'input_not_found', message: `Input file not found: ${inputFile}` });
}

let rawRows = [];
let normalizedRows = [];
let hierarchy = null;

if (failures.length === 0) {
  if (String(args.reset || '0') === '1') {
    cleanOutFolder(outDir);
  }

  rawRows = readRows(inputFile);
  normalizedRows = createNormalizedRows(rawRows, args, warnings);
  hierarchy = buildHierarchy(normalizedRows);
  failures.push(...hierarchy.failures);
  warnings.push(...hierarchy.warnings);

  if (failures.length === 0) {
    writeJson(path.join(outDir, 'regions.json'), hierarchy.regions);
    writeGrouped(outDir, 'provinces', hierarchy.provinceGroups);
    writeGrouped(outDir, 'cities', hierarchy.cityGroups);
    writeGrouped(outDir, 'barangays', hierarchy.barangayGroups);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  input: inputFile,
  out: fileRelative(outDir),
  rawRows: rawRows.length,
  normalizedRows: normalizedRows.length,
  counts: hierarchy ? hierarchy.counts : null,
  warnings,
  failures,
  ok: failures.length === 0
};

writeJson(reportFile, report);

console.log(`PSGC flat-file import: ${report.ok ? 'OK' : 'FAILED'}`);
console.log(`Input: ${inputFile || '(missing)'}`);
console.log(`Output: ${fileRelative(outDir)}`);
if (report.counts) {
  console.log(`Regions: ${report.counts.regions}`);
  console.log(`Provinces: ${report.counts.provinces}`);
  console.log(`Cities/municipalities: ${report.counts.citiesAndMunicipalities}`);
  console.log(`Barangays: ${report.counts.barangays}`);
}
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Wrote ${fileRelative(reportFile)}`);

if (!report.ok) {
  process.exitCode = 1;
}
