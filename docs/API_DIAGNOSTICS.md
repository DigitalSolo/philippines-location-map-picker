# API Diagnostics

PLMP database mode depends on a small JSON API exposed by the host project. The browser package does not connect directly to MariaDB.

This phase adds diagnostic endpoints to the reusable PHP adapter so a host project can be checked before wiring the picker into a real page.

## Diagnostic endpoints

When using `LocationMapPickerDatabaseAdapter`, these endpoints are available:

```text
GET  /diagnostics
GET  /health
GET  /coverage
GET  /schema
GET  /missing-geometry?limit=250&offset=0
GET  /search?q=Daet&limit=50
POST /reverse-probe
```

The normal picker endpoints remain unchanged:

```text
GET  /regions
GET  /provinces?region_id=05
GET  /cities?province_id=05160
GET  /barangays?city_id=0516030
GET  /location?barangay_id=0516030001
GET  /bounds?level=city&id=0516030
GET  /centroid?level=city&id=0516030
GET  /polygon?level=barangay&id=0516030001
POST /reverse
```

## Browser diagnostics page

Open:

```text
demo/api-diagnostics.html
```

Paste the host API URL, for example:

```text
https://admin.anitas.home.arpa/api/location-map-picker
```

Then run:

1. **Run diagnostics** — checks table counts, geometry coverage, required columns, FK compatibility, and spatial index presence.
2. **Search** — verifies that the API can find real barangays and returns the full hierarchy.
3. **Reverse probe** — tests a pin and also returns bounding-box candidates when `ST_Contains()` does not match.
4. **Missing geometry** — lists active barangays that are selectable but cannot be reverse-filled from a pin yet.

## Why this matters

A host project can have all dropdown data working but still fail reverse-fill if:

- the geometry table is empty,
- the `barangay_id` FK column does not match `location_barangays.id`,
- the spatial index is missing,
- the pin falls inside one of the active barangays with no geometry,
- the source boundary does not contain the current PSGC barangay.

The diagnostics page makes those failures visible before the picker is embedded into a production form.

## Reverse probe response

`POST /reverse-probe` accepts:

```json
{
  "lat": 14.066,
  "lng": 122.917,
  "city_id": "0516030"
}
```

It returns:

```json
{
  "matched": true,
  "match": {
    "region_id": "05",
    "province_id": "05160",
    "city_id": "0516030",
    "barangay_id": "0516030001"
  },
  "reason": "boundary_match",
  "candidate_count": 1,
  "candidates": []
}
```

If no polygon contains the pin but the bounding box filter finds candidates, the reason becomes:

```text
bbox_candidates_without_contains_match
```

If no bounding boxes match, the reason becomes:

```text
no_bbox_candidates
```


## CLI live API check

For repeatable checks outside the browser, run:

```cmd
npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker --reverse-lat=14.112233 --reverse-lng=122.955667 --city-id=0516030
```

The CLI writes `data/live-api-contract-report.json` and fails non-zero when required API contract checks fail. See `docs/LIVE_API_CONTRACT.md`.
