#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [key, ...rest] = raw.slice(2).split('=');
    args[key] = rest.length === 0 ? true : rest.join('=');
  }
  return args;
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function cleanNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rows(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  if (value && Array.isArray(value.items)) return value.items;
  if (value && Array.isArray(value.results)) return value.results;
  return [];
}

function dataPayload(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'data')) {
    return value.data;
  }
  return value;
}

function normalizeRow(row = {}) {
  const id = cleanText(row.id || row.code || row.psgc_code || row.psgcCode);
  const code = cleanText(row.code || row.psgc_code || row.psgcCode || id);
  const name = cleanText(row.name || row.area_name || row.areaName || row.label || id);
  return { ...row, id: id || code || name, code: code || id || name, name };
}

function assertCondition(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function reportStep(report, name, status, details = {}) {
  report.steps.push({ name, status, ...details });
}

function readJsonFile(filePath, fallback = undefined) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`JSON file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeReport(reportPath, report) {
  if (!reportPath) return;
  const resolved = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify(report, null, 2));
}

function deriveProvinceId(cityId) {
  return cleanText(cityId).slice(0, 5);
}

function deriveRegionId(id) {
  return cleanText(id).slice(0, 2);
}

function pickFirst(rowsValue, preferredId = '') {
  const list = rows(rowsValue).map(normalizeRow).filter((row) => row.id);
  if (preferredId) {
    const match = list.find((row) => row.id === preferredId || row.code === preferredId);
    if (match) return match;
  }
  return list[0] || null;
}

function fixtureDefaultIds(baseUrl, args) {
  const manifest = readJsonFile(path.join(baseUrl, 'fixture-manifest.json'), {});
  const cityId = cleanText(args['city-id'] || manifest.city_id || '');
  const provinceId = cleanText(args['province-id'] || manifest.province_id || deriveProvinceId(cityId));
  const regionId = cleanText(args['region-id'] || manifest.region_id || deriveRegionId(provinceId || cityId));
  const barangayId = cleanText(args['barangay-id'] || manifest.barangay_id || '');
  const reverseLat = cleanNumber(args['reverse-lat'], cleanNumber(manifest.default_pin?.lat));
  const reverseLng = cleanNumber(args['reverse-lng'], cleanNumber(manifest.default_pin?.lng));

  return { manifest, regionId, provinceId, cityId, barangayId, reverseLat, reverseLng };
}

async function runStatic(args, report) {
  const baseUrl = path.resolve(cleanText(args['base-url'] || args.baseUrl || 'data/fixtures/daet'));
  const defaults = fixtureDefaultIds(baseUrl, args);

  report.provider = 'static';
  report.base_url = baseUrl;
  report.fixture = defaults.manifest.name || path.basename(baseUrl);

  const regions = readJsonFile(path.join(baseUrl, 'psgc/regions.json'));
  const region = pickFirst(regions, defaults.regionId);
  assertCondition(region, 'Static fixture has no regions.');
  reportStep(report, 'regions', 'pass', { count: rows(regions).length, selected: region.id });

  const provinces = readJsonFile(path.join(baseUrl, `psgc/provinces/${region.id}.json`));
  const province = pickFirst(provinces, defaults.provinceId);
  assertCondition(province, `Static fixture has no provinces for region ${region.id}.`);
  reportStep(report, 'provinces', 'pass', { count: rows(provinces).length, selected: province.id });

  const cities = readJsonFile(path.join(baseUrl, `psgc/cities/${province.id}.json`));
  const city = pickFirst(cities, defaults.cityId);
  assertCondition(city, `Static fixture has no cities for province ${province.id}.`);
  reportStep(report, 'cities', 'pass', { count: rows(cities).length, selected: city.id });

  const barangays = readJsonFile(path.join(baseUrl, `psgc/barangays/${city.id}.json`));
  const barangay = pickFirst(barangays, defaults.barangayId);
  assertCondition(barangay, `Static fixture has no barangays for city ${city.id}.`);
  reportStep(report, 'barangays', 'pass', { count: rows(barangays).length, selected: barangay.id });

  const bounds = readJsonFile(path.join(baseUrl, 'geo/bounds/barangays.json'), {});
  const cityBounds = readJsonFile(path.join(baseUrl, 'geo/bounds/cities.json'), {});
  reportStep(report, 'bounds', bounds[barangay.id] && cityBounds[city.id] ? 'pass' : 'warn', {
    barangay_bounds_found: Boolean(bounds[barangay.id]),
    city_bounds_found: Boolean(cityBounds[city.id])
  });

  if (defaults.reverseLat !== null && defaults.reverseLng !== null) {
    reportStep(report, 'reverse-input', 'pass', { lat: defaults.reverseLat, lng: defaults.reverseLng });
  } else {
    reportStep(report, 'reverse-input', 'warn', { message: 'No reverse pin supplied in args or fixture manifest.' });
  }

  report.sample_location = {
    region_id: region.id,
    region_name: region.name,
    province_id: province.id,
    province_name: province.name,
    city_id: city.id,
    city_name: city.name,
    barangay_id: barangay.id,
    barangay_name: barangay.name
  };
}

function makeApiUrl(baseUrl, endpoint, params = {}) {
  const url = new URL(baseUrl.replace(/\/+$/, '') + '/' + endpoint.replace(/^\/+/, ''));
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function apiGet(baseUrl, endpoint, params = {}) {
  const response = await fetch(makeApiUrl(baseUrl, endpoint, params), {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin'
  });
  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed with HTTP ${response.status}`);
  }
  return dataPayload(await response.json());
}

async function apiPost(baseUrl, endpoint, body = {}) {
  const response = await fetch(makeApiUrl(baseUrl, endpoint), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`POST ${endpoint} failed with HTTP ${response.status}`);
  }
  return dataPayload(await response.json());
}

async function optionalApiGet(baseUrl, endpoint, params = {}) {
  try {
    return await apiGet(baseUrl, endpoint, params);
  } catch (error) {
    return null;
  }
}

async function runApi(args, report) {
  const apiUrl = cleanText(args['api-url'] || args.apiUrl);
  assertCondition(apiUrl, 'API provider check requires --api-url=http://...');

  report.provider = 'api';
  report.api_url = apiUrl;

  const health = await optionalApiGet(apiUrl, 'health');
  reportStep(report, 'health', health ? 'pass' : 'warn', health ? { response: health } : { message: 'health endpoint is optional but recommended.' });

  const coverage = await optionalApiGet(apiUrl, 'coverage');
  reportStep(report, 'coverage', coverage ? 'pass' : 'warn', coverage ? { response: coverage } : { message: 'coverage endpoint is optional but recommended.' });

  const regions = await apiGet(apiUrl, 'regions');
  const region = pickFirst(regions, cleanText(args['region-id']));
  assertCondition(region, 'API returned no regions.');
  reportStep(report, 'regions', 'pass', { count: rows(regions).length, selected: region.id });

  const provinces = await apiGet(apiUrl, 'provinces', { region_id: region.id });
  const province = pickFirst(provinces, cleanText(args['province-id']));
  assertCondition(province, `API returned no provinces for region ${region.id}.`);
  reportStep(report, 'provinces', 'pass', { count: rows(provinces).length, selected: province.id });

  const cities = await apiGet(apiUrl, 'cities', { province_id: province.id, region_id: region.id });
  const city = pickFirst(cities, cleanText(args['city-id']));
  assertCondition(city, `API returned no cities for province ${province.id}.`);
  reportStep(report, 'cities', 'pass', { count: rows(cities).length, selected: city.id });

  const barangays = await apiGet(apiUrl, 'barangays', { city_id: city.id });
  const barangay = pickFirst(barangays, cleanText(args['barangay-id']));
  assertCondition(barangay, `API returned no barangays for city ${city.id}.`);
  reportStep(report, 'barangays', 'pass', { count: rows(barangays).length, selected: barangay.id });

  const location = await apiGet(apiUrl, 'location', {
    region_id: region.id,
    province_id: province.id,
    city_id: city.id,
    barangay_id: barangay.id
  });
  assertCondition(location && cleanText(location.barangay_id) === barangay.id, 'API location endpoint did not resolve the selected barangay.', { location });
  reportStep(report, 'location', 'pass', { response: location });

  const reverseLat = cleanNumber(args['reverse-lat']);
  const reverseLng = cleanNumber(args['reverse-lng']);
  if (reverseLat !== null && reverseLng !== null) {
    const reverse = await apiPost(apiUrl, 'reverse', {
      lat: reverseLat,
      lng: reverseLng,
      city_id: cleanText(args['reverse-city-id'] || city.id)
    });
    assertCondition(reverse && cleanText(reverse.barangay_id), 'API reverse endpoint returned no barangay match.', { reverse });
    reportStep(report, 'reverse', 'pass', { lat: reverseLat, lng: reverseLng, response: reverse });
  } else {
    reportStep(report, 'reverse', 'warn', { message: 'Skipped. Pass --reverse-lat and --reverse-lng to validate pin reverse lookup.' });
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const report = {
    generated_at: new Date().toISOString(),
    ok: false,
    steps: []
  };

  try {
    const provider = cleanText(args.provider || 'static').toLowerCase();
    if (provider === 'api' || provider === 'database' || provider === 'db' || provider === 'server') {
      await runApi(args, report);
    } else {
      await runStatic(args, report);
    }
    report.ok = true;
  } catch (error) {
    report.ok = false;
    report.error = {
      message: error.message,
      details: error.details || null
    };
  }

  const reportPath = cleanText(args.report || 'data/provider-contract-report.json');
  writeReport(reportPath, report);
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main();
