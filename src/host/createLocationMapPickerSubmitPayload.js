function stringifyJson(value) {
  return JSON.stringify(value == null ? null : value);
}

function cleanText(value) {
  return value == null ? '' : String(value);
}

function cleanCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : '';
}

function requirePicker(picker) {
  if (!picker || typeof picker.value !== 'function' || typeof picker.validate !== 'function') {
    throw new Error('createLocationMapPickerSubmitPayload requires a LocationMapPicker instance.');
  }

  return picker;
}

function normalizeSubmitValue(value) {
  const location = value && value.location ? value.location : {};
  const pin = value && value.pin ? value.pin : null;
  const geometry = value && value.geometry ? value.geometry : {
    focus_result: null,
    reverse_match: null,
    reverse_error: null
  };

  return {
    location: {
      region_id: cleanText(location.region_id),
      region_name: cleanText(location.region_name),
      province_id: cleanText(location.province_id),
      province_name: cleanText(location.province_name),
      city_id: cleanText(location.city_id),
      city_name: cleanText(location.city_name),
      barangay_id: cleanText(location.barangay_id),
      barangay_name: cleanText(location.barangay_name),
      label: cleanText(location.label),
      display_label: cleanText(location.display_label)
    },
    pin: pin ? {
      lat: Number(pin.lat),
      lng: Number(pin.lng)
    } : null,
    geometry
  };
}

function normalizeSubmitValidation(validation) {
  const source = validation || {};

  return {
    valid: source.valid === true,
    required_location_level: cleanText(source.required_location_level),
    require_pin: source.require_pin === true,
    missing: Array.isArray(source.missing) ? source.missing.map(cleanText) : [],
    messages: Array.isArray(source.messages) ? source.messages.map(cleanText) : [],
    location: source.location || {},
    pin: source.pin || null
  };
}

/**
 * Builds the exact host form payload for address-save endpoints.
 *
 * Host applications own account, customer, fulfillment, and external policy logic.
 * This helper only serializes the package-owned location/pin contract.
 */
export function createLocationMapPickerSubmitPayload(picker) {
  const instance = requirePicker(picker);
  return createLocationMapPickerSubmitPayloadFromValue(instance.value(), instance.validate());
}

export function createLocationMapPickerSubmitPayloadFromValue(value, validation) {
  const normalizedValue = normalizeSubmitValue(value || {});
  const normalizedValidation = normalizeSubmitValidation(validation);

  return {
    barangay_id: normalizedValue.location.barangay_id,
    pin_lat: normalizedValue.pin ? cleanCoordinate(normalizedValue.pin.lat) : '',
    pin_lng: normalizedValue.pin ? cleanCoordinate(normalizedValue.pin.lng) : '',
    location_picker_value_json: stringifyJson(normalizedValue),
    location_picker_validation_json: stringifyJson(normalizedValidation)
  };
}
