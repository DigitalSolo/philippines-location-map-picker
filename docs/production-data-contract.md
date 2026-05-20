# Production Data Contract

The package data contract is split into:

- `data/psgc/` for static PSGC hierarchy.
- `data/geo/bounds/` for cached bounds.
- `data/geo/centroids/` for cached centroids.
- `data/geo/polygons/` for optional barangay polygon geometry.

Production hierarchy coverage can be complete even when reverse-fill geometry coverage is limited.

Host pages must provide the correct `baseUrl` for the package `data` directory.
