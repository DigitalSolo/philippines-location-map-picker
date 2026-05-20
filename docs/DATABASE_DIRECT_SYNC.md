# Direct Database Sync

Use `server/php/sync-location-direct.php` to populate the PLMP database tables directly.

This script replaces the older SQL-batch workflow. It writes directly to MariaDB and backfills both the location hierarchy and barangay geometry.

## Tables written

```text
location_regions
location_provinces
location_city
location_barangays
location_barangay_geometries
```

## First test

```cmd
php server\php\sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas --dry-run --max-pages=1
```

## Full sync

```cmd
php server\php\sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas
```

## Useful options

```cmd
--missing-active=0
```

Inserts source-only rows as inactive. This is the safer default when the hierarchy tables already contain your canonical PSGC set.

```cmd
--missing-active=1
```

Inserts source-only rows as active. Use this only for an empty seed or when you intentionally want every source row selectable.

```cmd
--update-names
```

Updates names on existing rows. The default preserves existing names.

```cmd
--start-offset=10000
```

Resumes from a source feature offset.

## After sync

Run:

```sql
db/check-location-map-picker-database.sql
```
