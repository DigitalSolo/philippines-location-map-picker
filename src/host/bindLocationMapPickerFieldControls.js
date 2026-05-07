import { formatLocationMapPickerValueLabel } from './formatLocationMapPickerValueLabel.js';
import { hasLocationMapPickerSelection, selectedLocationMapPickerLevel } from './hasLocationMapPickerSelection.js';

function requirePicker(picker) {
  if (!picker || typeof picker.value !== 'function' || typeof picker.open !== 'function' || typeof picker.close !== 'function') {
    throw new Error('bindLocationMapPickerFieldControls requires a LocationMapPicker instance.');
  }

  return picker;
}

function resolveAll(value) {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return Array.from(document.querySelectorAll(value));
  }

  if (typeof NodeList !== 'undefined' && value instanceof NodeList) {
    return Array.from(value);
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [value];
}

function resolveOne(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return document.querySelector(value);
  }

  return value;
}

function cleanText(value) {
  return value == null ? '' : String(value);
}

function setElementText(element, value) {
  if (!element) {
    return;
  }

  const nextValue = cleanText(value);
  if (element.textContent !== nextValue) {
    element.textContent = nextValue;
  }
}

function setButtonDisabled(button, disabled) {
  if (!button) {
    return;
  }

  if ('disabled' in button) {
    button.disabled = disabled;
  }
  button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
}

function pickerDisabled(picker) {
  return picker.disabled === true || picker.readOnly === true || (typeof picker.isBusy === 'function' && picker.isBusy() === true);
}

function hasClearableValue(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (value.pin && Number.isFinite(Number(value.pin.lat)) && Number.isFinite(Number(value.pin.lng))) {
    return true;
  }

  const location = value.location && typeof value.location === 'object' ? value.location : value;
  return Boolean(
    cleanText(location.region_id)
      || cleanText(location.province_id)
      || cleanText(location.city_id)
      || cleanText(location.barangay_id)
  );
}

/**
 * Wires external host controls to a LocationMapPicker instance.
 *
 * This is intentionally UI-light: the host owns markup and styling; the package
 * only keeps open/close buttons, summary text, and status text synchronized.
 */
export function bindLocationMapPickerFieldControls(options = {}) {
  const picker = requirePicker(options.picker);
  const openButtons = resolveAll(options.openButton || options.openControl || options.trigger);
  const closeButtons = resolveAll(options.closeButton || options.closeControl);
  const clearButtons = resolveAll(options.clearButton || options.clearControl);
  const summaryEl = resolveOne(options.summary || options.summaryElement);
  const statusEl = resolveOne(options.status || options.statusElement);
  const selectedClassName = cleanText(options.selectedClassName || 'is-selected');
  const invalidClassName = cleanText(options.invalidClassName || 'is-invalid');
  const emptyLabel = options.emptyLabel == null ? 'Select City → Barangay' : String(options.emptyLabel);
  let destroyed = false;

  function currentLabel() {
    return formatLocationMapPickerValueLabel(picker.value(), {
      selectedLabelFormat: options.selectedLabelFormat,
      format: options.format,
      separator: options.separator,
      emptyLabel
    });
  }

  function updateSummary() {
    if (destroyed) {
      return;
    }

    const value = picker.value();
    const label = currentLabel();
    const validation = typeof picker.validate === 'function' ? picker.validate() : { valid: true };
    const selectedLevel = selectedLocationMapPickerLevel(value);
    const hasSelection = hasLocationMapPickerSelection(value, {
      requiredLocationLevel: options.selectionRequiredLevel || options.requiredLocationLevel || validation.required_location_level
    });
    const disabled = pickerDisabled(picker);
    const clearable = hasClearableValue(value);
    const open = typeof picker.isOpen === 'function' ? picker.isOpen() : false;

    setElementText(summaryEl, label);
    if (summaryEl) {
      summaryEl.classList.toggle(selectedClassName, hasSelection);
      summaryEl.classList.toggle(invalidClassName, validation.valid === false);
      summaryEl.dataset.selected = hasSelection ? 'true' : 'false';
      summaryEl.dataset.selectedLevel = selectedLevel;
      summaryEl.dataset.valid = validation.valid === false ? 'false' : 'true';
      summaryEl.dataset.clearable = clearable ? 'true' : 'false';
    }

    openButtons.forEach((button) => {
      setButtonDisabled(button, disabled);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.classList.toggle(selectedClassName, hasSelection);
      button.classList.toggle(invalidClassName, validation.valid === false);
    });

    closeButtons.forEach((button) => {
      setButtonDisabled(button, disabled || !open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    clearButtons.forEach((button) => {
      setButtonDisabled(button, disabled || !clearable);
      button.classList.toggle(selectedClassName, clearable);
    });
  }

  function updateStatus(status) {
    if (destroyed || !statusEl) {
      return;
    }

    const state = status || (typeof picker.statusState === 'function' ? picker.statusState() : null) || {};
    setElementText(statusEl, state.message || '');
    statusEl.hidden = !state.message;
    statusEl.dataset.statusLevel = state.level || 'idle';
    statusEl.dataset.statusCode = state.code || '';
  }

  function handleOpenClick(event) {
    if (destroyed) {
      return;
    }
    event.preventDefault();
    picker.open();
    updateSummary();
  }

  function handleCloseClick(event) {
    if (destroyed) {
      return;
    }
    event.preventDefault();
    picker.close();
    updateSummary();
  }

  function handleClearClick(event) {
    if (destroyed) {
      return;
    }
    event.preventDefault();
    if (typeof picker.clear === 'function') {
      picker.clear(true);
    }
    updateSummary();
    updateStatus();
  }

  const updateSummaryFromEvent = () => updateSummary();
  const updateStatusFromEvent = (status) => updateStatus(status);

  openButtons.forEach((button) => button.addEventListener('click', handleOpenClick));
  closeButtons.forEach((button) => button.addEventListener('click', handleCloseClick));
  clearButtons.forEach((button) => button.addEventListener('click', handleClearClick));

  if (typeof picker.on === 'function') {
    picker.on('change', updateSummaryFromEvent);
    picker.on('busychange', updateSummaryFromEvent);
    picker.on('dirtychange', updateSummaryFromEvent);
    picker.on('openchange', updateSummaryFromEvent);
    picker.on('statuschange', updateStatusFromEvent);
  }

  updateSummary();
  updateStatus();

  return {
    picker,
    openButtons,
    closeButtons,
    clearButtons,
    summary: summaryEl,
    status: statusEl,
    update() {
      updateSummary();
      updateStatus();
      return this;
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      openButtons.forEach((button) => button.removeEventListener('click', handleOpenClick));
      closeButtons.forEach((button) => button.removeEventListener('click', handleCloseClick));
      clearButtons.forEach((button) => button.removeEventListener('click', handleClearClick));

      if (typeof picker.off === 'function') {
        picker.off('change', updateSummaryFromEvent);
        picker.off('busychange', updateSummaryFromEvent);
        picker.off('dirtychange', updateSummaryFromEvent);
        picker.off('openchange', updateSummaryFromEvent);
        picker.off('statuschange', updateStatusFromEvent);
      }
    }
  };
}
