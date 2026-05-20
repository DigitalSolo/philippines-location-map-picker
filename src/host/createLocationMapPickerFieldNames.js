const DEFAULT_FIELD_NAMES = Object.freeze({
  barangay_id: 'barangay_id',
  pin_lat: 'pin_lat',
  pin_lng: 'pin_lng',
  location_picker_value_json: 'location_picker_value_json',
  location_picker_validation_json: 'location_picker_validation_json'
});

const FIELD_NAME_KEYS = Object.freeze(Object.keys(DEFAULT_FIELD_NAMES));

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function assertPlainObject(value, optionName) {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${optionName} must be an object.`);
  }
  return value;
}

function normalizeFieldNameStyle(value) {
  const style = cleanText(value || 'underscore').toLowerCase();
  return style === 'bracket' || style === 'php' || style === 'array' ? 'bracket' : 'underscore';
}

function applyFieldPrefix(fieldName, prefix, style) {
  const cleanPrefix = cleanText(prefix);
  if (!cleanPrefix) {
    return fieldName;
  }

  if (style === 'bracket') {
    return `${cleanPrefix}[${fieldName}]`;
  }

  return `${cleanPrefix}_${fieldName}`;
}

export function defaultLocationMapPickerFieldNames() {
  return { ...DEFAULT_FIELD_NAMES };
}

export function createLocationMapPickerPrefixedFieldNames(fieldPrefix = '', options = {}) {
  const prefix = cleanText(fieldPrefix);
  const style = normalizeFieldNameStyle(options.fieldNameStyle || options.style);
  const result = {};

  FIELD_NAME_KEYS.forEach((key) => {
    result[key] = applyFieldPrefix(DEFAULT_FIELD_NAMES[key], prefix, style);
  });

  return result;
}

export function normalizeLocationMapPickerSubmitFieldNames(options = {}) {
  const source = assertPlainObject(options, 'normalizeLocationMapPickerSubmitFieldNames options');
  const fieldNames = assertPlainObject(source.fieldNames, 'fieldNames');
  const result = createLocationMapPickerPrefixedFieldNames(source.fieldPrefix || '', {
    fieldNameStyle: source.fieldNameStyle
  });

  for (const key of Object.keys(fieldNames)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_FIELD_NAMES, key)) {
      throw new Error(`Unknown location picker field name: ${key}.`);
    }

    const fieldName = cleanText(fieldNames[key]);
    if (!fieldName) {
      throw new Error(`Location picker field name ${key} cannot be blank.`);
    }
    result[key] = fieldName;
  }

  return result;
}
