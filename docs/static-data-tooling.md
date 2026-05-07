# Static Data Tooling Confirmation

The static-data tooling is the production gate for package releases and host-app integration. It confirms that cached PSGC hierarchy data and cached geometry data are internally consistent before the package is copied into another project.

Run from the package root:

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run verify-static-data
```

The verification command runs these checks in order:

```powershell
npm run audit-geometry -- --psgc data\psgc --geo data\geo --out data\geo\geometry-coverage-report.json
npm run reconcile-geometry -- --psgc data\psgc --geo data\geo --out data\geo\psgc-geometry-reconciliation-report.json
npm run audit-static-data -- --psgc data\psgc --geo data\geo --out data\static-data-report.json
```

It then writes:

```text
data/static-data-verification-report.json
```

## Strict mode

Strict mode is enabled by default. It fails when any of these conditions are found:

- PSGC barangay cache is empty.
- Geometry cache has no barangay rows.
- A PSGC barangay has no geometry.
- Geometry exists that cannot be reconciled to the PSGC cache.
- A matched geometry row is missing bounds, centroid, or polygon data.
- The static data audit reports warnings.

To generate reports without failing the command, run:

```powershell
npm run verify-static-data -- --strict 0
```

## Custom cache paths

```powershell
npm run verify-static-data -- --psgc data\psgc --geo data\geo --out data\static-data-verification-report.json
```

Host applications should only consume a cache set after this command returns OK.

## Production data contract

Static-data verification confirms internal consistency for the data currently present. It does not automatically certify that the cache is broad enough for production.

Use the production gate before publishing a production release:

```powershell
npm run check-production-readiness
```

The default production gate uses the limited-geometry policy. It requires nationwide PSGC hierarchy coverage and allows reverse-fill only where geometry exists.

For full reverse-fill coverage, use:

```powershell
npm run check-production-readiness:full-geometry
```

That stricter gate requires nationwide PSGC hierarchy coverage and nationwide barangay geometry coverage.

## Production PSGC cache refresh

For a production cache refresh, run:

```powershell
npm run build-production-psgc-cache
npm run refresh-data-reports
```

The first command requires internet access and calls the PSGC Cloud hierarchy endpoints through the package cache tool. The second command regenerates audit reports and mirrors report files to `demo/data`.

## Flat-file PSGC importer

The package includes a production importer for local PSGC CSV/JSON exports:

```powershell
npm run import-psgc -- --input C:\path\to\psgc.csv --reset 1
```

For production release work, prefer the wrapped command:

```powershell
npm run build-production-psgc-cache:file -- --input C:\path\to\psgc.csv
npm run refresh-data-reports
```

## PSGC source validation

Use this before importing from a local PSGC CSV/JSON file:

```powershell
npm run validate-psgc-source -- --input C:\path\to\psgc.csv
```

The validation report is mirrored into `demo/data` by:

```powershell
npm run refresh-data-reports
```
