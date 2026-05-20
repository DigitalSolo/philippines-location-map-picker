# Database Geometry Backfill

This package phase adds a CLI importer that backfills `location_barangay_geometries` from the GeoRisk/PSA Barangay Boundary ArcGIS layer.

## 1. Create the geometry table

Run:

```sql
db/location_barangay_geometries.sql
```

The foreign-key column is intentionally:

```sql
barangay_id CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
```

That matches `location_barangays.id`.

## 2. Test one page without inserting

```bash
php server/php/backfill-location-barangay-geometries.php ^
  --database=anitas ^
  --user=root ^
  --password=YOUR_PASSWORD ^
  --dry-run ^
  --max-pages=1
```

Or with an env file:

```bash
php server/php/backfill-location-barangay-geometries.php ^
  --env=C:\www\ab\.env ^
  --database=anitas ^
  --dry-run ^
  --max-pages=1
```

## 3. Run the full backfill

```bash
php server/php/backfill-location-barangay-geometries.php ^
  --database=anitas ^
  --user=root ^
  --password=YOUR_PASSWORD
```

The script:

1. Reads all existing `location_barangays.id` values.
2. Fetches barangay polygons from the ArcGIS endpoint in pages.
3. Converts GeoJSON `Polygon` and `MultiPolygon` features to MariaDB WKT `MULTIPOLYGON`.
4. Inserts only rows whose PSGC 10-digit code already exists in `location_barangays`.
5. Stores bounding box values for fast reverse lookup.
6. Uses `ON DUPLICATE KEY UPDATE`, so it can be safely re-run.

## 4. Check coverage

```sql
SELECT COUNT(*) AS geometry_rows
FROM location_barangay_geometries;

SELECT COUNT(*) AS barangays_without_geometry
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE g.barangay_id IS NULL
  AND b.active = 1;

SELECT b.id, b.name, b.city_id
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE g.barangay_id IS NULL
  AND b.active = 1
ORDER BY b.city_id, b.name
LIMIT 100;
```

## 5. Reverse lookup query

Use longitude first and latitude second in geometry functions.

```sql
SELECT
    b.id,
    b.name,
    b.city_id,
    g.source,
    g.source_ref
FROM location_barangay_geometries g
JOIN location_barangays b ON b.id = g.barangay_id
WHERE g.min_lat <= :lat
  AND g.max_lat >= :lat
  AND g.min_lng <= :lng
  AND g.max_lng >= :lng
  AND ST_Contains(g.boundary, ST_GeomFromText(CONCAT('POINT(', :lng, ' ', :lat, ')')))
LIMIT 1;
```

## Notes

- The source is good enough to make the picker useful immediately.
- PSGC changes after the source boundary date may not match every current barangay row.
- Skipped rows are reported in the CLI output.
- Keep this geometry table separate from `location_barangays`; do not place full polygon geometry in the normal dropdown/list table.
