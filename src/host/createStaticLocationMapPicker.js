import { LocationMapPicker } from '../LocationMapPicker.js';
import { createStaticLocationProvider } from '../providers/createStaticLocationProvider.js';

function requireMount(value) {
  if (!value) {
    throw new Error('createStaticLocationMapPicker requires mount.');
  }

  if (typeof value === 'string') {
    const element = document.querySelector(value);
    if (!element) {
      throw new Error(`createStaticLocationMapPicker mount was not found: ${value}`);
    }
    return element;
  }

  return value;
}

function requireBaseUrl(value) {
  const baseUrl = String(value || '').trim().replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('createStaticLocationMapPicker requires baseUrl.');
  }
  return baseUrl;
}

function mergeOptions(defaults, provided) {
  return {
    ...defaults,
    ...(provided || {})
  };
}

/**
 * Creates a production-oriented static picker instance for host applications.
 *
 * This factory intentionally requires an explicit data baseUrl so the host app
 * owns exactly where PSGC and geometry cache files are served from.
 */
export function createStaticLocationMapPicker(options = {}) {
  const baseUrl = requireBaseUrl(options.baseUrl);
  const mount = requireMount(options.mount);
  const provider = createStaticLocationProvider({
    ...(options.providerOptions || {}),
    baseUrl
  });

  return new LocationMapPicker({
    ...options,
    mount,
    provider,
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
