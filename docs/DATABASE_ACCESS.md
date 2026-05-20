# Database Access Mode

PLMP does not connect to MariaDB from the browser. Database access is handled through the package PHP adapter in `server/php/LocationMapPickerDatabaseAdapter.php`.

Use this mode for production integrations such as Anita's and SukiMart, where the location hierarchy and barangay geometry are already in database tables.

## Required tables

The default adapter uses this exact schema contract:

```text
location_regions(id, name, active)
location_provinces(id, name, active, regions_id)
location_city(id, name, active, provinces_id)
location_barangays(id, name, city_id, active)
location_barangay_geometries(barangay_id, boundary, boundary_simplified, centroid, min_lat, max_lat, min_lng, max_lng, source, source_ref, updated_at)
```

The PSGC ID columns are ASCII/binary character keys:

```text
location_regions.id        CHAR(2)  CHARACTER SET ascii COLLATE ascii_bin
location_provinces.id      CHAR(5)  CHARACTER SET ascii COLLATE ascii_bin
location_city.id           CHAR(7)  CHARACTER SET ascii COLLATE ascii_bin
location_barangays.id      CHAR(10) CHARACTER SET ascii COLLATE ascii_bin
```

The geometry table foreign key must match `location_barangays.id` exactly:

```sql
barangay_id CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
```

## Create the geometry table

Run:

```sql
db/location_barangay_geometries.sql
```

The script does not create or change the hierarchy tables.

## Backfill the database directly

From the package root:

```cmd
php server\php\sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas --dry-run --max-pages=1
```

Then run the full sync:

```cmd
php server\php\sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas
```

The direct sync writes to:

```text
location_regions
location_provinces
location_city
location_barangays
location_barangay_geometries
```

It uses upserts, so it can be rerun.

## Expose the API in a host project

Copy these files into the host project or route to them from the package folder:

```text
server/php/LocationMapPickerDatabaseAdapter.php
server/php/location-map-picker-api.example.php
```

Replace the PDO block in `location-map-picker-api.example.php` with the host application's normal database bootstrap.

The picker expects these endpoints under one base URL:

```text
GET  /api/location-map-picker/regions
GET  /api/location-map-picker/provinces?region_id=05
GET  /api/location-map-picker/cities?province_id=05016
GET  /api/location-map-picker/barangays?city_id=0501603
GET  /api/location-map-picker/location?barangay_id=0501603001
GET  /api/location-map-picker/bounds?level=barangay&id=0501603001
GET  /api/location-map-picker/centroid?level=barangay&id=0501603001
GET  /api/location-map-picker/polygon?level=barangay&id=0501603001
POST /api/location-map-picker/reverse
```

The reverse request body is:

```json
{
  "lat": 14.112233,
  "lng": 122.955667,
  "city_id": "0501603"
}
```

The reverse response is wrapped in `data`:

```json
{
  "data": {
    "region_id": "05",
    "region_name": "Region V (Bicol Region)",
    "province_id": "05016",
    "province_name": "Camarines Norte",
    "city_id": "0501603",
    "city_name": "Daet",
    "barangay_id": "0501603001",
    "barangay_name": "Awitan",
    "match_quality": "database-boundary",
    "match_distance_km": 0,
    "resolved_source": "georisk_arcgis_psa_barangay_boundary"
  }
}
```

## Browser integration

The page only needs one DOM element inside a form:

```html
<form method="post" action="/account/save-address">
  <div id="delivery_location_picker"></div>
  <button type="submit">Save address</button>
</form>

<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountApiLocationMapPickerField({
  mount: '#delivery_location_picker',
  apiUrl: '/api/location-map-picker',
  pickerOptions: {
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: true
    }
  }
});
</script>
```

No hidden fields are required in the HTML. The package creates the submit fields inside the nearest parent form.

## Validation query

After sync, run:

```sql
db/check-location-map-picker-database.sql
```

The most important value is:

```text
active_barangays_without_geometry
```

Rows counted there remain selectable in dropdowns but cannot be reverse-filled from a map pin until geometry exists for those barangays.


## API diagnostics

The reusable PHP adapter includes diagnostic endpoints for host-project validation:

```text
GET /diagnostics
GET /schema
GET /missing-geometry?limit=250
GET /search?q=Daet
POST /reverse-probe
```

Use `demo/api-diagnostics.html` to run these checks from a browser.

