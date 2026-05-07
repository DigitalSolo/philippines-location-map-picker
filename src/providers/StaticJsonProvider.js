import { createProviderError, normalizeLocationValue } from './providerContract.js';
import { boundsCenter, boundsContains, normalizeBounds } from '../geo/bounds.js';
import { pointInPolygon } from '../geo/pointInPolygon.js';
import {
  barangayCodeCandidates,
  cityCodeCandidates,
  cityFolderCandidates,
  deriveCityId,
  deriveProvinceId,
  deriveRegionId,
  parentCodeCandidates,
  provinceCodeCandidates,
  regionCodeCandidates,
  sameCity
} from '../geo/psgcCodes.js';

const asArray = (value) => Array.isArray(value) ? value : [];
const cleanId = (value) => String(value ?? '').trim();
const rowId = (row) => cleanId(row && (row.id || row.code));
const rowName = (row) => String(row && row.name || '').trim();

function sortRows(rows) {
  return asArray(rows).slice().sort((a, b) => rowName(a).localeCompare(rowName(b)));
}

function degreesToRadians(degrees) {
  return Number(degrees) * Math.PI / 180;
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(Number(b.lat) - Number(a.lat));
  const dLng = degreesToRadians(Number(b.lng) - Number(a.lng));
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);

  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export class StaticJsonProvider {
  constructor(options = {}) {
    this.baseUrl = String(options.baseUrl || '/data').replace(/\/+$/, '');
    this.cache = new Map();
    this.reverseMaxNearestKm = Number.isFinite(Number(options.reverseMaxNearestKm))
      ? Number(options.reverseMaxNearestKm)
      : 0;
  }

  async fetchJson(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');

    if (this.cache.has(cleanPath)) {
      return this.cache.get(cleanPath);
    }

    let response;
    try {
      response = await fetch(`${this.baseUrl}/${cleanPath}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
    } catch (error) {
      throw createProviderError(error, {
        provider: 'static-json',
        method: 'fetchJson',
        path: cleanPath,
        code: 'static_json_network_failed',
        reason: 'network'
      });
    }

    if (!response.ok) {
      throw createProviderError(`Location data request failed: ${cleanPath} (${response.status})`, {
        provider: 'static-json',
        method: 'fetchJson',
        status: response.status,
        path: cleanPath,
        code: response.status === 404 ? 'static_json_not_found' : 'static_json_request_failed'
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw createProviderError(error, {
        provider: 'static-json',
        method: 'fetchJson',
        status: response.status,
        path: cleanPath,
        code: 'static_json_malformed_json',
        reason: 'malformed_json'
      });
    }

    this.cache.set(cleanPath, data);

    return data;
  }

  async fetchOptionalJson(path, fallback = null) {
    try {
      return await this.fetchJson(path);
    } catch (error) {
      if (error && (error.status === 404 || error.status === 403)) {
        return fallback;
      }
      return fallback;
    }
  }

  async fetchFirst(paths, fallback = null) {
    for (const candidatePath of paths) {
      try {
        return await this.fetchJson(candidatePath);
      } catch (error) {
        // Try the next candidate path.
      }
    }

    return fallback;
  }

  async getRegions() {
    return sortRows(await this.fetchJson('psgc/regions.json'));
  }

  async getProvinces(regionId) {
    const paths = regionCodeCandidates(regionId).map((candidate) => `psgc/provinces/${candidate}.json`);
    return sortRows(await this.fetchFirst(paths, []));
  }

  async getCities(parentId, context = {}) {
    const provinceId = cleanId(context.province_id || parentId);
    const regionId = cleanId(context.region_id || parentId);
    const paths = [];

    if (provinceId) {
      provinceCodeCandidates(provinceId).forEach((candidate) => paths.push(`psgc/cities/${candidate}.json`));
    }

    if (!context.province_id && regionId) {
      regionCodeCandidates(regionId).forEach((candidate) => paths.push(`psgc/cities/${candidate}.json`));
    }

    return sortRows(await this.fetchFirst([...new Set(paths)], []));
  }

  async getBarangays(cityId) {
    const paths = cityCodeCandidates(cityId).map((candidate) => `psgc/barangays/${candidate}.json`);
    return sortRows(await this.fetchFirst(paths, []));
  }

  boundsFileName(level) {
    return level === 'city' ? 'cities' : `${level}s`;
  }

  async getBounds(level, id) {
    const fileName = this.boundsFileName(level);
    let data = {};

    data = await this.fetchOptionalJson(`geo/bounds/${fileName}.json`, null);

    if (!data && level === 'city') {
      data = await this.fetchOptionalJson('geo/bounds/citys.json', null);
    }

    if (!data || typeof data !== 'object') {
      return null;
    }

    for (const candidate of parentCodeCandidates(level, id)) {
      if (data[candidate]) {
        return normalizeBounds(data[candidate]);
      }
    }

    return null;
  }

  async getCentroid(level, id) {
    const fileName = this.boundsFileName(level);

    try {
      const data = await this.fetchOptionalJson(`geo/centroids/${fileName}.json`, {});
      for (const candidate of parentCodeCandidates(level, id)) {
        const row = data[candidate];
        if (row) {
          return { lat: Number(row.lat), lng: Number(row.lng) };
        }
      }
    } catch (error) {
      // Fall back to bounds center below.
    }

    const bounds = await this.getBounds(level, id).catch(() => null);
    return boundsCenter(bounds);
  }

  async getPolygon(level, id) {
    if (level !== 'barangay') {
      return null;
    }

    const barangayCandidates = barangayCodeCandidates(id);
    const folderCandidates = cityFolderCandidates(id);

    for (const barangayId of barangayCandidates) {
      for (const cityId of folderCandidates) {
        try {
          const polygon = await this.fetchJson(`geo/polygons/barangays/${cityId}/${barangayId}.json`);
          return Array.isArray(polygon) ? polygon : null;
        } catch (error) {
          // Try the next candidate folder/file.
        }
      }
    }

    return null;
  }

  findRow(rows, candidates) {
    return asArray(rows).find((row) => candidates.includes(rowId(row))) || null;
  }

  async getLocationByIds(ids = {}) {
    let regionId = cleanId(ids.region_id);
    let provinceId = cleanId(ids.province_id);
    let cityId = cleanId(ids.city_id);
    let barangayId = cleanId(ids.barangay_id);

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
      region_name: '',
      province_id: provinceId,
      province_name: '',
      city_id: cityId,
      city_name: '',
      barangay_id: barangayId,
      barangay_name: ''
    };

    if (regionId) {
      const row = this.findRow(await this.getRegions(), regionCodeCandidates(regionId));
      if (row) {
        location.region_id = rowId(row);
        location.region_name = rowName(row);
      }
    }

    const provinces = location.region_id ? await this.getProvinces(location.region_id) : [];
    if (provinceId && provinces.length > 0) {
      const row = this.findRow(provinces, provinceCodeCandidates(provinceId));
      if (row) {
        location.province_id = rowId(row);
        location.province_name = rowName(row);
      }
    } else if (provinces.length === 0) {
      location.province_id = '';
      location.province_name = '';
    }

    const cityParentId = location.province_id || location.region_id;
    const cities = cityParentId ? await this.getCities(cityParentId, {
      region_id: location.region_id,
      province_id: location.province_id
    }) : [];

    if (cityId) {
      const row = this.findRow(cities, cityCodeCandidates(cityId));
      if (row) {
        location.city_id = rowId(row);
        location.city_name = rowName(row);
      }
    }

    const barangays = location.city_id ? await this.getBarangays(location.city_id) : [];
    if (barangayId) {
      const row = this.findRow(barangays, barangayCodeCandidates(barangayId));
      if (row) {
        location.barangay_id = rowId(row);
        location.barangay_name = rowName(row);
      }
    }

    location.label = [location.city_name, location.barangay_name].filter(Boolean).join(' → ');
    location.display_label = location.label;

    return normalizeLocationValue(location);
  }

  async reverseGeocode(lat, lng, context = {}) {
    const point = { lat: Number(lat), lng: Number(lng) };

    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      return null;
    }

    const cityIds = [];

    if (context.city_id) {
      cityIds.push(cleanId(context.city_id));
    } else {
      const cityBounds = await this.fetchOptionalJson('geo/bounds/cities.json', null) || await this.fetchOptionalJson('geo/bounds/citys.json', {});
      Object.keys(cityBounds).forEach((cityId) => {
        if (boundsContains(cityBounds[cityId], point.lat, point.lng)) {
          cityIds.push(cityId);
        }
      });
    }

    const nearestCandidates = [];

    for (const cityId of cityIds) {
      const barangays = await this.getBarangays(cityId).catch(() => []);

      for (const barangay of barangays) {
        const barangayId = rowId(barangay);
        const bounds = await this.getBounds('barangay', barangayId).catch(() => null);
        const centroid = await this.getCentroid('barangay', barangayId).catch(() => null);

        if (centroid) {
          nearestCandidates.push({
            cityId,
            barangayId,
            distanceKm: distanceKm(point, centroid)
          });
        }

        if (!boundsContains(bounds, point.lat, point.lng)) {
          continue;
        }

        const polygon = await this.getPolygon('barangay', barangayId);
        if (polygon && polygon.length >= 3 && !pointInPolygon(point, polygon)) {
          continue;
        }

        const location = await this.getLocationByIds({
          region_id: deriveRegionId(barangayId),
          province_id: deriveProvinceId(barangayId),
          city_id: cityId,
          barangay_id: barangayId
        });

        location.match_quality = polygon && polygon.length >= 3 ? 'polygon' : 'bounds';
        location.match_distance_km = 0;

        return normalizeLocationValue(location);
      }
    }

    if (this.reverseMaxNearestKm <= 0) {
      return null;
    }

    nearestCandidates.sort((a, b) => a.distanceKm - b.distanceKm);
    const nearest = nearestCandidates[0];

    if (!nearest || nearest.distanceKm > this.reverseMaxNearestKm) {
      return null;
    }

    const location = await this.getLocationByIds({
      region_id: deriveRegionId(nearest.barangayId),
      province_id: deriveProvinceId(nearest.barangayId),
      city_id: nearest.cityId,
      barangay_id: nearest.barangayId
    });

    location.match_quality = 'nearest-centroid';
    location.match_distance_km = Number(nearest.distanceKm.toFixed(3));

    return normalizeLocationValue(location);
  }
}
