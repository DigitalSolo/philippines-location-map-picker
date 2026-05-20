CREATE TABLE IF NOT EXISTS location_barangay_geometries (
    barangay_id CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,

    boundary MULTIPOLYGON NOT NULL,
    boundary_simplified MULTIPOLYGON NULL,
    centroid POINT NULL,

    min_lat DECIMAL(10,7) NOT NULL,
    max_lat DECIMAL(10,7) NOT NULL,
    min_lng DECIMAL(10,7) NOT NULL,
    max_lng DECIMAL(10,7) NOT NULL,

    source VARCHAR(120) NOT NULL DEFAULT '',
    source_ref VARCHAR(255) NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (barangay_id),

    SPATIAL INDEX sx_location_barangay_geometries_boundary (boundary),
    INDEX ix_location_barangay_geometries_bbox (min_lat, max_lat, min_lng, max_lng),

    CONSTRAINT fk_location_barangay_geometries_barangay
        FOREIGN KEY (barangay_id)
        REFERENCES location_barangays (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
