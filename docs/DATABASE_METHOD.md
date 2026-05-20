# Database Method

Use this mode when the host project already has canonical Philippine location tables. The package becomes a UI component only; the project database remains the source of truth for regions, provinces, cities, barangays, boundary geometry, reverse matching, and saved address IDs.

## Why this is the preferred production method

Static mode is good for demos and offline prototypes, but nationwide barangay polygon coverage is too large to treat as a small browser asset. Database mode keeps heavy geometry server-side and sends the browser only what it currently needs.

The picker calls a small API:

```http
GET  /api/location-map-picker/regions
GET  /api/location-map-picker/provinces?region_id=...
GET  /api/location-map-picker/cities?province_id=...
GET  /api/location-map-picker/barangays?city_id=...
GET  /api/location-map-picker/location?barangay_id=...
GET  /api/location-map-picker/bounds?level=barangay&id=...
GET  /api/location-map-picker/centroid?level=barangay&id=...
GET  /api/location-map-picker/polygon?level=barangay&id=...
POST /api/location-map-picker/reverse
```

`POST /reverse` receives:

```json
{
  "lat": 14.112233,
  "lng": 122.955667,
  "city_id": "1234"
}
```

and returns either:

```json
{
  "data": {
    "region_id": "5",
    "region_name": "Region V",
    "province_id": "23",
    "province_name": "Camarines Norte",
    "city_id": "41",
    "city_name": "Talisay",
    "barangay_id": "612",
    "barangay_name": "Poblacion",
    "match_quality": "database-boundary"
  }
}
```

or:

```json
{ "data": null }
```

## Recommended schema

Keep geometry out of the main `location_barangays` table. Add `db/location_barangay_geometries.sql` and import boundary rows into that table.

The important design is:

```text
location_barangays
  id
  region_id
  province_id
  city_id
  name
  psgc_code

location_barangay_geometries
  barangay_id
  boundary
  boundary_simplified
  centroid
  min_lat
  max_lat
  min_lng
  max_lng
```

The bounding columns make reverse matching fast because MariaDB can reduce candidates before running `ST_Contains()`.

## Browser integration

Use one DOM element inside the form. The helper auto-creates the package-owned hidden fields on submit.

```html
<link rel="stylesheet" href="/assets/vendor/philippines-location-map-picker/dist/location-map-picker.css">

<form id="deliveryAddressForm" method="post" action="/account/address-save.php">
  <div id="locationPicker"></div>
  <button type="submit">Save address</button>
</form>

<script src="/assets/vendor/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountApiLocationMapPickerField({
  mount: '#locationPicker',
  apiUrl: '/api/location-map-picker',
  pickerOptions: {
    ui: {
      theme: 'light',
      size: 'comfortable',
      density: 'normal',
      selectedLabelFormat: 'city_barangay'
    },
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: true
    },
    map: {
      defaultCenter: { lat: 12.8797, lng: 121.7740 },
      defaultZoom: 6,
      pinMode: 'centered'
    }
  }
});
</script>
```

The submit payload fields created by the package are:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

## Reverse matching query pattern

Use WKT as `POINT(lng lat)`. Longitude is X, latitude is Y.

```sql
SELECT b.id AS barangay_id, b.name AS barangay_name
FROM location_barangay_geometries g
JOIN location_barangays b ON b.id = g.barangay_id
WHERE g.min_lat <= :lat
  AND g.max_lat >= :lat
  AND g.min_lng <= :lng
  AND g.max_lng >= :lng
  AND ST_Contains(g.boundary, ST_GeomFromText(:point_wkt))
LIMIT 1;
```

If the host already knows the selected city, also filter by `b.city_id = :city_id` before calling `ST_Contains()`.

## Geometry import notes

Import geometry in WGS84 longitude/latitude order. Store the raw or high-detail multipolygon in `boundary`, and a simplified multipolygon in `boundary_simplified` for map display. The reverse matcher should use `boundary`; the UI polygon endpoint can use `COALESCE(boundary_simplified, boundary)`.
