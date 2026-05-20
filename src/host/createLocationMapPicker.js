import { LocationMapPicker } from '../LocationMapPicker.js';
import { createLocationMapPickerProvider, normalizeLocationMapPickerProviderMode } from '../providers/createLocationMapPickerProvider.js';

function requireMount(value) {
  if (!value) {
    throw new Error('createLocationMapPicker requires mount.');
  }

  if (typeof value === 'string') {
    const element = document.querySelector(value);
    if (!element) {
      throw new Error(`createLocationMapPicker mount was not found: ${value}`);
    }
    return element;
  }

  return value;
}

function mergeOptions(defaults, provided) {
  return {
    ...defaults,
    ...(provided || {})
  };
}

/**
 * Main factory for all supported data modes.
 *
 * Use provider: 'static', 'api', or 'hybrid'. The picker UI remains the same;
 * only the provider changes.
 */
export function createLocationMapPicker(options = {}) {
  const providerMode = normalizeLocationMapPickerProviderMode(options.provider || options.mode || options.providerMode || 'static');
  const mount = requireMount(options.mount);
  const provider = createLocationMapPickerProvider({
    ...options,
    provider: providerMode
  });

  return new LocationMapPicker({
    ...options,
    mount,
    provider,
    providerMode,
    ui: mergeOptions({
      selectedLabelFormat: 'city_barangay',
      theme: 'light',
      size: 'comfortable',
      density: 'normal'
    }, options.ui),
    location: mergeOptions({
      requiredLevel: 'barangay'
    }, options.location),
    validation: mergeOptions({
      requiredLocationLevel: 'barangay',
      requirePin: true
    }, options.validation),
    map: mergeOptions({
      pinMode: 'centered',
      showBoundary: true,
      fitBoundaryOnSelection: true
    }, options.map),
    reverse: mergeOptions({
      enabled: true,
      failOnNoMatch: false
    }, options.reverse)
  });
}
