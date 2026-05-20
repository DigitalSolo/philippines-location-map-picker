# Static Fixtures and No-Database Testing

PLMP should be testable without a 550 MB database export.

The package now includes a small fixture under:

```text
data/fixtures/daet/
```

This fixture is intended for package smoke tests, quick-start examples, and API-provider testing without MariaDB.

## What the fixture includes

```text
data/fixtures/daet/psgc/regions.json
data/fixtures/daet/psgc/provinces/05.json
data/fixtures/daet/psgc/cities/05016.json
data/fixtures/daet/psgc/barangays/0501603.json
data/fixtures/daet/geo/bounds/*.json
data/fixtures/daet/geo/centroids/barangays.json
data/fixtures/daet/geo/polygons/barangays/0501603/*.json
data/fixtures/daet/fixture-manifest.json
```

The hierarchy rows come from the host location-table shape used by Anita's/SukiMart:

- `location_regions.id` is `CHAR(2)`
- `location_provinces.id` is `CHAR(5)`
- `location_city.id` is `CHAR(7)`
- `location_barangays.id` is `CHAR(10)`

The fixture geometry is deliberately marked as **demo geometry only**. It is deterministic and useful for click-through reverse-fill testing, but it is not a substitute for `location_barangay_geometries` in production.

## Static fixture mode

```html
<form method="post" action="/save-address.php">
  <div id="locationPicker"></div>
  <button type="submit">Save address</button>
</form>

<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  provider: 'static',
  baseUrl: '/packages/philippines-location-map-picker/data/fixtures/daet'
});
</script>
```

The host page does not need to create hidden fields. PLMP creates and updates the package-owned hidden fields automatically when it is mounted inside a form.

## Fixture API mode

Use this when you need to test the `api` provider without wiring MariaDB yet.

```cmd
php -S 127.0.0.1:8089 -t .
```

Then point the picker to:

```js
apiUrl: '/server/php/location-map-picker-fixture-api.example.php'
```

The fixture API implements the same endpoints as the database adapter:

```text
GET  /server/php/location-map-picker-fixture-api.example.php/regions
GET  /server/php/location-map-picker-fixture-api.example.php/provinces?region_id=05
GET  /server/php/location-map-picker-fixture-api.example.php/cities?province_id=05016
GET  /server/php/location-map-picker-fixture-api.example.php/barangays?city_id=0501603
GET  /server/php/location-map-picker-fixture-api.example.php/location?barangay_id=0501603002
GET  /server/php/location-map-picker-fixture-api.example.php/bounds?level=city&id=0501603
GET  /server/php/location-map-picker-fixture-api.example.php/centroid?level=barangay&id=0501603002
GET  /server/php/location-map-picker-fixture-api.example.php/polygon?level=barangay&id=0501603002
POST /server/php/location-map-picker-fixture-api.example.php/reverse
```

## Production rule

Use the fixture only for package testing and examples.

Production apps should use:

```text
provider: 'api'
apiUrl: '/api/location-map-picker'
```

with the host app exposing `LocationMapPickerDatabaseAdapter.php` against the real location tables and `location_barangay_geometries`.
