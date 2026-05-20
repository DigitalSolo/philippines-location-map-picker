import { createProviderError, normalizeLocationValue, normalizeProviderArray, normalizeProviderRow, normalizeReverseMatch } from './providerContract.js';

const DEFAULT_ENDPOINTS = Object.freeze({
  regions: 'regions',
  provinces: 'provinces',
  cities: 'cities',
  barangays: 'barangays',
  location: 'location',
  bounds: 'bounds',
  centroid: 'centroid',
  polygon: 'polygon',
  reverse: 'reverse'
});

function cleanText(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeMethod(value, fallback = 'GET') {
  const method = cleanText(value || fallback).toUpperCase();
  return method === 'POST' ? 'POST' : 'GET';
}

function normalizeBaseUrl(value) {
  return cleanText(value || '/api/location').replace(/\/+$/, '');
}

function normalizeEndpoint(path) {
  return cleanText(path).replace(/^\/+/, '').replace(/\/+$/, '');
}

function extractPayload(data) {
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.prototype.hasOwnProperty.call(data, 'data')) {
    return data.data;
  }

  return data;
}

/**
 * Backend API provider contract for PHP/MariaDB apps.
 *
 * Default endpoints:
 *   GET  {baseUrl}/regions
 *   GET  {baseUrl}/provinces?region_id=...
 *   GET  {baseUrl}/cities?province_id=... or region_id=...
 *   GET  {baseUrl}/barangays?city_id=...
 *   GET  {baseUrl}/location?region_id=&province_id=&city_id=&barangay_id=
 *   GET  {baseUrl}/bounds?level=&id=
 *   GET  {baseUrl}/centroid?level=&id=
 *   GET  {baseUrl}/polygon?level=&id=
 *   POST {baseUrl}/reverse  { lat, lng, city_id }
 *
 * The response may be either a raw JSON value or { data: value }.
 */
export class ApiProvider {
  constructor(options = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl || options.apiUrl);
    this.endpoints = { ...DEFAULT_ENDPOINTS, ...(options.endpoints || {}) };
    this.reverseMethod = normalizeMethod(options.reverseMethod, 'POST');
    this.credentials = options.credentials || 'same-origin';
    this.fetchOptions = options.fetchOptions && typeof options.fetchOptions === 'object' ? options.fetchOptions : {};
    this.cacheResponses = options.cacheResponses !== false;
    this.cache = new Map();
  }

  endpoint(name) {
    const endpoint = normalizeEndpoint(this.endpoints[name] || name);
    if (!endpoint) {
      throw new Error(`Location API endpoint is not configured: ${name}`);
    }
    return endpoint;
  }

  createUrl(path, params = {}) {
    const url = new URL(`${this.baseUrl}/${normalizeEndpoint(path)}`, window.location.origin);

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return url;
  }

  async requestJson(path, params = {}, options = {}) {
    const method = normalizeMethod(options.method, 'GET');
    const url = method === 'GET' ? this.createUrl(path, params) : this.createUrl(path);
    const cacheKey = `${method} ${url.toString()} ${method === 'POST' ? JSON.stringify(params || {}) : ''}`;

    if (method === 'GET' && this.cacheResponses && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let response;
    try {
      response = await fetch(url, {
        ...this.fetchOptions,
        method,
        credentials: this.credentials,
        headers: {
          Accept: 'application/json',
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
          ...(this.fetchOptions.headers || {})
        },
        body: method === 'POST' ? JSON.stringify(params || {}) : undefined
      });
    } catch (error) {
      throw createProviderError(error, {
        provider: 'api',
        method: 'requestJson',
        path,
        code: 'api_network_failed',
        reason: 'network'
      });
    }

    if (!response.ok) {
      throw createProviderError(`Location API request failed: ${path} (${response.status})`, {
        provider: 'api',
        method: 'requestJson',
        status: response.status,
        path,
        code: response.status === 404 ? 'api_not_found' : 'api_request_failed'
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw createProviderError(error, {
        provider: 'api',
        method: 'requestJson',
        status: response.status,
        path,
        code: 'api_malformed_json',
        reason: 'malformed_json'
      });
    }

    const payload = extractPayload(data);

    if (method === 'GET' && this.cacheResponses) {
      this.cache.set(cacheKey, payload);
    }

    return payload;
  }

  async fetchJson(path, params = {}) {
    return this.requestJson(path, params, { method: 'GET' });
  }

  async getRegions() {
    return normalizeProviderArray(await this.fetchJson(this.endpoint('regions'))).map((row) => normalizeProviderRow(row, 'region'));
  }

  async getProvinces(regionId) {
    return normalizeProviderArray(await this.fetchJson(this.endpoint('provinces'), { region_id: regionId })).map((row) => normalizeProviderRow(row, 'province'));
  }

  async getCities(parentId, context = {}) {
    return normalizeProviderArray(await this.fetchJson(this.endpoint('cities'), {
      province_id: context.province_id || '',
      region_id: context.province_id ? '' : (context.region_id || parentId)
    })).map((row) => normalizeProviderRow(row, 'city_municipality'));
  }

  async getBarangays(cityId) {
    return normalizeProviderArray(await this.fetchJson(this.endpoint('barangays'), { city_id: cityId })).map((row) => normalizeProviderRow(row, 'barangay'));
  }

  async getLocationByIds(ids = {}) {
    const location = await this.fetchJson(this.endpoint('location'), ids);
    return location ? normalizeLocationValue(location) : normalizeLocationValue(ids);
  }

  async getBounds(level, id) {
    return this.fetchJson(this.endpoint('bounds'), { level, id }).catch(() => null);
  }

  async getCentroid(level, id) {
    return this.fetchJson(this.endpoint('centroid'), { level, id }).catch(() => null);
  }

  async getPolygon(level, id) {
    return this.fetchJson(this.endpoint('polygon'), { level, id }).catch(() => null);
  }

  async reverseGeocode(lat, lng, context = {}) {
    const params = {
      lat,
      lng,
      region_id: context.region_id || '',
      province_id: context.province_id || '',
      city_id: context.city_id || '',
      barangay_id: context.barangay_id || ''
    };

    const match = await this.requestJson(this.endpoint('reverse'), params, {
      method: this.reverseMethod
    }).catch(() => null);

    return match ? normalizeReverseMatch(match) : null;
  }
}
