# GitHub Publishing Gate

This package can be pushed to GitHub as a repository before it is production-certified, but a production release must pass the production publish gate.

## Normal branch/PR check

Use this for ordinary development, pull requests, and pilot/demo releases:

```powershell
npm run check-publish-readiness:pilot
```

This confirms the repository shape, package metadata, host API, hardening report, vendor-consumption report, and pilot static-data validity.

It does **not** certify nationwide production address coverage.

## Production release check

Use this before tagging a production release:

```powershell
npm run check-publish-readiness
```

This runs production mode and blocks publication until `npm run check-production-readiness` also passes.

## Required production data sequence

```powershell
npm run build-production-psgc-cache:file -- --input C:\path\to\production-psgc.csv
npm run refresh-data-reports
npm run check-production-readiness
npm run check-publish-readiness
```

## GitHub Actions

The included workflow runs the pilot publishing gate on push and pull request. It intentionally does not require production PSGC coverage for ordinary branch work.

Production release/tagging should be performed only after the local production publish gate passes.

## Generated report

Both pilot and production modes write:

```text
data/github-publish-readiness-report.json
```

## Production cache rate limits

A GitHub production release must not be created from a partially cached PSGC hierarchy. If PSGC Cloud returns HTTP 429 during cache generation, resume first:

```powershell
npm run resume-production-psgc-cache
npm run refresh-data-reports
npm run check-publish-readiness
```

The publish gate remains blocked until the production PSGC hierarchy thresholds pass.

## 1.0.62 production publish status

The 1.0.62 baseline passes the production GitHub publish gate in limited-geometry mode after importing the official PSA PSGC 1Q 2026 hierarchy.

Run:

```powershell
npm run refresh-data-reports
npm run check-publish-readiness
```

This certifies nationwide PSGC hierarchy coverage, not nationwide reverse-fill geometry.

## v1.0.63 release handoff

For the first production-hierarchy GitHub release, run:

```powershell
npm run check-github-release
```

Then use:

```text
docs/release-notes-v1.0.63.md
```

as the GitHub release description.
