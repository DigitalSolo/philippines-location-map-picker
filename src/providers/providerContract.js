const LOCATION_KEYS = [
  'region_id',
  'region_name',
  'province_id',
  'province_name',
  'city_id',
  'city_name',
  'barangay_id',
  'barangay_name'
];

export const PROVIDER_CONTRACT_VERSION = '1.0.31';

export function cleanProviderText(value) {
  return String(value ?? '').trim();
}

export function cleanProviderNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeProviderArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.data)) {
    return value.data;
  }

  if (value && Array.isArray(value.items)) {
    return value.items;
  }

  if (value && Array.isArray(value.results)) {
    return value.results;
  }

  return [];
}

export function normalizeProviderRow(row = {}, fallbackType = '') {
  const source = row || {};
  const id = cleanProviderText(source.id || source.code || source.psgc_code || source.psgcCode || source.correspondence_code || source.correspondenceCode);
  const code = cleanProviderText(source.code || source.psgc_code || source.psgcCode || id);
  const name = cleanProviderText(source.name || source.area_name || source.areaName || source.label || source.code_name || source.codeName || source.slug || id || code);
  const type = cleanProviderText(source.type || source.geographic_level || source.geographicLevel || fallbackType);

  return {
    ...source,
    id: id || code || name,
    code: code || id || name,
    name,
    type
  };
}

export function emptyProviderLocation() {
  return {
    region_id: '',
    region_name: '',
    province_id: '',
    province_name: '',
    city_id: '',
    city_name: '',
    barangay_id: '',
    barangay_name: '',
    label: '',
    display_label: ''
  };
}

export function formatProviderLocationLabel(location = {}, format = 'city_barangay') {
  const parts = [];

  if (format === 'region_province_city_barangay') {
    parts.push(location.region_name, location.province_name, location.city_name, location.barangay_name);
  } else if (format === 'province_city_barangay') {
    parts.push(location.province_name, location.city_name, location.barangay_name);
  } else if (format === 'barangay_only') {
    parts.push(location.barangay_name);
  } else {
    parts.push(location.city_name, location.barangay_name);
  }

  return parts.map(cleanProviderText).filter(Boolean).join(' → ');
}

export function normalizeLocationValue(value = {}, options = {}) {
  const source = value || {};
  const normalized = {
    ...source,
    ...emptyProviderLocation()
  };

  LOCATION_KEYS.forEach((key) => {
    normalized[key] = cleanProviderText(source[key]);
  });

  const generatedLabel = formatProviderLocationLabel(normalized, options.labelFormat || source.label_format || 'city_barangay');
  normalized.label = cleanProviderText(source.label) || generatedLabel;
  normalized.display_label = cleanProviderText(source.display_label) || normalized.label;

  if (source.match_quality !== undefined) {
    normalized.match_quality = cleanProviderText(source.match_quality);
  }

  if (source.match_distance_km !== undefined) {
    normalized.match_distance_km = cleanProviderNumber(source.match_distance_km, 0);
  }

  if (source.resolved !== undefined) {
    normalized.resolved = Boolean(source.resolved);
  }

  if (source.resolved_source !== undefined) {
    normalized.resolved_source = cleanProviderText(source.resolved_source);
  }

  return normalized;
}

export function normalizePinValue(value = {}) {
  const lat = cleanProviderNumber(value && value.lat, null);
  const lng = cleanProviderNumber(value && value.lng, null);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

export function normalizeBoundsValue(value = {}) {
  const source = value || {};
  const south = cleanProviderNumber(source.south, null);
  const west = cleanProviderNumber(source.west, null);
  const north = cleanProviderNumber(source.north, null);
  const east = cleanProviderNumber(source.east, null);

  if ([south, west, north, east].some((part) => part === null)) {
    return null;
  }

  return { south, west, north, east };
}

export function normalizeReverseMatch(value = {}) {
  const normalized = normalizeLocationValue(value);
  normalized.match_quality = cleanProviderText(value.match_quality || normalized.match_quality || 'provider-match');
  normalized.match_distance_km = cleanProviderNumber(value.match_distance_km, normalized.match_distance_km || 0);
  return normalized;
}

export function createProviderError(error, details = {}) {
  const source = error instanceof Error ? error : new Error(cleanProviderText(error) || 'Provider request failed.');
  const wrapped = new Error(source.message || 'Provider request failed.');

  wrapped.name = 'ProviderError';
  wrapped.provider_error = true;
  wrapped.provider = cleanProviderText(details.provider || source.provider || '');
  wrapped.method = cleanProviderText(details.method || source.method || '');
  wrapped.code = cleanProviderText(details.code || source.code || 'provider_error') || 'provider_error';
  wrapped.status = cleanProviderNumber(details.status ?? source.status, null);
  wrapped.path = cleanProviderText(details.path || source.path || '');
  wrapped.reason = cleanProviderText(details.reason || source.reason || '');
  wrapped.cause = source;

  return wrapped;
}

export function createProviderNoMatch(reason = 'no_match', context = {}) {
  return {
    matched: false,
    reason: cleanProviderText(reason) || 'no_match',
    context: context || null
  };
}

export async function safeProviderCall(providerName, methodName, callback, fallback = null) {
  try {
    return await callback();
  } catch (error) {
    const providerError = createProviderError(error, {
      provider: providerName,
      method: methodName
    });

    if (fallback !== undefined) {
      return fallback;
    }

    throw providerError;
  }
}
