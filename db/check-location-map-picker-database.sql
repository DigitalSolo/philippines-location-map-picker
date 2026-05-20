SELECT COUNT(*) AS location_regions
FROM location_regions;

SELECT COUNT(*) AS location_provinces
FROM location_provinces;

SELECT COUNT(*) AS location_city
FROM location_city;

SELECT COUNT(*) AS location_barangays
FROM location_barangays;

SELECT COUNT(*) AS location_barangay_geometries
FROM location_barangay_geometries;

SELECT COUNT(*) AS active_barangays_without_geometry
FROM location_barangays b
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 1
  AND g.barangay_id IS NULL;

SELECT
    b.id,
    b.name AS barangay_name,
    b.city_id,
    c.name AS city_name,
    p.name AS province_name,
    r.name AS region_name
FROM location_barangays b
JOIN location_city c ON c.id = b.city_id
JOIN location_provinces p ON p.id = c.provinces_id
JOIN location_regions r ON r.id = p.regions_id
LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
WHERE b.active = 1
  AND g.barangay_id IS NULL
ORDER BY r.name, p.name, c.name, b.name
LIMIT 250;
