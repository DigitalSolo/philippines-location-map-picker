# Changelog

## 1.0.65 — Limited Geometry Publish Gate Fix

### Fixed

- Production publish readiness now treats unmatched limited demo geometry as a warning, not a blocker.
- `check-production-readiness` only blocks unmatched geometry in full-geometry mode.
- `check-release-readiness --scope production` now permits production PSGC hierarchy releases with limited/opportunistic reverse-fill geometry.
- The gate still fails full-geometry releases unless nationwide geometry is complete and clean.

## 1.0.64 — Publish Gate Local Install Fix

### Fixed

- `npm run check-release-artifacts` no longer fails merely because `node_modules` exists after `npm install`.
- `npm run check-publish-readiness` no longer fails merely because local install/cache folders exist in the working tree.
- Release gates now verify ignore rules and scan publishable project files while excluding local-only folders.
- Local folders such as `node_modules`, `.git`, and `.vite` remain forbidden in ZIP/release artifacts, but they are allowed to exist in a developer working tree when ignored.

## 1.0.63 — GitHub Release Handoff

### Added

- GitHub release handoff checklist.
- Release notes for the first production-hierarchy GitHub release.
- Repository artifact validation script.
- `npm run check-release-artifacts`.
- `npm run check-github-release`.

### Status

This release is ready for GitHub publication with nationwide PSGC hierarchy and limited geometry.

Production address selection is ready because the package includes nationwide PSGC hierarchy. Reverse-fill remains limited to cached geometry coverage and must be described as opportunistic, not nationwide.

## 1.0.62 — Official PSA Hierarchy Rebase

### Added

- Official PSA PSGC 1Q 2026 hierarchy imported into `data/psgc`.
- Production readiness report passing in limited-geometry mode.
- GitHub publish readiness passing in production mode.

### Status

- Production hierarchy: ready.
- Reverse-fill geometry: limited.
- Host API freeze: OK.
- Production hardening: OK.
- Vendor consumption: OK.
