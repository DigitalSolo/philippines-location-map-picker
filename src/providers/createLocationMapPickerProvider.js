import { ApiProvider } from './ApiProvider.js';
import { CompositeLocationProvider } from './CompositeLocationProvider.js';
import { StaticGeometryProvider } from './StaticGeometryProvider.js';
import { StaticJsonProvider } from './StaticJsonProvider.js';
import { createStaticLocationProvider } from './createStaticLocationProvider.js';

export const LOCATION_MAP_PICKER_PROVIDER_MODES = Object.freeze({
  STATIC: 'static',
  API: 'api',
  HYBRID: 'hybrid'
});

function cleanText(value) {
  return String(value ?? '').trim();
}

function cleanUrl(value, fallback = '') {
  return cleanText(value || fallback).replace(/\/+$/, '');
}

export function normalizeLocationMapPickerProviderMode(value = 'static') {
  const mode = cleanText(value || 'static').toLowerCase();

  if (mode === 'database' || mode === 'db' || mode === 'server') {
    return LOCATION_MAP_PICKER_PROVIDER_MODES.API;
  }

  if (mode === LOCATION_MAP_PICKER_PROVIDER_MODES.API || mode === LOCATION_MAP_PICKER_PROVIDER_MODES.HYBRID) {
    return mode;
  }

  return LOCATION_MAP_PICKER_PROVIDER_MODES.STATIC;
}

function createApiProvider(options = {}) {
  const apiUrl = cleanUrl(options.apiUrl || options.baseUrl || options.providerOptions?.apiUrl || options.providerOptions?.baseUrl);

  if (!apiUrl) {
    throw new Error('API provider mode requires apiUrl.');
  }

  return new ApiProvider({
    ...(options.providerOptions || {}),
    ...(options.apiProviderOptions || {}),
    baseUrl: apiUrl
  });
}

function createStaticProvider(options = {}) {
  const baseUrl = cleanUrl(options.baseUrl || options.dataBaseUrl || options.providerOptions?.baseUrl || '/data');

  return createStaticLocationProvider({
    ...(options.providerOptions || {}),
    ...(options.staticProviderOptions || {}),
    baseUrl,
    hierarchyBaseUrl: cleanUrl(options.hierarchyBaseUrl || options.providerOptions?.hierarchyBaseUrl || baseUrl),
    geometryBaseUrl: cleanUrl(options.geometryBaseUrl || options.providerOptions?.geometryBaseUrl || baseUrl)
  });
}

function createHybridProvider(options = {}) {
  const baseUrl = cleanUrl(options.baseUrl || options.dataBaseUrl || options.providerOptions?.baseUrl || '/data');
  const hierarchyBaseUrl = cleanUrl(options.hierarchyBaseUrl || options.providerOptions?.hierarchyBaseUrl || baseUrl);
  const apiUrl = cleanUrl(options.apiUrl || options.geometryApiUrl || options.providerOptions?.apiUrl || options.providerOptions?.geometryApiUrl);

  if (!apiUrl) {
    throw new Error('Hybrid provider mode requires apiUrl for geometry/reverse lookup.');
  }

  return new CompositeLocationProvider({
    hierarchyProvider: new StaticJsonProvider({
      ...(options.providerOptions || {}),
      ...(options.staticProviderOptions || {}),
      baseUrl: hierarchyBaseUrl
    }),
    geometryProvider: new ApiProvider({
      ...(options.providerOptions || {}),
      ...(options.apiProviderOptions || {}),
      baseUrl: apiUrl
    })
  });
}

/**
 * Creates the data provider used by the picker.
 *
 * Modes:
 * - static: sharded JSON hierarchy + optional static geometry.
 * - api: host application JSON API backed by MariaDB or another datastore.
 * - hybrid: static hierarchy JSON + API/database reverse lookup and geometry.
 */
export function createLocationMapPickerProvider(options = {}) {
  if (options.provider && typeof options.provider === 'object' && typeof options.provider.getRegions === 'function') {
    return options.provider;
  }

  const mode = normalizeLocationMapPickerProviderMode(options.provider || options.mode || options.providerMode || 'static');

  if (mode === LOCATION_MAP_PICKER_PROVIDER_MODES.API) {
    return createApiProvider(options);
  }

  if (mode === LOCATION_MAP_PICKER_PROVIDER_MODES.HYBRID) {
    return createHybridProvider(options);
  }

  return createStaticProvider(options);
}
