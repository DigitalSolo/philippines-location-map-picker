import { LocationMapPicker } from '../LocationMapPicker.js';
import { ApiProvider } from '../providers/ApiProvider.js';

function requireMount(value) {
  if (!value) {
    throw new Error('createApiLocationMapPicker requires mount.');
  }

  if (typeof value === 'string') {
    const element = document.querySelector(value);
    if (!element) {
      throw new Error(`createApiLocationMapPicker mount was not found: ${value}`);
    }
    return element;
  }

  return value;
}

function requireApiUrl(value) {
  const apiUrl = String(value || '').trim().replace(/\/+$/, '');
  if (!apiUrl) {
    throw new Error('createApiLocationMapPicker requires apiUrl or baseUrl.');
  }
  return apiUrl;
}

function mergeOptions(defaults, provided) {
  return {
    ...defaults,
    ...(provided || {})
  };
}

/**
 * Creates a database/API-backed picker instance for host applications.
 *
 * The host application owns the canonical PSGC rows and barangay geometry.
 * The package only calls the configured API contract and renders the picker.
 */
export function createApiLocationMapPicker(options = {}) {
  const apiUrl = requireApiUrl(options.apiUrl || options.baseUrl);
  const mount = requireMount(options.mount);
  const provider = new ApiProvider({
    ...(options.providerOptions || {}),
    baseUrl: apiUrl
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
