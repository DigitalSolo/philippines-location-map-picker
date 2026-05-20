# Live API Contract Check

Use this check when PLMP is pointed at a real host project API, such as Anita's or SukiMart.

The package should be testable without a 550 MB database export, but production integrations still need a quick way to confirm that the host API is exposing the right contract.

## Command

```cmd
npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker
```

With a known pin:

```cmd
npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker --reverse-lat=14.112233 --reverse-lng=122.955667 --city-id=0516030 --strict-reverse=1
```

The command writes:

```text
data/live-api-contract-report.json
```

## What it checks

The checker calls these endpoints:

```text
GET  /health
GET  /schema
GET  /coverage
GET  /regions
GET  /provinces?region_id=...
GET  /cities?province_id=...
GET  /barangays?city_id=...
GET  /location?barangay_id=...
POST /reverse
POST /reverse-probe
```

It validates:

1. The API returns JSON.
2. The normal hierarchy endpoints return arrays.
3. The `location` endpoint can resolve a selected barangay.
4. The schema endpoint reports all required tables and columns.
5. `location_barangays.id` and `location_barangay_geometries.barangay_id` are foreign-key compatible.
6. The geometry table has a spatial index on `boundary`.
7. Coverage is above the configured threshold.
8. Optional reverse lookup works for a known pin.

## Coverage threshold

Default minimum coverage is `95` percent.

```cmd
npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker --coverage-min=98
```

For a newly loaded or partial test database, lower it temporarily:

```cmd
npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker --coverage-min=50
```

## Reverse lookup strictness

By default, a reverse miss is reported in the JSON report but does not fail the command unless you set:

```cmd
--strict-reverse=1
```

Use strict reverse checks once you have a known-good pin inside a covered barangay.

## Why this exists

PLMP now supports three test/deploy paths:

1. Static fixture mode for package-level testing.
2. Fixture API mode for API-contract testing without MariaDB.
3. Live API mode for real host-project integration.

This keeps the package small and testable while still supporting the real MariaDB-backed location tables in production.
