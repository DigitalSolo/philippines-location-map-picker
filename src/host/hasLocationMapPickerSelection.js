const LOCATION_LEVELS = ['region', 'province', 'city', 'barangay'];

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function cleanToken(value, allowed, fallback) {
  const token = cleanText(value).toLowerCase();
  return allowed.includes(token) ? token : fallback;
}

function resolveLocation(value = {}) {
  if (value && typeof value === 'object' && value.location && typeof value.location === 'object') {
    return value.location;
  }
  return value || {};
}

function levelRank(level) {
  return LOCATION_LEVELS.indexOf(level);
}

/**
 * Returns the deepest location level currently present in a picker value.
 */
export function selectedLocationMapPickerLevel(value = {}) {
  const location = resolveLocation(value);

  if (cleanText(location.barangay_id)) {
    return 'barangay';
  }
  if (cleanText(location.city_id)) {
    return 'city';
  }
  if (cleanText(location.province_id)) {
    return 'province';
  }
  if (cleanText(location.region_id)) {
    return 'region';
  }

  return '';
}

/**
 * Returns true when the value has a selected location at or below the required level.
 * Pin requirements are intentionally excluded; validation remains responsible for pin checks.
 */
export function hasLocationMapPickerSelection(value = {}, options = {}) {
  const selectedLevel = selectedLocationMapPickerLevel(value);

  if (!selectedLevel) {
    return false;
  }

  const requiredLevel = cleanToken(
    options.requiredLocationLevel || options.selectionRequiredLevel,
    LOCATION_LEVELS,
    'barangay'
  );

  return levelRank(selectedLevel) >= levelRank(requiredLevel);
}
