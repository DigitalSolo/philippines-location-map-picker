SELECT COUNT(*) AS regions
FROM location_regions;

SELECT COUNT(*) AS provinces
FROM location_provinces;

SELECT COUNT(*) AS cities
FROM location_city;

SELECT COUNT(*) AS barangays
FROM location_barangays;

SELECT COUNT(*) AS geometry_rows
FROM location_barangay_geometries;

SELECT COUNT(*) AS active_barangays_without_geometry
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 1
  AND g.barangay_id IS NULL;

SELECT COUNT(*) AS inactive_barangays_with_geometry
FROM location_barangays b
JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 0;

SELECT b.id, b.name, b.city_id
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 1
  AND g.barangay_id IS NULL
ORDER BY b.city_id, b.name
LIMIT 250;
