const LABEL_FORMATS = {
  region_province_city_barangay: ['region_name', 'province_name', 'city_name', 'barangay_name'],
  province_city_barangay: ['province_name', 'city_name', 'barangay_name'],
  city_barangay: ['city_name', 'barangay_name'],
  barangay_only: ['barangay_name']
};

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function cleanToken(value, allowed, fallback) {
  const token = String(value || '').trim().toLowerCase();
  return allowed.includes(token) ? token : fallback;
}

function resolveLocation(value = {}) {
  if (value && typeof value === 'object' && value.location && typeof value.location === 'object') {
    return value.location;
  }
  return value || {};
}

/**
 * Formats a picker value or location row into the host-facing display label.
 * The default matches the host integration contract: City → Barangay.
 */
export function formatLocationMapPickerValueLabel(value = {}, options = {}) {
  const location = resolveLocation(value);
  const format = cleanToken(options.format || options.selectedLabelFormat, Object.keys(LABEL_FORMATS), 'city_barangay');
  const separator = cleanText(options.separator) || ' → ';
  const emptyLabel = options.emptyLabel == null ? '' : String(options.emptyLabel);
  const fields = LABEL_FORMATS[format] || LABEL_FORMATS.city_barangay;
  const label = fields
    .map((key) => cleanText(location[key]))
    .filter(Boolean)
    .join(separator);

  return label || emptyLabel;
}
