#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_REPORT = 'data/live-api-contract-report.json';
const DEFAULT_TIMEOUT_MS = 15000;

function parseArgs(argv) {
  const options = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const body = arg.slice(2);
    const eq = body.indexOf('=');
    if (eq >= 0) {
      options[body.slice(0, eq)] = body.slice(eq + 1);
    } else {
      options[body] = true;
    }
  }
  return options;
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function cleanBaseUrl(value) {
  return cleanText(value).replace(/\/+$/, '');
}

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boolOption(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  const normalized = cleanText(value).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function createUrl(baseUrl, endpoint, params = {}) {
  const url = new URL(`${baseUrl}/${cleanText(endpoint).replace(/^\/+/, '')}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function extractPayload(json) {
  if (json && typeof json === 'object' && !Array.isArray(json) && Object.prototype.hasOwnProperty.call(json, 'data')) {
    return json.data;
  }
  return json;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function rowId(row) {
  if (!row || typeof row !== 'object') {
    return '';
  }
  return cleanText(row.id || row.code || row.region_id || row.province_id || row.city_id || row.barangay_id);
}

function endpointResult(name, ok, details = {}) {
  return {
    name,
    ok: ok === true,
    ...details,
  };
}

async function requestJson(baseUrl, endpoint, params = {}, options = {}) {
  const method = cleanText(options.method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET';
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = method === 'GET' ? createUrl(baseUrl, endpoint, params) : createUrl(baseUrl, endpoint);

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method === 'POST' ? JSON.stringify(params) : undefined,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (error) {
      return {
        ok: false,
        status: response.status,
        endpoint,
        url: url.toString(),
        error_code: 'malformed_json',
        error_message: error.message,
        raw_preview: text.slice(0, 500),
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      url: url.toString(),
      json,
      payload: extractPayload(json),
      error_code: response.ok ? '' : 'http_error',
      error_message: response.ok ? '' : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      endpoint,
      url: url.toString(),
      error_code: error.name === 'AbortError' ? 'timeout' : 'network_error',
      error_message: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function requireObject(result, name) {
  if (!result.ok) {
    return endpointResult(name, false, {
      status: result.status,
      error_code: result.error_code,
      error_message: result.error_message,
    });
  }

  if (!result.payload || typeof result.payload !== 'object' || Array.isArray(result.payload)) {
    return endpointResult(name, false, {
      status: result.status,
      error_code: 'payload_not_object',
      error_message: `${name} payload must be an object.`,
    });
  }

  return endpointResult(name, true, {
    status: result.status,
    payload: result.payload,
  });
}

function requireArray(result, name) {
  if (!result.ok) {
    return endpointResult(name, false, {
      status: result.status,
      error_code: result.error_code,
      error_message: result.error_message,
    });
  }

  if (!Array.isArray(result.payload)) {
    return endpointResult(name, false, {
      status: result.status,
      error_code: 'payload_not_array',
      error_message: `${name} payload must be an array.`,
    });
  }

  return endpointResult(name, true, {
    status: result.status,
    count: result.payload.length,
    sample: result.payload.slice(0, 3),
  });
}

function validateSchemaPayload(payload) {
  const problems = [];
  const tableNames = [
    'location_regions',
    'location_provinces',
    'location_city',
    'location_barangays',
    'location_barangay_geometries',
  ];

  if (!payload || typeof payload !== 'object') {
    return ['schema payload must be an object'];
  }

  if (payload.ok !== true) {
    problems.push('schema.ok is not true');
  }

  tableNames.forEach((table) => {
    const tableInfo = payload.tables && payload.tables[table];
    if (!tableInfo || tableInfo.exists !== true) {
      problems.push(`${table} is missing`);
    } else if (Array.isArray(tableInfo.missing_columns) && tableInfo.missing_columns.length > 0) {
      problems.push(`${table} missing columns: ${tableInfo.missing_columns.join(', ')}`);
    }
  });

  if (payload.foreign_key_compatible !== true) {
    problems.push('location_barangays.id and location_barangay_geometries.barangay_id are not foreign-key compatible');
  }

  if (payload.spatial_index_found !== true) {
    problems.push('spatial index on location_barangay_geometries.boundary was not found');
  }

  return problems;
}

function validateCoveragePayload(payload, minPercent) {
  const problems = [];
  if (!payload || typeof payload !== 'object') {
    return ['coverage payload must be an object'];
  }
  if (payload.ok !== true) {
    problems.push('coverage.ok is not true');
  }
  const percent = Number(payload.coverage_percent);
  if (!Number.isFinite(percent)) {
    problems.push('coverage_percent is missing or not numeric');
  } else if (percent < minPercent) {
    problems.push(`coverage_percent ${percent} is below required minimum ${minPercent}`);
  }
  return problems;
}

function normalizeReportPath(value) {
  const reportPath = cleanText(value || DEFAULT_REPORT);
  return path.resolve(process.cwd(), reportPath);
}

function writeReport(reportPath, report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function printHelp() {
  console.log(`Live API contract checker for Philippines Location Map Picker.

Required:
  --api-url=URL                 Base URL, e.g. http://127.0.0.1/api/location-map-picker

Common:
  --report=PATH                 Default: ${DEFAULT_REPORT}
  --coverage-min=N              Default: 95
  --reverse-lat=N               Optional reverse lookup latitude
  --reverse-lng=N               Optional reverse lookup longitude
  --city-id=ID                  Optional city filter for reverse lookup
  --timeout-ms=N                Default: ${DEFAULT_TIMEOUT_MS}
  --strict-reverse=1            Fail when reverse lookup does not match
  --skip-schema=1               Skip schema endpoint
  --skip-coverage=1             Skip coverage endpoint

Examples:
  npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker --reverse-lat=14.112233 --reverse-lng=122.955667 --city-id=0516030
  node tools/check-live-api.js --api-url=https://example.test/api/location-map-picker --coverage-min=98
`);
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }

  const apiUrl = cleanBaseUrl(options['api-url'] || options.apiUrl);
  if (!apiUrl) {
    console.error('Missing --api-url.');
    process.exitCode = 2;
    return;
  }

  const reportPath = normalizeReportPath(options.report);
  const timeoutMs = toNumber(options['timeout-ms'], DEFAULT_TIMEOUT_MS);
  const coverageMin = toNumber(options['coverage-min'], 95);
  const reverseLat = toNumber(options['reverse-lat'], null);
  const reverseLng = toNumber(options['reverse-lng'], null);
  const cityId = cleanText(options['city-id'] || options.city_id);
  const strictReverse = boolOption(options['strict-reverse'], false);
  const skipSchema = boolOption(options['skip-schema'], false);
  const skipCoverage = boolOption(options['skip-coverage'], false);

  const report = {
    ok: true,
    generated_at: new Date().toISOString(),
    api_url: apiUrl,
    options: {
      coverage_min: coverageMin,
      reverse_lat: reverseLat,
      reverse_lng: reverseLng,
      city_id: cityId,
      strict_reverse: strictReverse,
      timeout_ms: timeoutMs,
    },
    endpoints: {},
    problems: [],
    samples: {},
  };

  const healthRaw = await requestJson(apiUrl, 'health', {}, { timeoutMs });
  report.endpoints.health = requireObject(healthRaw, 'health');
  if (!report.endpoints.health.ok) {
    report.problems.push(`health failed: ${report.endpoints.health.error_message}`);
  }

  if (!skipSchema) {
    const schemaRaw = await requestJson(apiUrl, 'schema', {}, { timeoutMs });
    report.endpoints.schema = requireObject(schemaRaw, 'schema');
    if (report.endpoints.schema.ok) {
      const schemaProblems = validateSchemaPayload(report.endpoints.schema.payload);
      report.endpoints.schema.problems = schemaProblems;
      report.endpoints.schema.ok = schemaProblems.length === 0;
      report.problems.push(...schemaProblems.map((problem) => `schema: ${problem}`));
    } else {
      report.problems.push(`schema failed: ${report.endpoints.schema.error_message}`);
    }
  }

  if (!skipCoverage) {
    const coverageRaw = await requestJson(apiUrl, 'coverage', {}, { timeoutMs });
    report.endpoints.coverage = requireObject(coverageRaw, 'coverage');
    if (report.endpoints.coverage.ok) {
      const coverageProblems = validateCoveragePayload(report.endpoints.coverage.payload, coverageMin);
      report.endpoints.coverage.problems = coverageProblems;
      report.endpoints.coverage.ok = coverageProblems.length === 0;
      report.problems.push(...coverageProblems.map((problem) => `coverage: ${problem}`));
    } else {
      report.problems.push(`coverage failed: ${report.endpoints.coverage.error_message}`);
    }
  }

  const regionsRaw = await requestJson(apiUrl, 'regions', {}, { timeoutMs });
  report.endpoints.regions = requireArray(regionsRaw, 'regions');
  if (!report.endpoints.regions.ok || report.endpoints.regions.count < 1) {
    report.problems.push('regions: no usable region rows returned');
  }
  const regions = safeArray(regionsRaw.payload);
  const regionId = rowId(regions[0]);
  report.samples.region_id = regionId;

  if (regionId) {
    const provincesRaw = await requestJson(apiUrl, 'provinces', { region_id: regionId }, { timeoutMs });
    report.endpoints.provinces = requireArray(provincesRaw, 'provinces');
    if (!report.endpoints.provinces.ok || report.endpoints.provinces.count < 1) {
      report.problems.push(`provinces: no usable rows returned for region ${regionId}`);
    }
    const provinces = safeArray(provincesRaw.payload);
    const provinceId = rowId(provinces[0]);
    report.samples.province_id = provinceId;

    if (provinceId) {
      const citiesRaw = await requestJson(apiUrl, 'cities', { province_id: provinceId, region_id: regionId }, { timeoutMs });
      report.endpoints.cities = requireArray(citiesRaw, 'cities');
      if (!report.endpoints.cities.ok || report.endpoints.cities.count < 1) {
        report.problems.push(`cities: no usable rows returned for province ${provinceId}`);
      }
      const cities = safeArray(citiesRaw.payload);
      const sampleCityId = rowId(cities[0]);
      report.samples.city_id = sampleCityId;

      if (sampleCityId) {
        const barangaysRaw = await requestJson(apiUrl, 'barangays', { city_id: sampleCityId }, { timeoutMs });
        report.endpoints.barangays = requireArray(barangaysRaw, 'barangays');
        if (!report.endpoints.barangays.ok || report.endpoints.barangays.count < 1) {
          report.problems.push(`barangays: no usable rows returned for city ${sampleCityId}`);
        }
        const barangays = safeArray(barangaysRaw.payload);
        const barangayId = rowId(barangays[0]);
        report.samples.barangay_id = barangayId;

        if (barangayId) {
          const locationRaw = await requestJson(apiUrl, 'location', { barangay_id: barangayId }, { timeoutMs });
          report.endpoints.location = requireObject(locationRaw, 'location');
          if (!report.endpoints.location.ok) {
            report.problems.push(`location: failed for barangay ${barangayId}`);
          }
        }
      }
    }
  }

  if (reverseLat !== null && reverseLng !== null) {
    const reverseParams = {
      lat: reverseLat,
      lng: reverseLng,
      city_id: cityId,
    };
    const reverseRaw = await requestJson(apiUrl, 'reverse', reverseParams, { method: 'POST', timeoutMs });
    const reverseResult = requireObject(reverseRaw, 'reverse');
    report.endpoints.reverse = reverseResult;
    if (!reverseResult.ok || !reverseResult.payload || !reverseResult.payload.barangay_id) {
      const message = `reverse: no boundary match for ${reverseLat}, ${reverseLng}${cityId ? ` in city ${cityId}` : ''}`;
      report.endpoints.reverse.ok = false;
      report.endpoints.reverse.error_code = report.endpoints.reverse.error_code || 'no_reverse_match';
      report.endpoints.reverse.error_message = report.endpoints.reverse.error_message || message;
      if (strictReverse) {
        report.problems.push(message);
      }
    }

    const probeRaw = await requestJson(apiUrl, 'reverse-probe', reverseParams, { method: 'POST', timeoutMs });
    report.endpoints['reverse-probe'] = requireObject(probeRaw, 'reverse-probe');
  }

  report.ok = report.problems.length === 0;
  writeReport(reportPath, report);

  if (report.ok) {
    console.log(`Live API contract check passed. Report: ${path.relative(process.cwd(), reportPath)}`);
  } else {
    console.error(`Live API contract check failed. Report: ${path.relative(process.cwd(), reportPath)}`);
    report.problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
