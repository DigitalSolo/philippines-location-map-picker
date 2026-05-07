import { createLocationMapPickerSubmitPayload } from './createLocationMapPickerSubmitPayload.js';

const DEFAULT_MESSAGE_INVALID = 'Complete the required location fields before saving.';
const DEFAULT_MESSAGE_BUSY = 'The location picker is still working. Try again after it finishes.';
const DEFAULT_MESSAGE_DISABLED = 'The location picker is disabled.';
const DEFAULT_MESSAGE_READONLY = 'The location picker is read-only.';

function cleanString(value) {
  return value == null ? '' : String(value);
}

function normalizeMessages(messages) {
  return Array.isArray(messages) ? messages.map(cleanString).filter(Boolean) : [];
}

function requirePicker(picker) {
  if (!picker || typeof picker.validate !== 'function' || typeof picker.value !== 'function') {
    throw new Error('createLocationMapPickerSubmitResult requires a LocationMapPicker instance.');
  }

  return picker;
}

function pickerIsBusy(picker) {
  if (typeof picker.isBusy === 'function') {
    return picker.isBusy() === true;
  }

  return picker.busy === true;
}

function pickerIsDisabled(picker) {
  return picker.disabled === true;
}

function pickerIsReadOnly(picker) {
  return picker.readOnly === true;
}

function createBlockedResult(code, message, validation, payload) {
  const messages = message ? [message] : [];

  return {
    valid: false,
    blocked: true,
    code,
    message: message || DEFAULT_MESSAGE_INVALID,
    messages,
    missing: validation && Array.isArray(validation.missing) ? validation.missing.slice() : [],
    validation,
    payload
  };
}

/**
 * Creates a strict host-submit decision for address-save forms.
 *
 * The package only validates the picker-owned location and pin fields.
 * Host applications still own user/account/address/business-rule validation.
 */
export function createLocationMapPickerSubmitResult(picker, options = {}) {
  const instance = requirePicker(picker);
  const validation = instance.validate();
  const payload = createLocationMapPickerSubmitPayload(instance);

  if (pickerIsBusy(instance)) {
    return createBlockedResult('picker_busy', cleanString(options.messageBusy || DEFAULT_MESSAGE_BUSY), validation, payload);
  }

  if (pickerIsDisabled(instance)) {
    return createBlockedResult('picker_disabled', cleanString(options.messageDisabled || DEFAULT_MESSAGE_DISABLED), validation, payload);
  }

  if (pickerIsReadOnly(instance)) {
    return createBlockedResult('picker_readonly', cleanString(options.messageReadOnly || DEFAULT_MESSAGE_READONLY), validation, payload);
  }

  if (!validation.valid) {
    const messages = normalizeMessages(validation.messages);
    const message = messages[0] || cleanString(options.messageInvalid || DEFAULT_MESSAGE_INVALID);

    return {
      valid: false,
      blocked: true,
      code: 'picker_invalid',
      message,
      messages: messages.length ? messages : [message],
      missing: Array.isArray(validation.missing) ? validation.missing.slice() : [],
      validation,
      payload
    };
  }

  return {
    valid: true,
    blocked: false,
    code: 'picker_valid',
    message: '',
    messages: [],
    missing: [],
    validation,
    payload
  };
}

/**
 * Convenience helper for form handlers that should set the picker status when blocked.
 */
export function blockInvalidLocationMapPickerSubmit(picker, options = {}) {
  const result = createLocationMapPickerSubmitResult(picker, options);

  if (result.blocked && options.setStatus !== false && picker && typeof picker.setStatus === 'function') {
    picker.setStatus('error', result.message, result.code);
  }

  return result;
}
