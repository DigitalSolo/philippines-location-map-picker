import { createLocationMapPickerSubmitResult } from './createLocationMapPickerSubmitResult.js';
import { normalizeLocationMapPickerSubmitFieldNames } from './createLocationMapPickerFieldNames.js';

const SUBMIT_RESULT_OPTION_KEYS = [
  'messageInvalid',
  'messageBusy',
  'messageDisabled',
  'messageReadOnly'
];

function requirePicker(picker) {
  if (!picker || typeof picker.validate !== 'function' || typeof picker.value !== 'function') {
    throw new Error('bindLocationMapPickerForm requires a LocationMapPicker instance.');
  }

  return picker;
}

function requireForm(value) {
  if (!value) {
    throw new Error('bindLocationMapPickerForm requires form.');
  }

  if (typeof value === 'string') {
    const element = document.querySelector(value);
    if (!element) {
      throw new Error(`bindLocationMapPickerForm form was not found: ${value}`);
    }
    return element;
  }

  if (typeof value.addEventListener !== 'function' || typeof value.querySelector !== 'function') {
    throw new Error('bindLocationMapPickerForm form must be an HTMLFormElement or selector.');
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

function createSubmitResultOptions(options = {}) {
  const result = {};
  SUBMIT_RESULT_OPTION_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      result[key] = options[key];
    }
  });
  return result;
}

function findNamedField(form, name) {
  if (!name || !form || typeof form.querySelector !== 'function') {
    return null;
  }

  if (form.elements && form.elements[name]) {
    const element = form.elements[name];
    if (element && typeof element.value !== 'undefined') {
      return element;
    }
  }

  const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(name) : name.replace(/"/g, '\\"');
  return form.querySelector(`[name="${escaped}"]`);
}

function ensureHiddenField(form, name) {
  const fieldName = cleanFieldName(name);
  if (!fieldName) {
    return null;
  }

  const existing = findNamedField(form, fieldName);
  if (existing) {
    return existing;
  }

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = fieldName;
  input.setAttribute('data-location-map-picker-submit-field', fieldName);
  form.appendChild(input);
  return input;
}

function writeField(form, name, value) {
  const field = ensureHiddenField(form, name);
  if (!field) {
    return null;
  }

  const nextValue = value == null ? '' : String(value);
  if (field.value !== nextValue) {
    field.value = nextValue;
  }

  return field;
}

function focusPicker(picker) {
  const root = picker && picker.root;
  if (!root || typeof root.scrollIntoView !== 'function') {
    return;
  }

  root.scrollIntoView({ block: 'center', inline: 'nearest' });

  const target = root.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (target && typeof target.focus === 'function') {
    target.focus({ preventScroll: true });
  }
}

/**
 * Writes the package-owned address payload into a host form.
 * Missing fields are created as hidden inputs. Blank field names are skipped.
 */
export function writeLocationMapPickerSubmitPayloadToForm(form, payload, options = {}) {
  const targetForm = requireForm(form);
  const fieldNames = normalizeFieldNames(options);
  const source = payload || {};

  writeField(targetForm, fieldNames.barangay_id, source.barangay_id);
  writeField(targetForm, fieldNames.pin_lat, source.pin_lat);
  writeField(targetForm, fieldNames.pin_lng, source.pin_lng);
  writeField(targetForm, fieldNames.location_picker_value_json, source.location_picker_value_json);
  writeField(targetForm, fieldNames.location_picker_validation_json, source.location_picker_validation_json);

  return {
    form: targetForm,
    fieldNames,
    payload: source
  };
}

/**
 * Binds a LocationMapPicker instance to a normal host form submit flow.
 * The adapter only owns picker validation and package payload fields.
 */
export function bindLocationMapPickerForm(options = {}) {
  const form = requireForm(options.form);
  const picker = requirePicker(options.picker);
  const fieldNames = normalizeFieldNames(options);
  const writePayload = options.writePayload !== false;
  const preventInvalid = options.preventInvalid !== false;
  const stopInvalidPropagation = options.stopInvalidPropagation === true;
  const setStatus = options.setStatus !== false;
  const focusOnBlocked = options.focusOnBlocked === true;
  const submitResultOptions = createSubmitResultOptions(options);
  let destroyed = false;

  function handleSubmit(event) {
    if (destroyed) {
      return null;
    }

    const result = createLocationMapPickerSubmitResult(picker, submitResultOptions);

    if (writePayload) {
      writeLocationMapPickerSubmitPayloadToForm(form, result.payload, { fieldNames });
    }

    if (typeof options.onResult === 'function') {
      options.onResult(result, event || null);
    }

    if (result.blocked) {
      if (event && preventInvalid && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && stopInvalidPropagation && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      if (setStatus && typeof picker.setStatus === 'function') {
        picker.setStatus('error', result.message, result.code);
      }
      if (focusOnBlocked) {
        focusPicker(picker);
      }
      if (typeof options.onBlocked === 'function') {
        options.onBlocked(result, event || null);
      }
      return result;
    }

    if (typeof options.onValid === 'function') {
      options.onValid(result, event || null);
    }

    return result;
  }

  form.addEventListener('submit', handleSubmit);

  return {
    form,
    picker,
    fieldNames,
    submit: handleSubmit,
    updatePayload() {
      const result = createLocationMapPickerSubmitResult(picker, submitResultOptions);
      writeLocationMapPickerSubmitPayloadToForm(form, result.payload, { fieldNames });
      return result;
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      form.removeEventListener('submit', handleSubmit);
    }
  };
}
