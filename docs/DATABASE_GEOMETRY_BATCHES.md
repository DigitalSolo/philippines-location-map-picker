# Barangay Geometry SQL Batches

This phase changes the geometry backfill from a direct importer into a batch generator.

That matches the way this project is being managed: generate reviewable SQL files, import them in controlled chunks, and keep the polygon data out of the normal `location_barangays` table.

## What this creates

Run the generator and it creates:

```text
db/geometry-batches/location_barangay_geometries_0001.sql
db/geometry-batches/location_barangay_geometries_0002.sql
db/geometry-batches/location_barangay_geometries_0003.sql
...
db/geometry-batches/location_barangay_geometries_manifest.json
db/geometry-batches/location_barangay_geometries_missing_parent.csv
db/geometry-batches/import_all_location_barangay_geometries.sql
```

Each batch file is wrapped in its own transaction.

## 1. Create the table

Run this first:

```sql
db/location_barangay_geometries.sql
```

The important foreign-key column is:

```sql
barangay_id CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
```

That matches `location_barangays.id`.

## 2. Test one page

From the package root:

```cmd
php server\php\make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --dry-run --max-pages=1
```

Or without an env file:

```cmd
php server\php\make-location-barangay-geometry-sql-batches.php --database=anitas --user=root --password=YOUR_PASSWORD --dry-run --max-pages=1
```

## 3. Generate all batches

```cmd
php server\php\make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --features-per-batch=250
```

The `--database=anitas` value does two things:

1. It loads the existing parent IDs from `location_barangays`.
2. It skips source polygons whose `psgc_10d` value is not present in your table.

That prevents foreign-key failures during import.

## 4. Import the batch files

In HeidiSQL, import each generated file from:

```text
db\geometry-batches\
```

Start with:

```text
location_barangay_geometries_0001.sql
```

Then continue through the numbered files.

If you prefer the MySQL/MariaDB CLI, `import_all_location_barangay_geometries.sql` contains `SOURCE` lines for all generated files.

## 5. Check coverage

Run:

```sql
db/check-location-barangay-geometry-coverage.sql
```

The key result is:

```sql
active_barangays_without_geometry
```

If this is not zero, inspect:

```text
db\geometry-batches\location_barangay_geometries_missing_parent.csv
```

## Useful options

### Smaller batches

```cmd
php server\php\make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --features-per-batch=100
```

Use this if HeidiSQL or MariaDB complains about packet size.

### Resume from an offset

```cmd
php server\php\make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --start-offset=10000
```

### Include source rows even when no parent barangay exists

```cmd
php server\php\make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --include-missing-parent
```

Do not use this for normal imports because the foreign key will reject rows with no matching `location_barangays.id`.

## Important limitation

This generator pulls every feature from the selected source layer. The default source is the GeoRisk/PSA Barangay Boundary ArcGIS layer.

That layer is a practical immediate source, but it is not the same thing as a freshly maintained official 2026 PSGC boundary release. The manifest and `source_ref` fields are kept so the source of every row is auditable.
