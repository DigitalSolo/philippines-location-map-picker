# Production PSGC File Import

PSGC data should be imported into the package cache before release. The cache files must remain static JSON assets that the browser can fetch from the host-provided `baseUrl`.

The package should not call a host database directly. Host applications may separately map the posted `barangay_id` into their own address tables.
