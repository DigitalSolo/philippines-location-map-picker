# GitHub Release Handoff

This package is ready to publish to GitHub as the first production-hierarchy baseline.

## Release identity

```text
Version: 1.0.65
Release type: production hierarchy, limited geometry
Recommended tag: v1.0.65
```

## What this release means

This package can be used for production Philippine address selection because it includes nationwide PSGC hierarchy.

Reverse-fill from pin is not nationwide. It remains available only where cached barangay geometry exists. Host applications must continue treating explicit PSGC selection as the address authority.

## Required local checks before push

Run:

```powershell
cd C:\www\packages\philippines-location-map-picker
npm install
npm run check-github-release
```

Expected result:

```text
Release artifact check: OK
GitHub publish readiness (production): OK
```

## Recommended first GitHub push

```powershell
cd C:\www\packages\philippines-location-map-picker

git init
git add .
git commit -m "Initial production-hierarchy release"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/philippines-location-map-picker.git
git push -u origin main

git tag v1.0.65
git push origin v1.0.65
```

## Release notes

Use the contents of:

```text
docs/release-notes-v1.0.65.md
```

## Do not claim

Do not describe this release as full nationwide reverse-geocoding or full nationwide geometry coverage.

Use:

```text
Production-ready PSGC hierarchy with limited geometry reverse-fill.
```
