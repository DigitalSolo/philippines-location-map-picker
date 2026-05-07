import { CompositeLocationProvider } from './CompositeLocationProvider.js';
import { StaticGeometryProvider } from './StaticGeometryProvider.js';
import { StaticJsonProvider } from './StaticJsonProvider.js';

function cleanBaseUrl(value, fallback = '/data') {
  return String(value || fallback).replace(/\/+$/, '');
}

/**
 * Creates the recommended production provider stack:
 * cached/static PSGC hierarchy + cached/static geometry.
 */
export function createStaticLocationProvider(options = {}) {
  const baseUrl = cleanBaseUrl(options.baseUrl);
  const hierarchyBaseUrl = cleanBaseUrl(options.hierarchyBaseUrl, baseUrl);
  const geometryBaseUrl = cleanBaseUrl(options.geometryBaseUrl, baseUrl);
  const reverseMaxNearestKm = Number.isFinite(Number(options.reverseMaxNearestKm))
    ? Number(options.reverseMaxNearestKm)
    : 0;

  return new CompositeLocationProvider({
    hierarchyProvider: new StaticJsonProvider({
      baseUrl: hierarchyBaseUrl
    }),
    geometryProvider: new StaticGeometryProvider({
      baseUrl: geometryBaseUrl,
      reverseMaxNearestKm
    })
  });
}
