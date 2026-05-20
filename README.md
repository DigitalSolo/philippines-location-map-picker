# Philippines Location Map Picker

A reusable Philippine location picker with map pin placement, PSGC hierarchy selection, and optional barangay-boundary reverse lookup.


## Auto mount quick start

For the simplest host-page integration, mark one element with `data-location-map-picker` and call the auto-mounter. The picker binds to the nearest form and creates its hidden submit fields automatically.

```html
<form method="post">
  <div
    data-location-map-picker
    data-provider="api"
    data-api-url="/api/location-map-picker"
    data-field-prefix="delivery_location"
    data-required-location-level="barangay"
    data-require-pin="true"
  ></div>

  <button type="submit">Save</button>
</form>

<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
  PhilippinesLocationMapPicker.autoMountLocationMapPickers();
</script>
```

See `docs/AUTO_MOUNT.md` and `examples/auto-mount-umd.html`.

## Quick start

```html
<form method="post" action="/save-address.php">
  <div id="locationPicker"></div>
  <button type="submit">Save address</button>
</form>

<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountLocationMapPickerField('#locationPicker', {
  fieldPrefix: 'delivery_location',
  provider: 'static',
  baseUrl: '/packages/philippines-location-map-picker/data'
});
</script>
```

The mount element is the only required form markup. Hidden submit fields are created automatically.

## Provider modes

- `static`: sharded JSON hierarchy and optional static geometry.
- `api`: host API backed by MariaDB or another datastore.
- `hybrid`: static dropdown hierarchy plus API/database reverse lookup.

See `docs/PROVIDER_MODES.md` and `docs/STATIC_FIXTURES.md`.

## Database support

The package includes reusable PHP/MariaDB support files under `server/php/`:

- `LocationMapPickerDatabaseAdapter.php`
- `location-map-picker-db-api.example.php`
- `sync-location-direct.php`
- `export-location-map-picker-static-fixtures.php`

The browser package does not connect directly to MariaDB. Host projects expose a small JSON API and point PLMP to it with `apiUrl`.

## No-database testing

The package includes a small Daet fixture under `data/fixtures/daet/` so PLMP can be tested without attaching the package to MariaDB or exporting a 550 MB location database.

- `demo/fixtures.html` runs the picker from static fixture JSON.
- `server/php/location-map-picker-fixture-api.example.php` exposes the same API contract from fixture JSON.
- `examples/static-fixture-umd.html` and `examples/api-fixture-umd.html` show both paths.

The fixture geometry is for smoke testing only. Production reverse lookup should use `LocationMapPickerDatabaseAdapter.php` with `location_barangay_geometries`.

## Provider QA

Use the provider QA tools when you need to test PLMP without attaching the package to a full host database export.

```cmd
npm run check-provider-contract
```

For the fixture API:

```cmd
npm run serve-fixture-api
npm run check-fixture-api-contract
```

The browser QA page is available at:

```text
/demo/provider-qa.html
```

See `docs/PROVIDER_QA.md` for the static, API, and hybrid test workflow.


## API diagnostics

For database/API mode, open `demo/api-diagnostics.html` and paste the host project API URL. It checks table counts, geometry coverage, schema compatibility, missing-geometry rows, search, and reverse pin matching before the picker is embedded into a real form.

See `docs/API_DIAGNOSTICS.md`.


## Live API contract check

When PLMP is wired to a real host application database, use the live API checker before embedding the picker into a production form.

```cmd
npm run check-live-api -- --api-url=http://127.0.0.1/api/location-map-picker --reverse-lat=14.112233 --reverse-lng=122.955667 --city-id=0516030
```

This writes `data/live-api-contract-report.json` and validates hierarchy endpoints, schema compatibility, geometry coverage, and optional reverse pin matching.

See `docs/LIVE_API_CONTRACT.md`.

