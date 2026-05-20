SELECT COUNT(*) AS geometry_rows
FROM location_barangay_geometries;

SELECT COUNT(*) AS barangays_total
FROM location_barangays
WHERE active = 1;

SELECT COUNT(*) AS active_barangays_without_geometry
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 1
  AND g.barangay_id IS NULL;

SELECT b.id, b.name, b.city_id
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 1
  AND g.barangay_id IS NULL
ORDER BY b.city_id, b.name
LIMIT 250;

SELECT
    b.id,
    b.name,
    b.city_id,
    g.min_lat,
    g.max_lat,
    g.min_lng,
    g.max_lng,
    g.source,
    g.source_ref
FROM location_barangay_geometries g
JOIN location_barangays b ON b.id = g.barangay_id
ORDER BY b.city_id, b.name
LIMIT 25;
