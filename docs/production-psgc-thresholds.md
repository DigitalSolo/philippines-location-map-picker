# Production PSGC Thresholds

Production readiness uses the Philippine Statistics Authority PSGC release as the minimum source-of-truth count contract.

Current package threshold reference:

```text
PSGC reference date: 31 March 2026
Regions: 18
Provinces: 82
Highly Urbanized Cities: 33
Other Cities: 116
Municipalities: 1,493
Cities/Municipalities total used by this package: 1,642
Barangays: 42,010
```

The package's production hierarchy gate requires at least:

```text
regions: 18
provinces: 82
citiesAndMunicipalities: 1642
barangays: 42010
```

Full-geometry production mode additionally requires:

```text
barangayPolygons: 42010
```

Limited-geometry production mode allows nationwide PSGC selection with partial reverse-fill coverage, but it must not imply nationwide reverse-fill.

Regenerate the threshold report:

```powershell
npm run write-production-thresholds-report
```

Then rebuild data reports:

```powershell
npm run refresh-data-reports
```
