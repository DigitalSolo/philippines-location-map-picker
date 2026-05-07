const DEFAULT_FIELD_NAMES = Object.freeze({
  barangay_id: 'barangay_id',
  pin_lat: 'pin_lat',
  pin_lng: 'pin_lng',
  location_picker_value_json: 'location_picker_value_json',
  location_picker_validation_json: 'location_picker_validation_json'
});

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function requireBaseUrl(value) {
  const baseUrl = cleanText(value).replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('createLocationMapPickerHostConfig requires baseUrl.');
  }
  return baseUrl;
}

function assertPlainObject(value, optionName) {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`createLocationMapPickerHostConfig ${optionName} must be an object.`);
  }
  return value;
}

function normalizeFieldNames(fieldNames = {}) {
  const source = assertPlainObject(fieldNames, 'fieldNames');
  const result = { ...DEFAULT_FIELD_NAMES };

  for (const key of Object.keys(source)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_FIELD_NAMES, key)) {
      throw new Error(`Unknown location picker field name: ${key}.`);
    }

    const fieldName = cleanText(source[key]);
    if (!fieldName) {
      throw new Error(`Location picker field name ${key} cannot be blank.`);
    }
    result[key] = fieldName;
  }

  return result;
}

function mergeOptionGroup(defaults, provided, optionName) {
  return {
    ...defaults,
    ...assertPlainObject(provided, optionName)
  };
}

/**
 * Builds the static host integration contract for applications that vendor this package.
 *
 * The helper does not know anything about customers, fulfillment labels,
 * external policy checks, or business rules. It only centralizes the package-owned address field names and
 * picker defaults so host pages do not copy demo assumptions into production code.
 */
export function createLocationMapPickerHostConfig(options = {}) {
  const source = assertPlainObject(options, 'options');
  const baseUrl = requireBaseUrl(source.baseUrl);
  const fieldNames = normalizeFieldNames(source.fieldNames);

  const ui = mergeOptionGroup({
    selectedLabelFormat: 'city_barangay',
    theme: 'light',
    size: 'comfortable',
    density: 'normal'
  }, source.ui, 'ui');

  const location = mergeOptionGroup({
    requiredLevel: 'barangay'
  }, source.location, 'location');

  const validation = mergeOptionGroup({
    requiredLocationLevel: 'barangay',
    requirePin: true
  }, source.validation, 'validation');

  const map = mergeOptionGroup({
    pinMode: 'centered',
    showBoundary: true,
    fitBoundaryOnSelection: true,
    tileUrlTemplate: ''
  }, source.map, 'map');

  const reverse = mergeOptionGroup({
    enabled: true,
    failOnNoMatch: false
  }, source.reverse, 'reverse');

  return {
    baseUrl,
    fieldNames,
    pickerOptions: {
      ui,
      location,
      validation,
      map,
      reverse
    },
    formBinding: {
      fieldNames,
      preventInvalid: true,
      writePayload: true,
      focusOnBlocked: true
    }
  };
}

export function defaultLocationMapPickerFieldNames() {
  return { ...DEFAULT_FIELD_NAMES };
}
