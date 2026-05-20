import { normalizeLocationMapPickerSubmitFieldNames } from './createLocationMapPickerFieldNames.js';

function requireForm(value, helperName) {
  if (!value) {
    throw new Error(`${helperName} requires form.`);
  }

  if (typeof value === 'string') {
    const element = document.querySelector(value);
    if (!element) {
      throw new Error(`${helperName} form was not found: ${value}`);
    }
    return element;
  }

  if (!value.elements && typeof value.querySelector !== 'function') {
    throw new Error(`${helperName} form must be an HTMLFormElement, selector, or form-like object with elements.`);
  }

  return value;
}

function cleanFieldName(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeFieldNames(options = {}) {
  if (options && (Object.prototype.hasOwnProperty.call(options, 'fieldNames') || Object.prototype.hasOwnProperty.call(options, 'fieldPrefix') || Object.prototype.hasOwnProperty.call(options, 'fieldNameStyle'))) {
    return normalizeLocationMapPickerSubmitFieldNames(options);
  }

  return normalizeLocationMapPickerSubmitFieldNames({ fieldNames: options || {} });
}

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function cssEscape(value) {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }
  return String(value).replace(/"/g, '\\"');
}

function firstElement(value) {
  if (!value) {
    return null;
  }

  if (typeof value.value !== 'undefined') {
    return value;
  }

  if (typeof value.length === 'number') {
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] && typeof value[i].value !== 'undefined') {
        return value[i];
      }
    }
  }

  return null;
}

function findNamedField(form, name) {
  const fieldName = cleanFieldName(name);
  if (!fieldName || !form) {
    return null;
  }

  if (form.elements && form.elements[fieldName]) {
    return firstElement(form.elements[fieldName]);
  }

  if (typeof form.querySelector === 'function') {
    return form.querySelector(`[name="${cssEscape(fieldName)}"]`);
  }

  return null;
}

function readField(form, name) {
  const field = findNamedField(form, name);
  return field && typeof field.value !== 'undefined' ? cleanText(field.value) : '';
}

function parseJsonObject(value, fieldName) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${fieldName}.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${fieldName} must contain a JSON object.`);
  }

  return parsed;
}

function normalizeCoordinate(value, fieldName) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const number = Number(text);
  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return number;
}

function normalizeLocation(location = {}) {
  const source = location && typeof location === 'object' ? location : {};
  return {
    region_id: cleanText(source.region_id),
    region_name: cleanText(source.region_name),
    province_id: cleanText(source.province_id),
    province_name: cleanText(source.province_name),
    city_id: cleanText(source.city_id),
    city_name: cleanText(source.city_name),
    barangay_id: cleanText(source.barangay_id),
    barangay_name: cleanText(source.barangay_name),
    label: cleanText(source.label),
    display_label: cleanText(source.display_label),
    resolved: source.resolved === true,
    resolved_source: cleanText(source.resolved_source)
  };
}

function normalizePin(pin = null) {
  if (!pin || typeof pin !== 'object') {
    return null;
  }

  const lat = normalizeCoordinate(pin.lat, 'pin.lat');
  const lng = normalizeCoordinate(pin.lng, 'pin.lng');

  if (lat === null && lng === null) {
    return null;
  }

  if (lat === null || lng === null) {
    throw new Error('pin requires both lat and lng.');
  }

  return { lat, lng };
}

function initialValueFromValueJson(payload, fieldNames) {
  const parsed = parseJsonObject(payload.location_picker_value_json, fieldNames.location_picker_value_json);
  if (!parsed) {
    return null;
  }

  return {
    location: normalizeLocation(parsed.location || parsed),
    pin: normalizePin(parsed.pin || null)
  };
}

function initialValueFromScalarPayload(payload, fieldNames) {
  const lat = normalizeCoordinate(payload.pin_lat, fieldNames.pin_lat);
  const lng = normalizeCoordinate(payload.pin_lng, fieldNames.pin_lng);

  if ((lat === null && lng !== null) || (lat !== null && lng === null)) {
    throw new Error(`${fieldNames.pin_lat} and ${fieldNames.pin_lng} must both be present or both be blank.`);
  }

  return {
    location: normalizeLocation({
      barangay_id: payload.barangay_id
    }),
    pin: lat === null ? null : { lat, lng }
  };
}

/**
 * Reads the package-owned submit payload fields from a host form.
 * This does not inspect customer, account, fulfillment, or external policy fields.
 */
export function readLocationMapPickerSubmitPayloadFromForm(form, options = {}) {
  const targetForm = requireForm(form, 'readLocationMapPickerSubmitPayloadFromForm');
  const fieldNames = normalizeFieldNames(options);

  return {
    barangay_id: readField(targetForm, fieldNames.barangay_id),
    pin_lat: readField(targetForm, fieldNames.pin_lat),
    pin_lng: readField(targetForm, fieldNames.pin_lng),
    location_picker_value_json: readField(targetForm, fieldNames.location_picker_value_json),
    location_picker_validation_json: readField(targetForm, fieldNames.location_picker_validation_json)
  };
}

/**
 * Converts a saved package-owned submit payload into a picker initialValue.
 * Prefer location_picker_value_json when present; otherwise use scalar fields.
 */
export function createLocationMapPickerInitialValueFromSubmitPayload(payload = {}, options = {}) {
  const fieldNames = normalizeFieldNames(options);
  const source = {
    barangay_id: cleanText(payload.barangay_id),
    pin_lat: cleanText(payload.pin_lat),
    pin_lng: cleanText(payload.pin_lng),
    location_picker_value_json: cleanText(payload.location_picker_value_json),
    location_picker_validation_json: cleanText(payload.location_picker_validation_json)
  };

  return initialValueFromValueJson(source, fieldNames) || initialValueFromScalarPayload(source, fieldNames);
}

/**
 * Reads saved package-owned fields from a host form and returns picker initialValue.
 */
export function createLocationMapPickerInitialValueFromForm(form, options = {}) {
  const payload = readLocationMapPickerSubmitPayloadFromForm(form, options);
  return createLocationMapPickerInitialValueFromSubmitPayload(payload, options);
}
