# Production PSGC Cache

This package must not be published as production-ready until the PSGC hierarchy is broad enough for unrestricted Philippine address capture.

The supported first production target is **nationwide PSGC hierarchy with limited geometry**:

```text
Region / Province / City-Municipality / Barangay selection: nationwide
Map pin placement: available where the configured tile provider works
Reverse-fill from pin: available only where cached geometry exists
Delivery/serviceability rules: host application responsibility
```

## Build the production PSGC hierarchy

Run this from the package root on a machine with internet access:

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run build-production-psgc-cache
npm run refresh-data-reports
npm run check-production-readiness
```

The build command replaces the generated hierarchy under:

```text
data/psgc/
```

It also writes:

```text
data/production-psgc-cache-report.json
```

## Expected production thresholds

The production gate uses conservative minimum thresholds:

```text
regions: 18
provinces: 82
cities / municipalities: 1642
barangays: 42010
```

These are release-gate thresholds, not a replacement for source-of-truth review.

## If the PSGC API is unavailable

The cache command fails loudly. Do not hand-edit the cache to bypass the production gate.

Wait for the source API to recover, or add a reviewed importer for an official offline PSGC export before publishing a production release.

## Full-geometry mode

Full-geometry mode is stricter and is not required for the first SukiMart integration target.

Run it only when nationwide barangay geometry is intentionally cached:

```powershell
npm run check-production-readiness:full-geometry
```

## Release rule

A production GitHub release requires this command to pass for the intended geometry policy:

```powershell
npm run check-production-readiness
```

## Build from a local PSGC file

When the PSGC source is available as a local CSV or JSON file, use:

```powershell
npm run build-production-psgc-cache:file -- --input C:\path\to\psgc.csv
npm run refresh-data-reports
npm run check-production-readiness
```

This avoids the live API dependency and writes the same `data/psgc/` structure used by static providers.

## Flat-file source validation

When using a local CSV/JSON source, validate it first:

```powershell
npm run validate-psgc-source -- --input C:\path\to\psgc.csv
```

The file-based production cache command validates before importing unless `--skip-validate 1` is explicitly passed.

## Current PSA threshold reference

The production cache gate uses the PSA 31 March 2026 count contract:

```text
18 regions
82 provinces
1,642 cities/municipalities
42,010 barangays
```

## Rate limits and resume

PSGC Cloud may return HTTP 429 while caching all cities/municipalities and barangays.

After a rate-limit failure, do not delete `data/psgc`. Resume the run:

```powershell
npm run resume-production-psgc-cache
npm run refresh-data-reports
npm run check-production-readiness
```

The cache writes partial files as it goes and records retry/reuse data in:

```text
data/psgc/cache-psgc-cloud-report.json
data/production-psgc-cache-report.json
```

Useful options:

```powershell
npm run build-production-psgc-cache -- --delay-ms 750 --max-retries 20 --retry-delay-ms 5000 --max-retry-delay-ms 180000
```

For a clean rebuild that discards previous partial progress:

```powershell
npm run build-production-psgc-cache:fresh
```
