import { createProviderError, normalizeLocationValue, normalizeProviderArray, normalizeProviderRow } from './providerContract.js';
import {
  barangayCodeCandidates,
  cityCodeCandidates,
  deriveCityId,
  deriveProvinceId,
  deriveRegionId,
  provinceCodeCandidates,
  regionCodeCandidates,
  toTenDigitPsgcCode
} from '../geo/psgcCodes.js';

function cleanId(value) {
  return String(value ?? '').trim();
}

function normalizeArray(value) {
  return normalizeProviderArray(value);
}

function encodeSegment(value) {
  return encodeURIComponent(cleanId(value));
}

function normalizeName(value) {
  return String(value ?? '').trim();
}

function sortRows(rows) {
  return rows.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueValues(values) {
  return [...new Set(values.map(cleanId).filter(Boolean))];
}

function tenDigitCandidates(candidates, level) {
  return uniqueValues(candidates.map((candidate) => toTenDigitPsgcCode(candidate, level) || cleanId(candidate)))
    .filter((candidate) => /^\d{10}$/.test(candidate));
}

function codeValuesForRow(row) {
  return [
    row.id,
    row.code,
    row.psgc_code,
    row.correspondence_code,
    row.correspondenceCode
  ].map(cleanId).filter(Boolean);
}

function normalizeLookupText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(city|municipality|province|region|of|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function lookupTokens(value) {
  return normalizeLookupText(value).split(' ').filter(Boolean);
}

function textMatches(candidate, target) {
  const a = normalizeLookupText(candidate);
  const b = normalizeLookupText(target);

  if (!a || !b) {
    return false;
  }

  if (a === b || a.includes(b) || b.includes(a)) {
    return true;
  }

  const aTokens = new Set(lookupTokens(a));
  const bTokens = lookupTokens(b);

  return bTokens.length > 0 && bTokens.every((token) => aTokens.has(token));
}

function rowNameMatches(row, names) {
  const rowNames = uniqueValues([
    row.name,
    row.area_name,
    row.label,
    row.code_name,
    row.slug
  ]);
  const candidateNames = uniqueValues(names);

  return rowNames.some((rowName) => candidateNames.some((candidateName) => textMatches(rowName, candidateName)));
}

function normalizeRelation(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return {
      id: value,
      code: value,
      name: value
    };
  }

  const code = cleanId(value.code || value.id || value.psgc_code);
  const name = normalizeName(value.name || value.area_name || value.label || value.code_name || value.slug || code);

  return {
    id: code || name,
    code: code || name,
    name
  };
}

function normalizePsgcItem(row, fallbackType = '') {
  const source = row || {};
  const code = cleanId(source.code || source.id || source.psgc_code);
  const name = normalizeName(source.name || source.area_name || source.label || source.code_name || source.slug || code);
  const type = normalizeName(source.type || source.geographic_level || fallbackType);

  return {
    id: code || name,
    code: code || name,
    name,
    type,
    status: normalizeName(source.status || ''),
    zip_code: normalizeName(source.zip_code || source.postal_code || ''),
    code_name: normalizeName(source.code_name || source.codeName || ''),
    slug: normalizeName(source.slug || ''),
    label: normalizeName(source.label || ''),
    area_name: normalizeName(source.area_name || source.areaName || ''),
    psgc_code: cleanId(source.psgc_code || source.psgcCode || ''),
    correspondence_code: cleanId(source.correspondence_code || source.correspondenceCode || source.old_code || source.oldCode || ''),
    region: normalizeRelation(source.region),
    province: normalizeRelation(source.province),
    city_municipality: normalizeRelation(source.city_municipality || source.city || source.municipality)
  };
}

function codeMatches(row, candidates) {
  const rawCandidates = candidates.map(cleanId).filter(Boolean);
  const candidateSet = new Set(rawCandidates);

  rawCandidates.forEach((candidate) => {
    ['region', 'province', 'city', 'barangay'].forEach((level) => {
      const tenDigitCode = toTenDigitPsgcCode(candidate, level);
      if (tenDigitCode) {
        candidateSet.add(tenDigitCode);
      }
    });
  });

  if (candidateSet.size === 0) {
    return false;
  }

  const values = codeValuesForRow(row);
  [...values].forEach((value) => {
    ['region', 'province', 'city', 'barangay'].forEach((level) => {
      const tenDigitCode = toTenDigitPsgcCode(value, level);
      if (tenDigitCode) {
        values.push(tenDigitCode);
      }
    });
  });

  return values.some((value) => candidateSet.has(value));
}

function rowMatches(row, candidates, names = []) {
  return codeMatches(row, candidates) || rowNameMatches(row, names);
}

function relationMatches(rowRelation, candidates, names = []) {
  if (!rowRelation) {
    return false;
  }

  return rowMatches(rowRelation, candidates, names);
}

function isSafeEndpointSegment(value) {
  const segment = cleanId(value);
  return Boolean(segment) && !/^\d+$/.test(segment);
}

function endpointSegments(row, fallbackName = '', fallbackId = '', includeUnsafe = false) {
  const segments = [];

  if (row) {
    segments.push(row.code_name, row.slug);

    if (includeUnsafe) {
      segments.push(row.name, row.label, row.area_name, row.code, row.id, row.psgc_code, row.correspondence_code);
    }
  }

  if (includeUnsafe) {
    segments.push(fallbackName, fallbackId);
  }

  const uniqueSegments = uniqueValues(segments);

  if (includeUnsafe) {
    return uniqueSegments;
  }

  return uniqueSegments.filter(isSafeEndpointSegment);
}

function mergeRelation(location, row) {
  if (!row) {
    return;
  }

  if (row.region) {
    location.region_id = row.region.id || location.region_id;
    location.region_name = row.region.name || location.region_name;
  }

  if (row.province) {
    location.province_id = row.province.id || location.province_id;
    location.province_name = row.province.name || location.province_name;
  }

  if (row.city_municipality) {
    location.city_id = row.city_municipality.id || location.city_id;
    location.city_name = row.city_municipality.name || location.city_name;
  }
}

export class PsgcCloudProvider {
  constructor(options = {}) {
    this.baseUrl = String(options.baseUrl || 'https://psgc.cloud/api/v2').replace(/\/+$/, '');
    this.cache = new Map();
    this.notFoundCache = new Set();
    this.allowEndpointFallbacks = options.allowEndpointFallbacks === true;
    this.cacheNotFound = options.cacheNotFound !== false;
  }

  async fetchJson(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');

    if (this.cache.has(cleanPath)) {
      return this.cache.get(cleanPath);
    }

    if (this.notFoundCache.has(cleanPath)) {
      const error = createProviderError(`PSGC Cloud request failed: ${cleanPath} (404)`, {
        provider: 'psgc-cloud',
        method: 'fetchJson',
        status: 404,
        path: cleanPath,
        code: 'psgc_not_found'
      });
      error.cached = true;
      throw error;
    }

    let response;
    try {
      response = await fetch(`${this.baseUrl}/${cleanPath}`, {
        headers: { Accept: 'application/json' }
      });
    } catch (error) {
      throw createProviderError(error, {
        provider: 'psgc-cloud',
        method: 'fetchJson',
        path: cleanPath,
        code: 'psgc_network_failed',
        reason: 'network'
      });
    }

    if (!response.ok) {
      const error = createProviderError(`PSGC Cloud request failed: ${cleanPath} (${response.status})`, {
        provider: 'psgc-cloud',
        method: 'fetchJson',
        status: response.status,
        path: cleanPath,
        code: response.status === 404 ? 'psgc_not_found' : 'psgc_request_failed'
      });

      if (this.cacheNotFound && response.status === 404) {
        this.notFoundCache.add(cleanPath);
      }

      throw error;
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw createProviderError(error, {
        provider: 'psgc-cloud',
        method: 'fetchJson',
        status: response.status,
        path: cleanPath,
        code: 'psgc_malformed_json',
        reason: 'malformed_json'
      });
    }

    this.cache.set(cleanPath, data);

    return data;
  }

  async fetchOptionalArray(path) {
    try {
      return normalizeArray(await this.fetchJson(path));
    } catch (error) {
      if (error.status === 404) {
        return [];
      }

      throw error;
    }
  }

  async fetchFirstArray(paths) {
    for (const path of uniqueValues(paths)) {
      const rows = await this.fetchOptionalArray(path);
      if (rows.length > 0) {
        return rows;
      }
    }

    return [];
  }

  async fetchOptionalItem(paths, fallbackType = '') {
    if (!this.allowEndpointFallbacks) {
      return null;
    }

    for (const path of uniqueValues(paths)) {
      try {
        return normalizePsgcItem(await this.fetchJson(path), fallbackType);
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }
    }

    return null;
  }

  findRow(rows, candidates, names = []) {
    return normalizeArray(rows)
      .map((row) => normalizePsgcItem(row))
      .find((row) => rowMatches(row, candidates, names)) || null;
  }

  async getRegions() {
    return sortRows(normalizeArray(await this.fetchJson('regions'))
      .map((row) => normalizePsgcItem(row, 'region')));
  }

  async getAllProvinces() {
    return sortRows((await this.fetchOptionalArray('provinces')).map((row) => normalizePsgcItem(row, 'province')));
  }

  async getAllCities() {
    return sortRows((await this.fetchOptionalArray('cities-municipalities')).map((row) => normalizePsgcItem(row, 'city_municipality')));
  }

  async getAllBarangays() {
    return sortRows((await this.fetchOptionalArray('barangays')).map((row) => normalizePsgcItem(row, 'barangay')));
  }

  async getProvinces(regionId, context = {}) {
    const regionName = normalizeName(context.region_name || '');

    if (!regionId && !regionName) {
      return [];
    }

    const region = await this.resolveRegion(regionId, regionName).catch(() => null);
    const regionCandidates = regionCodeCandidates(regionId || (region && region.id));
    const regionNames = uniqueValues([regionName, region && region.name]);
    const allProvinces = await this.getAllProvinces().catch(() => []);
    const filtered = allProvinces.filter((row) => relationMatches(row.region, regionCandidates, regionNames));

    if (filtered.length > 0) {
      return sortRows(filtered);
    }

    if (region) {
      const paths = endpointSegments(region, regionName, regionId, this.allowEndpointFallbacks)
        .map((segment) => `regions/${encodeSegment(segment)}/provinces`);
      return sortRows((await this.fetchFirstArray(paths)).map((row) => normalizePsgcItem(row, 'province')));
    }

    if (!this.allowEndpointFallbacks) {
      return [];
    }

    const paths = tenDigitCandidates(regionCandidates, 'region').map((candidate) => `regions/${encodeSegment(candidate)}/provinces`);
    return sortRows((await this.fetchFirstArray(paths)).map((row) => normalizePsgcItem(row, 'province')));
  }

  async getCities(parentId, context = {}) {
    const provinceId = cleanId(context.province_id || parentId);
    const regionId = cleanId(context.region_id || parentId);
    const provinceName = normalizeName(context.province_name || '');
    const regionName = normalizeName(context.region_name || '');
    const allCities = await this.getAllCities().catch(() => []);

    if (provinceId || provinceName) {
      const province = await this.resolveProvince(provinceId, regionId, provinceName, regionName).catch(() => null);
      const provinceCandidates = provinceCodeCandidates(provinceId || (province && province.id));
      const provinceNames = uniqueValues([provinceName, province && province.name]);
      const filtered = allCities.filter((row) => relationMatches(row.province, provinceCandidates, provinceNames));

      if (filtered.length > 0) {
        return sortRows(filtered);
      }

      if (province) {
        const paths = endpointSegments(province, provinceName, provinceId, this.allowEndpointFallbacks)
          .map((segment) => `provinces/${encodeSegment(segment)}/cities-municipalities`);
        const rows = await this.fetchFirstArray(paths);
        if (rows.length > 0) {
          return sortRows(rows.map((row) => normalizePsgcItem(row, 'city_municipality')));
        }
      }
    }

    if (regionId || regionName) {
      const region = await this.resolveRegion(regionId, regionName).catch(() => null);
      const regionCandidates = regionCodeCandidates(regionId || (region && region.id));
      const regionNames = uniqueValues([regionName, region && region.name]);
      const filtered = allCities.filter((row) => relationMatches(row.region, regionCandidates, regionNames));

      if (filtered.length > 0) {
        return sortRows(filtered);
      }

      if (region) {
        const paths = endpointSegments(region, regionName, regionId, this.allowEndpointFallbacks)
          .map((segment) => `regions/${encodeSegment(segment)}/cities-municipalities`);
        return sortRows((await this.fetchFirstArray(paths)).map((row) => normalizePsgcItem(row, 'city_municipality')));
      }
    }

    return [];
  }

  async getBarangays(cityMunicipalityId, context = {}) {
    const cityId = cleanId(cityMunicipalityId || context.city_id);
    const cityName = normalizeName(context.city_name || '');

    if (!cityId && !cityName) {
      return [];
    }

    const city = await this.resolveCity(cityId, context).catch(() => null);

    const cityCandidates = cityCodeCandidates(cityId || (city && city.id));
    const cityNames = uniqueValues([cityName, city && city.name]);

    if (city) {
      const paths = endpointSegments(city, cityName, cityId, this.allowEndpointFallbacks)
        .map((segment) => `cities-municipalities/${encodeSegment(segment)}/barangays`);
      const rows = await this.fetchFirstArray(paths);
      if (rows.length > 0) {
        return sortRows(rows.map((row) => normalizePsgcItem(row, 'barangay')));
      }
    }

    const allBarangays = await this.getAllBarangays().catch(() => []);
    const filtered = allBarangays.filter((row) => relationMatches(row.city_municipality, cityCandidates, cityNames));
    if (filtered.length > 0) {
      return sortRows(filtered);
    }

    if (!this.allowEndpointFallbacks) {
      return [];
    }

    const paths = tenDigitCandidates(cityCandidates, 'city').map((candidate) => `cities-municipalities/${encodeSegment(candidate)}/barangays`);
    return sortRows((await this.fetchFirstArray(paths)).map((row) => normalizePsgcItem(row, 'barangay')));
  }

  async resolveRegion(regionId, regionName = '') {
    const candidates = regionCodeCandidates(regionId);
    const names = uniqueValues([regionName]);
    const listRow = this.findRow(await this.getRegions().catch(() => []), candidates, names);
    if (listRow) {
      return listRow;
    }

    const paths = [regionName ? `regions/${encodeSegment(regionName)}` : '', ...tenDigitCandidates(candidates, 'region').map((candidate) => `regions/${encodeSegment(candidate)}`)].filter(Boolean);
    return this.fetchOptionalItem(paths, 'region');
  }

  async resolveProvince(provinceId, regionId = '', provinceName = '', regionName = '') {
    if (!provinceId && !provinceName) {
      return null;
    }

    const candidates = provinceCodeCandidates(provinceId);
    const names = uniqueValues([provinceName]);
    const region = regionId || regionName ? await this.resolveRegion(regionId, regionName).catch(() => null) : null;
    const listRow = region ? this.findRow(await this.getProvinces(region.id || regionId).catch(() => []), candidates, names) : null;
    if (listRow) {
      return listRow;
    }

    const globalRow = this.findRow(await this.getAllProvinces().catch(() => []), candidates, names);
    if (globalRow) {
      return globalRow;
    }

    const paths = [provinceName ? `provinces/${encodeSegment(provinceName)}` : '', ...tenDigitCandidates(candidates, 'province').map((candidate) => `provinces/${encodeSegment(candidate)}`)].filter(Boolean);
    return this.fetchOptionalItem(paths, 'province');
  }

  async resolveCity(cityId, context = {}) {
    const cityName = normalizeName(context.city_name || '');
    if (!cityId && !cityName) {
      return null;
    }

    const candidates = cityCodeCandidates(cityId);
    const names = uniqueValues([cityName]);
    const parentId = context.province_id || context.region_id || '';
    const listRow = parentId || context.province_name || context.region_name
      ? this.findRow(await this.getCities(parentId, context).catch(() => []), candidates, names)
      : null;
    if (listRow) {
      return listRow;
    }

    const globalRows = await this.getAllCities().catch(() => []);
    const globalRow = this.findRow(globalRows, candidates, names);
    if (globalRow) {
      return globalRow;
    }

    const paths = [cityName ? `cities-municipalities/${encodeSegment(cityName)}` : '', ...tenDigitCandidates(candidates, 'city').map((candidate) => `cities-municipalities/${encodeSegment(candidate)}`)].filter(Boolean);
    return this.fetchOptionalItem(paths, 'city_municipality');
  }

  async resolveBarangay(barangayId, cityId = '', barangayName = '', cityName = '') {
    if (!barangayId && !barangayName) {
      return null;
    }

    const candidates = barangayCodeCandidates(barangayId);
    const names = uniqueValues([barangayName]);
    const listRow = cityId || cityName ? this.findRow(await this.getBarangays(cityId, { city_id: cityId, city_name: cityName }).catch(() => []), candidates, names) : null;
    if (listRow) {
      return listRow;
    }

    const paths = [barangayName ? `barangays/${encodeSegment(barangayName)}` : '', ...tenDigitCandidates(candidates, 'barangay').map((candidate) => `barangays/${encodeSegment(candidate)}`)].filter(Boolean);
    return this.fetchOptionalItem(paths, 'barangay');
  }

  async getLocationByIds(ids = {}) {
    let regionId = cleanId(ids.region_id);
    let provinceId = cleanId(ids.province_id);
    let cityId = cleanId(ids.city_id);
    let barangayId = cleanId(ids.barangay_id);

    const regionName = normalizeName(ids.region_name || '');
    const provinceName = normalizeName(ids.province_name || '');
    const cityName = normalizeName(ids.city_name || '');
    const barangayName = normalizeName(ids.barangay_name || '');

    if (barangayId && !cityId) {
      cityId = deriveCityId(barangayId);
    }
    if (cityId && !provinceId) {
      provinceId = deriveProvinceId(cityId);
    }
    if ((provinceId || cityId || barangayId) && !regionId) {
      regionId = deriveRegionId(provinceId || cityId || barangayId);
    }

    const location = {
      region_id: regionId,
      region_name: regionName,
      province_id: provinceId,
      province_name: provinceName,
      city_id: cityId,
      city_name: cityName,
      barangay_id: barangayId,
      barangay_name: barangayName
    };

    const region = await this.resolveRegion(regionId, regionName).catch(() => null);
    if (region) {
      location.region_id = region.id;
      location.region_name = region.name;
    }

    const province = await this.resolveProvince(provinceId, location.region_id || regionId, provinceName, location.region_name || regionName).catch(() => null);
    if (province) {
      location.province_id = province.id;
      location.province_name = province.name;
      mergeRelation(location, province);
    }

    const city = await this.resolveCity(cityId, {
      region_id: location.region_id || regionId,
      region_name: location.region_name || regionName,
      province_id: location.province_id || provinceId,
      province_name: location.province_name || provinceName,
      city_name: cityName
    }).catch(() => null);
    if (city) {
      location.city_id = city.id;
      location.city_name = city.name;
      mergeRelation(location, city);

      if (!city.province) {
        location.province_id = '';
        location.province_name = '';
      }
    }

    const barangay = await this.resolveBarangay(barangayId, location.city_id || cityId, barangayName, location.city_name || cityName).catch(() => null);
    if (barangay) {
      location.barangay_id = barangay.id;
      location.barangay_name = barangay.name;
      mergeRelation(location, barangay);
    }

    location.label = [location.city_name, location.barangay_name].filter(Boolean).join(' → ');
    location.display_label = location.label;

    return normalizeLocationValue(location);
  }

  async getBounds() {
    return null;
  }

  async getCentroid() {
    return null;
  }

  async getPolygon() {
    return null;
  }

  async reverseGeocode() {
    return null;
  }
}
