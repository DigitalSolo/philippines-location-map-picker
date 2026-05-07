import { normalizeReverseMatch } from './providerContract.js';
import { boundsCenter, normalizeBounds } from '../geo/bounds.js';
import { pointInPolygon } from '../geo/pointInPolygon.js';
import { cleanPsgcCode, cityCodeCandidates, deriveCityId, deriveProvinceId, deriveRegionId, toTenDigitPsgcCode } from '../geo/psgcCodes.js';

function cleanId(value) {
  return String(value || '').trim();
}

function escapeSqlString(value) {
  return String(value || '').replace(/'/g, "''");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getProp(props, ...keys) {
  for (const key of keys) {
    if (props[key] !== undefined && props[key] !== null && String(props[key]).trim() !== '') {
      return props[key];
    }
  }

  return '';
}

function ringArea(points) {
  let area = 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j][0] * points[i][1]) - (points[i][0] * points[j][1]);
  }

  return Math.abs(area / 2);
}

function largestOuterRing(geometry) {
  if (!geometry) {
    return [];
  }

  const rings = [];

  if (geometry.type === 'Polygon') {
    if (Array.isArray(geometry.coordinates[0])) {
      rings.push(geometry.coordinates[0]);
    }
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      if (Array.isArray(polygon[0])) {
        rings.push(polygon[0]);
      }
    });
  }

  return rings
    .filter((ring) => Array.isArray(ring) && ring.length >= 4)
    .sort((a, b) => ringArea(b) - ringArea(a))[0] || [];
}

function geometryBounds(points) {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;

  points.forEach((point) => {
    const lat = toNumber(point.lat);
    const lng = toNumber(point.lng);

    if (lat === null || lng === null) {
      return;
    }

    south = Math.min(south, lat);
    west = Math.min(west, lng);
    north = Math.max(north, lat);
    east = Math.max(east, lng);
  });

  if (!Number.isFinite(south) || !Number.isFinite(west) || !Number.isFinite(north) || !Number.isFinite(east)) {
    return null;
  }

  return { south, west, north, east };
}

function polygonFromGeoJsonGeometry(geometry, precision = 6) {
  const factor = Math.pow(10, precision);
  const ring = largestOuterRing(geometry);

  return ring
    .map(([lng, lat]) => ({
      lat: Math.round(Number(lat) * factor) / factor,
      lng: Math.round(Number(lng) * factor) / factor
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
  const dLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
  const lat1 = Number(a.lat) * Math.PI / 180;
  const lat2 = Number(b.lat) * Math.PI / 180;
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function polygonCentroid(polygon) {
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return null;
  }

  const totals = polygon.reduce((carry, point) => ({
    lat: carry.lat + Number(point.lat),
    lng: carry.lng + Number(point.lng),
    count: carry.count + 1
  }), { lat: 0, lng: 0, count: 0 });

  return totals.count > 0 ? { lat: totals.lat / totals.count, lng: totals.lng / totals.count } : null;
}

/**
 * Live ArcGIS barangay geometry provider.
 *
 * Default service:
 *   https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4
 *
 * The service is useful for live testing and prototyping. For production,
 * consider caching the generated geometry server-side so your application
 * is not dependent on a third-party ArcGIS endpoint at runtime.
 */
export class ArcGisBarangayGeometryProvider {
  constructor(options = {}) {
    this.baseUrl = String(options.baseUrl || 'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4').replace(/\/+$/, '');
    this.geometryPrecision = Number.isFinite(Number(options.geometryPrecision)) ? Number(options.geometryPrecision) : 6;
    this.reverseDistanceMeters = Number.isFinite(Number(options.reverseDistanceMeters)) ? Number(options.reverseDistanceMeters) : 50;
    this.cache = new Map();
  }

  buildUrl(params = {}) {
    const url = new URL(`${this.baseUrl}/query`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  async fetchQuery(params = {}) {
    const defaults = {
      f: 'geojson',
      outFields: '*',
      outSR: '4326',
      returnGeometry: 'true'
    };

    const url = this.buildUrl({ ...defaults, ...params });

    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json, application/geo+json' }
    });

    if (!response.ok) {
      throw new Error(`ArcGIS barangay boundary request failed (${response.status}).`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'ArcGIS barangay boundary request failed.');
    }

    this.cache.set(url, data);
    return data;
  }

  cityWhereClause(cityId) {
    const clauses = [];

    cityCodeCandidates(cityId).forEach((candidate) => {
      clauses.push(`city_code='${escapeSqlString(candidate)}'`);
      clauses.push(`CITY_CODE='${escapeSqlString(candidate)}'`);

      const code = cleanPsgcCode(candidate);
      if (code.length >= 7) {
        clauses.push(`psgc_10d LIKE '${escapeSqlString(code.slice(0, 7))}%'`);
        clauses.push(`PSGC_10D LIKE '${escapeSqlString(code.slice(0, 7))}%'`);
      }
      if (code.length >= 6) {
        clauses.push(`psgc_10d LIKE '${escapeSqlString(code.slice(0, 6))}%'`);
        clauses.push(`PSGC_10D LIKE '${escapeSqlString(code.slice(0, 6))}%'`);
      }
    });

    return clauses.length ? `(${[...new Set(clauses)].join(' OR ')})` : '1=1';
  }

  async queryByBarangayId(barangayId) {
    const id = cleanId(barangayId);

    if (!id) {
      return null;
    }

    const shortBarangayCode = cleanPsgcCode(id).slice(0, 9);
    const where = `(psgc_10d='${escapeSqlString(id)}' OR PSGC_10D='${escapeSqlString(id)}' OR brgy_code='${escapeSqlString(id)}' OR BRGY_CODE='${escapeSqlString(id)}' OR brgy_code='${escapeSqlString(shortBarangayCode)}' OR BRGY_CODE='${escapeSqlString(shortBarangayCode)}')`;
    const data = await this.fetchQuery({
      where,
      geometryPrecision: this.geometryPrecision,
      returnGeometry: 'true'
    });

    return Array.isArray(data.features) && data.features.length > 0 ? data.features[0] : null;
  }

  async getPolygon(level, id) {
    if (level !== 'barangay') {
      return null;
    }

    const feature = await this.queryByBarangayId(id).catch(() => null);

    if (!feature || !feature.geometry) {
      return null;
    }

    const polygon = polygonFromGeoJsonGeometry(feature.geometry, this.geometryPrecision);
    return polygon.length >= 3 ? polygon : null;
  }

  async getBounds(level, id) {
    if (level !== 'barangay') {
      return null;
    }

    const polygon = await this.getPolygon(level, id).catch(() => null);

    if (!polygon) {
      return null;
    }

    return normalizeBounds(geometryBounds(polygon));
  }

  async getCentroid(level, id) {
    if (level !== 'barangay') {
      const bounds = await this.getBounds(level, id).catch(() => null);
      return boundsCenter(bounds);
    }

    const bounds = await this.getBounds(level, id).catch(() => null);
    return boundsCenter(bounds);
  }

  featureToMatch(feature, matchQuality = '') {
    const props = feature && feature.properties ? feature.properties : {};
    const barangayId = cleanId(getProp(props, 'psgc_10d', 'PSGC_10D', 'brgy_code', 'BRGY_CODE'));

    if (!barangayId) {
      return null;
    }

    const cityCode = cleanId(getProp(props, 'city_code', 'CITY_CODE')) || deriveCityId(barangayId);
    const provinceCode = cleanId(getProp(props, 'prov_code', 'PROV_CODE')) || deriveProvinceId(barangayId);
    const regionCode = cleanId(getProp(props, 'reg_code', 'REG_CODE')) || deriveRegionId(barangayId);
    const normalizedBarangayId = toTenDigitPsgcCode(barangayId, 'barangay') || barangayId;
    const normalizedCityId = toTenDigitPsgcCode(cityCode, 'city') || deriveCityId(normalizedBarangayId || barangayId);
    const normalizedProvinceId = toTenDigitPsgcCode(provinceCode, 'province') || deriveProvinceId(normalizedBarangayId || barangayId);
    const normalizedRegionId = toTenDigitPsgcCode(regionCode, 'region') || deriveRegionId(normalizedProvinceId || normalizedBarangayId || barangayId);

    return normalizeReverseMatch({
      region_id: normalizedRegionId,
      region_name: cleanId(getProp(props, 'reg_name', 'REG_NAME')),
      province_id: normalizedProvinceId,
      province_name: cleanId(getProp(props, 'prov_name', 'PROV_NAME')),
      city_id: normalizedCityId,
      city_name: cleanId(getProp(props, 'city_name', 'CITY_NAME')),
      barangay_id: normalizedBarangayId,
      barangay_name: cleanId(getProp(props, 'brgy_name', 'BRGY_NAME')),
      match_quality: matchQuality || (feature.geometry ? 'arcgis-polygon' : 'arcgis-feature'),
      match_distance_km: 0
    });
  }

  sortFeaturesByCentroidDistance(features, point) {
    return features.slice().sort((a, b) => {
      const polygonA = polygonFromGeoJsonGeometry(a.geometry, this.geometryPrecision);
      const polygonB = polygonFromGeoJsonGeometry(b.geometry, this.geometryPrecision);
      const centroidA = polygonCentroid(polygonA);
      const centroidB = polygonCentroid(polygonB);
      const distanceA = centroidA ? distanceKm(point, centroidA) : Number.POSITIVE_INFINITY;
      const distanceB = centroidB ? distanceKm(point, centroidB) : Number.POSITIVE_INFINITY;
      return distanceA - distanceB;
    });
  }

  pointQueryParams(pointLat, pointLng, context = {}) {
    const params = {
      where: '1=1',
      geometry: `${pointLng},${pointLat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      returnGeometry: 'true',
      geometryPrecision: this.geometryPrecision
    };

    if (context.city_id) {
      params.where = this.cityWhereClause(context.city_id);
    }

    return params;
  }

  async reverseGeocode(lat, lng, context = {}) {
    const pointLat = toNumber(lat);
    const pointLng = toNumber(lng);

    if (pointLat === null || pointLng === null) {
      return null;
    }

    const point = { lat: pointLat, lng: pointLng };
    const polygonData = await this.fetchQuery(this.pointQueryParams(pointLat, pointLng, context)).catch(() => null);
    const polygonFeatures = polygonData && Array.isArray(polygonData.features) ? polygonData.features : [];

    if (polygonFeatures.length > 0) {
      const exactFeature = polygonFeatures.find((feature) => {
        const polygon = polygonFromGeoJsonGeometry(feature.geometry, this.geometryPrecision);
        return polygon.length >= 3 ? pointInPolygon(point, polygon) : true;
      }) || polygonFeatures[0];
      return this.featureToMatch(exactFeature, 'arcgis-polygon');
    }

    if (this.reverseDistanceMeters <= 0) {
      return null;
    }

    const distanceData = await this.fetchQuery({
      ...this.pointQueryParams(pointLat, pointLng, context),
      distance: this.reverseDistanceMeters,
      units: 'esriSRUnit_Meter'
    }).catch(() => null);
    const distanceFeatures = distanceData && Array.isArray(distanceData.features) ? distanceData.features : [];

    if (distanceFeatures.length === 0) {
      return null;
    }

    const sorted = this.sortFeaturesByCentroidDistance(distanceFeatures, point);
    const match = this.featureToMatch(sorted[0], `arcgis-distance-${this.reverseDistanceMeters}m`);
    if (match) {
      match.match_distance_km = Number((this.reverseDistanceMeters / 1000).toFixed(3));
    }

    return match;
  }
}
