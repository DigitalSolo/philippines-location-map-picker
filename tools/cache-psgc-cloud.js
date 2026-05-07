import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (part.startsWith('--')) {
      const key = part.slice(2);
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
      args[key] = value;
      args[camelKey] = value;
    }
  }
  return args;
}

function cleanId(value) {
  return String(value ?? '').trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function normalizeName(value) {
  return String(value ?? '').trim();
}

function normalizeRelation(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    return { id: value, code: value, name: value };
  }
  const code = cleanId(value.code || value.id || value.psgc_code);
  const name = normalizeName(value.name || value.area_name || value.label || code);
  return { id: code || name, code: code || name, name };
}

function normalizeItem(row, fallbackType = '') {
  const code = cleanId(row.code || row.id || row.psgc_code);
  const name = normalizeName(row.name || row.area_name || row.label || code);
  const type = normalizeName(row.type || row.geographic_level || fallbackType);
  const normalized = { id: code || name, code: code || name, name };

  if (type) normalized.type = type;
  if (row.status) normalized.status = normalizeName(row.status);
  if (row.zip_code || row.postal_code) normalized.zip_code = normalizeName(row.zip_code || row.postal_code);

  const region = normalizeRelation(row.region);
  const province = normalizeRelation(row.province);
  const cityMunicipality = normalizeRelation(row.city_municipality || row.city || row.municipality);

  if (region) normalized.region = region;
  if (province) normalized.province = province;
  if (cityMunicipality) normalized.city_municipality = cityMunicipality;

  return normalized;
}

function sortRows(rows) {
  return rows.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function encodeSegment(value) {
  return encodeURIComponent(cleanId(value));
}

async function delay(ms) {
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function numberArg(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function boolArg(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const text = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(text);
}

function retryAfterMs(headerValue, fallbackMs) {
  const value = String(headerValue || '').trim();
  if (!value) return fallbackMs;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.max(fallbackMs, seconds * 1000);
  }

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.max(fallbackMs, dateMs - Date.now());
  }

  return fallbackMs;
}

function shouldRetryStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

function errorWithContext(message, context = {}) {
  const error = new Error(message);
  Object.assign(error, context);
  return error;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(baseUrl, requestPath, options, report) {
  const url = `${baseUrl.replace(/\/+$/, '')}/${String(requestPath).replace(/^\/+/, '')}`;
  const maxRetries = numberArg(options.maxRetries, 8);
  const retryDelayMs = numberArg(options.retryDelayMs, 2000);
  const retryMultiplier = Math.max(numberArg(options.retryMultiplier, 2), 1);
  const maxRetryDelayMs = numberArg(options.maxRetryDelayMs, 120000);
  const timeoutMs = numberArg(options.timeoutMs, 60000);
  const delayMs = numberArg(options.delayMs, 300);

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      report.requestCounts.total += 1;
      const response = await fetchWithTimeout(url, timeoutMs);

      if (response.ok) {
        const json = await response.json();
        await delay(delayMs);
        return json;
      }

      if (!shouldRetryStatus(response.status) || attempt >= maxRetries) {
        throw errorWithContext(`PSGC Cloud request failed (${response.status}): ${url}`, {
          status: response.status,
          url,
          retryable: shouldRetryStatus(response.status)
        });
      }

      const backoffMs = Math.min(retryDelayMs * (retryMultiplier ** attempt), maxRetryDelayMs);
      const waitMs = retryAfterMs(response.headers.get('retry-after'), backoffMs);
      const event = {
        url,
        status: response.status,
        attempt: attempt + 1,
        maxRetries,
        waitMs
      };
      report.retryEvents.push(event);
      report.requestCounts.retries += 1;
      console.warn(`PSGC Cloud ${response.status}; retry ${event.attempt}/${maxRetries} in ${Math.round(waitMs / 1000)}s: ${url}`);
      await delay(waitMs);
    } catch (error) {
      const abortOrNetwork = error.name === 'AbortError' || error.cause || error.code || error.message.includes('fetch failed');

      if (!abortOrNetwork || attempt >= maxRetries) {
        throw error;
      }

      const waitMs = Math.min(retryDelayMs * (retryMultiplier ** attempt), maxRetryDelayMs);
      const event = {
        url,
        status: error.name === 'AbortError' ? 'timeout' : 'network',
        attempt: attempt + 1,
        maxRetries,
        waitMs,
        message: error.message
      };
      report.retryEvents.push(event);
      report.requestCounts.retries += 1;
      console.warn(`PSGC Cloud ${event.status}; retry ${event.attempt}/${maxRetries} in ${Math.round(waitMs / 1000)}s: ${url}`);
      await delay(waitMs);
    }
  }

  throw new Error(`PSGC Cloud request failed after ${maxRetries} retries: ${url}`);
}

function filterById(rows, id) {
  const clean = cleanId(id);
  if (!clean) return rows;
  return rows.filter((row) => row.id === clean || row.code === clean || row.name === clean);
}

async function fetchList(baseUrl, requestPath, fallbackType, options, report) {
  return sortRows(asArray(await fetchJson(baseUrl, requestPath, options, report)).map((row) => normalizeItem(row, fallbackType)));
}

function readCachedList(file, fallbackType) {
  const cached = readJson(file, null);
  if (!Array.isArray(cached)) {
    throw new Error(`Cached PSGC file is not an array: ${file}`);
  }
  return sortRows(cached.map((row) => normalizeItem(row, fallbackType)));
}

async function fetchOrReuseList(file, baseUrl, requestPath, fallbackType, options, report) {
  if (options.resume && !options.force && fs.existsSync(file)) {
    const rows = readCachedList(file, fallbackType);
    report.reusedFiles.push(path.relative(options.outRoot, file).replace(/\\/g, '/'));
    report.requestCounts.reused += 1;
    console.log(`    Resume: using cached ${path.relative(options.outRoot, file).replace(/\\/g, '/')} (${rows.length})`);
    return rows;
  }

  const rows = await fetchList(baseUrl, requestPath, fallbackType, options, report);
  writeJson(file, rows);
  report.requestCounts.fetched += 1;
  return rows;
}

function safeWriteReport(file, report) {
  try {
    writeJson(file, report);
  } catch (error) {
    console.warn(`Failed to write cache report ${file}: ${error.message}`);
  }
}

const args = parseArgs(process.argv);
const out = args.out || 'data/psgc';
const baseUrl = args.baseUrl || 'https://psgc.cloud/api/v2';
const regionFilter = cleanId(args.region);
const provinceFilter = cleanId(args.province);
const skipBarangays = boolArg(args.skipBarangays, false);
const force = boolArg(args.force, false);
const resume = boolArg(args.resume, true);
const outRoot = path.resolve(out);

const options = {
  outRoot,
  delayMs: numberArg(args.delayMs, 300),
  maxRetries: numberArg(args.maxRetries, 8),
  retryDelayMs: numberArg(args.retryDelayMs, 2000),
  retryMultiplier: numberArg(args.retryMultiplier, 2),
  maxRetryDelayMs: numberArg(args.maxRetryDelayMs, 120000),
  timeoutMs: numberArg(args.timeoutMs, 60000),
  resume,
  force
};

const report = {
  baseUrl,
  out,
  filters: { region: regionFilter, province: provinceFilter, skipBarangays },
  options: {
    delayMs: options.delayMs,
    maxRetries: options.maxRetries,
    retryDelayMs: options.retryDelayMs,
    retryMultiplier: options.retryMultiplier,
    maxRetryDelayMs: options.maxRetryDelayMs,
    timeoutMs: options.timeoutMs,
    resume,
    force
  },
  counts: {
    regions: 0,
    provinces: 0,
    directRegionCities: 0,
    provinceCities: 0,
    barangays: 0
  },
  requestCounts: { total: 0, fetched: 0, reused: 0, retries: 0 },
  retryEvents: [],
  reusedFiles: [],
  generatedAt: new Date().toISOString(),
  completedAt: null,
  skipped: [],
  failures: [],
  ok: false
};

const reportFile = path.join(out, 'cache-psgc-cloud-report.json');

try {
  console.log(`Caching PSGC Cloud hierarchy from ${baseUrl}`);
  console.log(`Output folder: ${out}`);
  console.log(`Delay: ${options.delayMs}ms; retries: ${options.maxRetries}; resume: ${resume ? 'on' : 'off'}; force: ${force ? 'on' : 'off'}`);

  let regions = await fetchOrReuseList(path.join(out, 'regions.json'), baseUrl, 'regions', 'region', options, report);
  regions = filterById(regions, regionFilter);
  writeJson(path.join(out, 'regions.json'), regions);
  report.counts.regions = regions.length;
  safeWriteReport(reportFile, report);

  for (const region of regions) {
    console.log(`Region: ${region.name} (${region.id})`);

    let provinces = await fetchOrReuseList(path.join(out, 'provinces', `${region.id}.json`), baseUrl, `regions/${encodeSegment(region.id)}/provinces`, 'province', options, report);
    provinces = filterById(provinces, provinceFilter);
    writeJson(path.join(out, 'provinces', `${region.id}.json`), provinces);
    report.counts.provinces += provinces.length;
    safeWriteReport(reportFile, report);

    if (!provinceFilter) {
      const regionCities = await fetchOrReuseList(path.join(out, 'cities', `${region.id}.json`), baseUrl, `regions/${encodeSegment(region.id)}/cities-municipalities`, 'city_municipality', options, report);
      const directRegionCities = regionCities.filter((city) => !city.province);
      const citiesToUse = directRegionCities.length > 0 ? directRegionCities : (provinces.length === 0 ? regionCities : []);

      if (citiesToUse.length > 0) {
        writeJson(path.join(out, 'cities', `${region.id}.json`), citiesToUse);
        report.counts.directRegionCities += citiesToUse.length;
        safeWriteReport(reportFile, report);

        if (!skipBarangays) {
          for (const city of citiesToUse) {
            console.log(`  City/Municipality: ${city.name} (${city.id})`);
            const barangays = await fetchOrReuseList(path.join(out, 'barangays', `${city.id}.json`), baseUrl, `cities-municipalities/${encodeSegment(city.id)}/barangays`, 'barangay', options, report);
            writeJson(path.join(out, 'barangays', `${city.id}.json`), barangays);
            report.counts.barangays += barangays.length;
            safeWriteReport(reportFile, report);
          }
        }
      }
    }

    for (const province of provinces) {
      console.log(`  Province: ${province.name} (${province.id})`);
      const cities = await fetchOrReuseList(path.join(out, 'cities', `${province.id}.json`), baseUrl, `provinces/${encodeSegment(province.id)}/cities-municipalities`, 'city_municipality', options, report);
      writeJson(path.join(out, 'cities', `${province.id}.json`), cities);
      report.counts.provinceCities += cities.length;
      safeWriteReport(reportFile, report);

      if (skipBarangays) continue;

      for (const city of cities) {
        console.log(`    City/Municipality: ${city.name} (${city.id})`);
        const barangays = await fetchOrReuseList(path.join(out, 'barangays', `${city.id}.json`), baseUrl, `cities-municipalities/${encodeSegment(city.id)}/barangays`, 'barangay', options, report);
        writeJson(path.join(out, 'barangays', `${city.id}.json`), barangays);
        report.counts.barangays += barangays.length;
        safeWriteReport(reportFile, report);
      }
    }
  }

  report.ok = true;
  report.completedAt = new Date().toISOString();
  safeWriteReport(reportFile, report);

  console.log('PSGC cache complete.');
  console.log(JSON.stringify(report.counts, null, 2));
} catch (error) {
  report.ok = false;
  report.completedAt = new Date().toISOString();
  report.failures.push({
    code: 'cache_failed',
    message: error.message,
    status: error.status || null,
    url: error.url || null
  });
  safeWriteReport(reportFile, report);
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
