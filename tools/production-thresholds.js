export const PSA_PSGC_REFERENCE = {
  asOf: '2026-03-31',
  releaseName: 'PSGC 1Q 2026 Publication Datafile',
  source: 'Philippine Statistics Authority Philippine Standard Geographic Code as of 31 March 2026',
  sourceUrl: 'https://psa.gov.ph/classification/psgc/',
  notes: [
    'Thresholds are based on the PSA-published 31 March 2026 totals.',
    'City/municipality threshold combines 33 Highly Urbanized Cities, 116 other cities, and 1,493 municipalities.',
    'Barangay threshold reflects the PSA-published 42,010 barangays as of 31 March 2026.'
  ]
};

export const PRODUCTION_PSGC_THRESHOLDS = {
  regions: 18,
  provinces: 82,
  citiesAndMunicipalities: 1642,
  barangays: 42010,
  barangayPolygons: 42010
};

export const PRODUCTION_SOURCE_EXPECTED_TOTALS = {
  regions: 18,
  provinces: 82,
  highlyUrbanizedCities: 33,
  otherCities: 116,
  municipalities: 1493,
  citiesAndMunicipalities: 1642,
  barangays: 42010
};

export function productionPsgcThresholds() {
  return { ...PRODUCTION_PSGC_THRESHOLDS };
}

export function productionHierarchyThresholds() {
  const thresholds = productionPsgcThresholds();
  return {
    regions: thresholds.regions,
    provinces: thresholds.provinces,
    citiesAndMunicipalities: thresholds.citiesAndMunicipalities,
    barangays: thresholds.barangays
  };
}

export function productionSourceMetadata() {
  return {
    reference: { ...PSA_PSGC_REFERENCE },
    expectedTotals: { ...PRODUCTION_SOURCE_EXPECTED_TOTALS },
    thresholds: productionPsgcThresholds()
  };
}
