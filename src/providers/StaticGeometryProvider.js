import { createProviderError, normalizeReverseMatch } from './providerContract.js';
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
  sameCity
} from '../geo/psgcCodes.js';

function cleanId(value) {
  return String(value ?? '').trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function selectedContextFallback(context = {}) {
  const barangayId = cleanId(context.barangay_id);
  if (!barangayId) {
    return null;
  }

  return normalizeReverseMatch({
    region_id: cleanId(context.region_id) || deriveRegionId(barangayId),
    region_name: cleanId(context.region_name),
    province_id: cleanId(context.province_id) || deriveProvinceId(barangayId),
    province_name: cleanId(context.province_name),
    city_id: cleanId(context.city_id) || deriveCityId(barangayId),
    city_name: cleanId(context.city_name),
    barangay_id: barangayId,
    barangay_name: cleanId(context.barangay_name),
    match_quality: 'selected-context',
    match_distance_km: 0
  });
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

export class StaticGeometryProvider {
  constructor(options = {}) {
    this.baseUrl = String(options.baseUrl || '/data').replace(/\/+$/, '');
    this.cache = new Map();
    this.reverseMaxNearestKm = Number.isFinite(Number(options.reverseMaxNearestKm))
      ? Number(options.reverseMaxNearestKm)
      : 0;
    this.reverseFallbackToSelectedLocation = options.reverseFallbackToSelectedLocation === true;
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
        provider: 'static-geometry',
        method: 'fetchJson',
        path: cleanPath,
        code: 'static_geometry_network_failed',
        reason: 'network'
      });
    }

    if (!response.ok) {
      throw createProviderError(`Geometry data request failed: ${cleanPath} (${response.status})`, {
        provider: 'static-geometry',
        method: 'fetchJson',
        status: response.status,
        path: cleanPath,
        code: response.status === 404 ? 'static_geometry_not_found' : 'static_geometry_request_failed'
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw createProviderError(error, {
        provider: 'static-geometry',
        method: 'fetchJson',
        status: response.status,
        path: cleanPath,
        code: 'static_geometry_malformed_json',
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

    for (const barangayId of barangayCodeCandidates(id)) {
      for (const cityId of cityFolderCandidates(id)) {
        try {
          const polygon = await this.fetchJson(`geo/polygons/barangays/${cityId}/${barangayId}.json`);
          return asArray(polygon);
        } catch (error) {
          // Try the next candidate folder/file.
        }
      }
    }

    return null;
  }

  async reverseGeocode(lat, lng, context = {}) {
    const point = {
      lat: Number(lat),
      lng: Number(lng)
    };

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

    const barangayBounds = await this.fetchOptionalJson('geo/bounds/barangays.json', {});
    const centroidData = await this.fetchOptionalJson('geo/centroids/barangays.json', {});
    const nearest = [];

    for (const barangayId of Object.keys(barangayBounds)) {
      const cityId = deriveCityId(barangayId);

      if (cityIds.length > 0 && !cityIds.some((candidateCityId) => sameCity(barangayId, candidateCityId))) {
        continue;
      }

      const centroid = centroidData[barangayId];
      if (centroid) {
        nearest.push({
          barangay_id: barangayId,
          city_id: cityId,
          distanceKm: distanceKm(point, {
            lat: Number(centroid.lat),
            lng: Number(centroid.lng)
          })
        });
      }

      if (!boundsContains(barangayBounds[barangayId], point.lat, point.lng)) {
        continue;
      }

      const polygon = await this.getPolygon('barangay', barangayId);

      if (polygon && polygon.length >= 3 && !pointInPolygon(point, polygon)) {
        continue;
      }

      return normalizeReverseMatch({
        region_id: deriveRegionId(barangayId),
        province_id: deriveProvinceId(barangayId),
        city_id: cityId,
        barangay_id: barangayId,
        match_quality: polygon && polygon.length >= 3 ? 'polygon' : 'bounds',
        match_distance_km: 0
      });
    }

    if (this.reverseFallbackToSelectedLocation) {
      const fallback = selectedContextFallback(context);
      if (fallback) {
        return fallback;
      }
    }

    if (this.reverseMaxNearestKm <= 0) {
      return null;
    }

    nearest.sort((a, b) => a.distanceKm - b.distanceKm);
    const candidate = nearest[0];

    if (!candidate || candidate.distanceKm > this.reverseMaxNearestKm) {
      return null;
    }

    return normalizeReverseMatch({
      region_id: deriveRegionId(candidate.barangay_id),
      province_id: deriveProvinceId(candidate.barangay_id),
      city_id: candidate.city_id,
      barangay_id: candidate.barangay_id,
      match_quality: 'nearest-centroid',
      match_distance_km: Number(candidate.distanceKm.toFixed(3))
    });
  }
}
