import { normalizeLocationValue } from './providerContract.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}

function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function emptyLocation() {
  return normalizeLocationValue({});
}

function fallbackLocationFromMatch(match = {}) {
  const location = {
    region_id: normalizeText(match.region_id),
    region_name: normalizeText(match.region_name),
    province_id: normalizeText(match.province_id),
    province_name: normalizeText(match.province_name),
    city_id: normalizeText(match.city_id),
    city_name: normalizeText(match.city_name),
    barangay_id: normalizeText(match.barangay_id),
    barangay_name: normalizeText(match.barangay_name)
  };

  location.label = [location.city_name, location.barangay_name].filter(Boolean).join(' → ');
  location.display_label = location.label;
  location.match_quality = normalizeText(match.match_quality);
  location.match_distance_km = cleanNumber(match.match_distance_km);

  return normalizeLocationValue(location);
}

function mergeMatch(location = {}, match = {}) {
  const merged = { ...emptyLocation(), ...location };

  [
    'region_id',
    'region_name',
    'province_id',
    'province_name',
    'city_id',
    'city_name',
    'barangay_id',
    'barangay_name'
  ].forEach((key) => {
    if (!merged[key] && match[key]) {
      merged[key] = normalizeText(match[key]);
    }
  });

  merged.match_quality = normalizeText(match.match_quality || merged.match_quality);
  merged.match_distance_km = cleanNumber(match.match_distance_km ?? merged.match_distance_km);
  merged.label = [merged.city_name, merged.barangay_name].filter(Boolean).join(' → ');
  merged.display_label = merged.label;
  merged.resolved = true;
  merged.resolved_source = 'composite-reverse-geocode';

  return normalizeLocationValue(merged);
}

/**
 * Combines one hierarchy provider and one geometry provider.
 */
export class CompositeLocationProvider {
  constructor(options = {}) {
    if (!options.hierarchyProvider) {
      throw new Error('CompositeLocationProvider requires hierarchyProvider.');
    }

    this.hierarchyProvider = options.hierarchyProvider;
    this.geometryProvider = options.geometryProvider || null;
  }

  async getRegions() {
    return this.hierarchyProvider.getRegions();
  }

  async getProvinces(regionId, context = {}) {
    return this.hierarchyProvider.getProvinces(regionId, context);
  }

  async getCities(parentId, context = {}) {
    return this.hierarchyProvider.getCities(parentId, context);
  }

  async getBarangays(cityId, context = {}) {
    return this.hierarchyProvider.getBarangays(cityId, context);
  }

  async getLocationByIds(ids = {}) {
    return normalizeLocationValue(await this.hierarchyProvider.getLocationByIds(ids));
  }

  async getBounds(level, id) {
    if (!this.geometryProvider || !this.geometryProvider.getBounds) {
      return null;
    }

    return this.geometryProvider.getBounds(level, id).catch(() => null);
  }

  async getCentroid(level, id) {
    if (!this.geometryProvider || !this.geometryProvider.getCentroid) {
      return null;
    }

    return this.geometryProvider.getCentroid(level, id).catch(() => null);
  }

  async getPolygon(level, id) {
    if (!this.geometryProvider || !this.geometryProvider.getPolygon) {
      return null;
    }

    return this.geometryProvider.getPolygon(level, id).catch(() => null);
  }

  async reverseGeocode(lat, lng, context = {}) {
    if (!this.geometryProvider || !this.geometryProvider.reverseGeocode) {
      return null;
    }

    const match = await this.geometryProvider.reverseGeocode(lat, lng, context).catch(() => null);

    if (!match || !match.barangay_id) {
      return null;
    }

    let location = null;

    try {
      location = await this.hierarchyProvider.getLocationByIds({
        region_id: match.region_id,
        region_name: match.region_name,
        province_id: match.province_id,
        province_name: match.province_name,
        city_id: match.city_id,
        city_name: match.city_name,
        barangay_id: match.barangay_id,
        barangay_name: match.barangay_name
      });
    } catch (error) {
      location = fallbackLocationFromMatch(match);
    }

    return mergeMatch(location, match);
  }
}
