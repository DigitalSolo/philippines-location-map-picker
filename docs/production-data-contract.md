# Production Data Contract

The package has two separate data readiness concepts.

## Pilot readiness

Pilot readiness means the bundled package/demo cache is internally consistent:

- PSGC hierarchy rows exist.
- Cached geometry rows match the bundled PSGC rows.
- Demo scenarios can exercise Region, Province, City/Municipality, Barangay, pin placement, and reverse-fill success/failure.

Run:

```powershell
npm run check-pilot-readiness
```

Pilot readiness is enough for package QA. It is not enough for unrestricted production address capture.

## Production readiness: limited geometry

Limited-geometry production mode is the recommended first host-app integration mode.

Requirements:

- Nationwide PSGC hierarchy coverage is present or backend-served.
- Region / Province / City/Municipality / Barangay selection works nationwide.
- Pin placement works anywhere the configured map tile provider can display.
- Reverse-fill from pin is available only where cached geometry exists.
- Reverse-fill no-match must be non-destructive and user-visible.
- Delivery-zone and serviceability rules stay in the host application.

Run:

```powershell
npm run check-production-readiness
```

This command uses the limited-geometry policy.

## Production readiness: full geometry

Full-geometry production mode is stricter.

Requirements:

- Nationwide PSGC hierarchy coverage.
- Nationwide barangay geometry coverage.
- Every cached PSGC barangay has matching geometry.
- No geometry rows exist without PSGC authority.
- No matched geometry rows are missing bounds, centroid, or polygon data.

Run:

```powershell
npm run check-production-readiness:full-geometry
```

## Release rule

Do not publish this package as production-ready until the production readiness command for the intended geometry policy passes.

For SukiMart, the recommended first target is limited-geometry production mode:

```text
Nationwide PSGC selection: required
Nationwide reverse-fill: not required for first production release
Host delivery-zone rules: outside this package
```

## Production cache build command

Use the cache build command before any production release claim:

```powershell
npm run build-production-psgc-cache
npm run refresh-data-reports
npm run check-production-readiness
```

`build-production-psgc-cache` replaces the generated PSGC hierarchy under `data/psgc` and writes `data/production-psgc-cache-report.json`.

`refresh-data-reports` regenerates the verification/release reports and copies report JSON files into `demo/data` so the demo panel reflects the current package state.

## Offline PSGC source option

Production PSGC data may be loaded from a local CSV or JSON source:

```powershell
npm run build-production-psgc-cache -- --source file --input C:\path\to\psgc.csv
```

The import path is intentionally strict: invalid rows are reported, parent relationships are checked, and production readiness still depends on the nationwide hierarchy thresholds.

## PSA 31 March 2026 thresholds

The production gate uses these current PSA PSGC thresholds:

```text
regions: 18
provinces: 82
citiesAndMunicipalities: 1642
barangays: 42010
```

Full reverse-fill production mode also requires `barangayPolygons: 42010`.

## Publish gate

Production publication is blocked by:

```powershell
npm run check-publish-readiness
```

This command wraps the production readiness checks and also verifies the GitHub/package release shape.

## 1.0.62 production hierarchy status

The bundled `data/psgc` cache was generated from the PSA PSGC 1Q 2026 Publication Datafile and satisfies the production hierarchy threshold gate.

The package remains in limited-geometry mode because only sample barangay geometry is bundled. Host applications must treat reverse-fill as opportunistic and should rely on explicit PSGC selection as the address authority.
