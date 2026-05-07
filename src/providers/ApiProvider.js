import { createProviderError, normalizeLocationValue, normalizeProviderArray, normalizeProviderRow, normalizeReverseMatch } from './providerContract.js';
function cleanId(value) {
  return String(value || '').trim();
}

/**
 * Backend API provider contract for PHP apps.
 *
 * Expected endpoints:
 *   GET {baseUrl}/regions
 *   GET {baseUrl}/provinces?region_id=...
 *   GET {baseUrl}/cities?province_id=...
 *   GET {baseUrl}/barangays?city_id=...
 *   GET {baseUrl}/location?region_id=&province_id=&city_id=&barangay_id=
 *   GET {baseUrl}/bounds?level=&id=
 *   GET {baseUrl}/centroid?level=&id=
 *   GET {baseUrl}/polygon?level=&id=
 *   GET {baseUrl}/reverse?lat=&lng=
 */
export class ApiProvider {
  constructor(options = {}) {
    this.baseUrl = String(options.baseUrl || '/api/location').replace(/\/+$/, '');
    this.cache = new Map();
  }

  async fetchJson(path, params = {}) {
    const url = new URL(`${this.baseUrl}/${String(path || '').replace(/^\/+/, '')}`, window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const cacheKey = url.toString();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
    } catch (error) {
      throw createProviderError(error, {
        provider: 'api',
        method: 'fetchJson',
        path,
        code: 'api_network_failed',
        reason: 'network'
      });
    }

    if (!response.ok) {
      throw createProviderError(`Location API request failed: ${path} (${response.status})`, {
        provider: 'api',
        method: 'fetchJson',
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
        method: 'fetchJson',
        status: response.status,
        path,
        code: 'api_malformed_json',
        reason: 'malformed_json'
      });
    }

    this.cache.set(cacheKey, data);

    return data;
  }

  async getRegions() {
    return normalizeProviderArray(await this.fetchJson('regions')).map((row) => normalizeProviderRow(row, 'region'));
  }

  async getProvinces(regionId) {
    return normalizeProviderArray(await this.fetchJson('provinces', { region_id: regionId })).map((row) => normalizeProviderRow(row, 'province'));
  }

  async getCities(parentId, context = {}) {
    return normalizeProviderArray(await this.fetchJson('cities', {
      province_id: context.province_id || '',
      region_id: context.province_id ? '' : (context.region_id || parentId)
    })).map((row) => normalizeProviderRow(row, 'city_municipality'));
  }

  async getBarangays(cityId) {
    return normalizeProviderArray(await this.fetchJson('barangays', { city_id: cityId })).map((row) => normalizeProviderRow(row, 'barangay'));
  }

  async getLocationByIds(ids = {}) {
    return normalizeLocationValue(await this.fetchJson('location', ids));
  }

  async getBounds(level, id) {
    return this.fetchJson('bounds', { level, id }).catch(() => null);
  }

  async getCentroid(level, id) {
    return this.fetchJson('centroid', { level, id }).catch(() => null);
  }

  async getPolygon(level, id) {
    return this.fetchJson('polygon', { level, id }).catch(() => null);
  }

  async reverseGeocode(lat, lng, context = {}) {
    const match = await this.fetchJson('reverse', {
      lat,
      lng,
      city_id: context.city_id || ''
    }).catch(() => null);

    return match ? normalizeReverseMatch(match) : null;
  }
}
