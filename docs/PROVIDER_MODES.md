# Provider Modes

PLMP is now split into two clean responsibilities:

1. The package renders the picker UI and writes form fields.
2. A provider supplies hierarchy rows, geometry, and reverse lookup results.

The browser package never connects directly to MariaDB. Database access belongs behind a host API endpoint.

## Mode 1: Static

Use this for demos, no-database tests, small offline tools, and packaged fixtures.

```html
<div id="locationPicker"></div>
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  fieldPrefix: 'delivery_location',
  provider: 'static',
  baseUrl: '/packages/philippines-location-map-picker/data'
});
</script>
```

Static mode reads sharded JSON:

```text
psgc/regions.json
psgc/provinces/{region_id}.json
psgc/cities/{province_id}.json
psgc/barangays/{city_id}.json
geo/bounds/*.json
geo/centroids/*.json
geo/polygons/barangays/{city_id}/{barangay_id}.json
```

## Mode 2: API

Use this for production projects where the host application owns the location database.

```html
<div id="locationPicker"></div>
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  provider: 'api',
  apiUrl: '/api/location-map-picker'
});
</script>
```

Expected endpoints:

```text
GET  /api/location-map-picker/regions
GET  /api/location-map-picker/provinces?region_id=05
GET  /api/location-map-picker/cities?province_id=05160
GET  /api/location-map-picker/barangays?city_id=0516030
GET  /api/location-map-picker/location?barangay_id=0516030001
GET  /api/location-map-picker/bounds?level=city&id=0516030
GET  /api/location-map-picker/centroid?level=barangay&id=0516030001
GET  /api/location-map-picker/polygon?level=barangay&id=0516030001
POST /api/location-map-picker/reverse
```

`server/php/LocationMapPickerDatabaseAdapter.php` implements this contract for MariaDB host apps.

## Mode 3: Hybrid

Use this when you want fast static dropdowns and database-accurate reverse lookup.

```html
<div id="locationPicker"></div>
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  provider: 'hybrid',
  baseUrl: '/packages/philippines-location-map-picker/data',
  apiUrl: '/api/location-map-picker'
});
</script>
```

Hybrid mode uses:

- static JSON for regions, provinces, cities, and barangays
- API/database for bounds, centroid, polygon, and reverse lookup

## Creating test fixtures from your database

Use the fixture exporter instead of exporting a 550 MB database dump.

Example for Daet only:

```cmd
php server\php\export-location-map-picker-static-fixtures.php --env=C:\www\anitas-crud\.env --database=anitas --city-id=0516030 --include-polygons=1
```

Example hierarchy-only fixture for all active location rows:

```cmd
php server\php\export-location-map-picker-static-fixtures.php --env=C:\www\anitas-crud\.env --database=anitas --include-all-hierarchy=1 --include-polygons=0
```

The exporter writes to:

```text
data/fixtures/
```

That gives PLMP a realistic test dataset without requiring the package itself to own a full MariaDB database.

## Built-in no-database fixture

Use `data/fixtures/daet/` when you need to test PLMP without a host database.

```js
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  provider: 'static',
  baseUrl: '/packages/philippines-location-map-picker/data/fixtures/daet'
});
```

For API-provider testing without MariaDB, use:

```js
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  provider: 'api',
  apiUrl: '/server/php/location-map-picker-fixture-api.example.php'
});
```

The fixture adapter serves the same endpoint contract as the MariaDB adapter, but it reads package JSON instead of SQL tables.

See `docs/STATIC_FIXTURES.md`.

## QA workflow

Use `docs/PROVIDER_QA.md` and `/demo/provider-qa.html` before integrating a host app page.

The recommended sequence is:

1. Verify the bundled static fixture with `npm run check-provider-contract`.
2. Verify the fixture API with `npm run serve-fixture-api`, then `npm run check-fixture-api-contract`.
3. Verify the host production API by pointing `tools/check-provider-contract.js` at the host route.
4. Mount the picker in the host page only after the provider contract passes.

This avoids making the package depend on a large database export while still proving that the DB-backed provider contract works.
