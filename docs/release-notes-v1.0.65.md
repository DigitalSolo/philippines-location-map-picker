# v1.0.65 — Production PSGC Hierarchy Baseline

Initial GitHub production-hierarchy release for `philippines-location-map-picker`.

## Included

- Nationwide Philippine PSGC hierarchy cache.
- Region / Province / City-Municipality / Barangay selection.
- Province-less city support, including NCR-style flows.
- Static JSON PSGC provider.
- Static geometry provider.
- Map pin placement.
- Centered pin and free pin modes.
- Modal and embedded display modes.
- Hidden input serialization contract.
- Validation, dirty/touched, busy/read-only/disabled state contracts.
- Host submit payload helpers.
- Host submit guard helpers.
- Host form binding helpers.
- Host field controller helpers.
- Demo QA harness.
- Sample settings copy panel.
- Production readiness gates.
- GitHub publish readiness gates.
- Official production threshold reports.

## Production status

Ready for production address selection using explicit PSGC hierarchy.

## Limited by design

Reverse-fill from pin is limited to cached geometry coverage. Full nationwide barangay polygon coverage is not bundled in this release.

## Host application rules

- Treat explicit PSGC selection as the address authority.
- Store barangay PSGC code as the primary location key.
- Store latitude/longitude only as pin precision data.
- Keep delivery-zone and business-rule validation outside this package.
- Configure map tiles explicitly in host production settings.

## Validation commands

```powershell
npm run check-release-artifacts
npm run check-publish-readiness
npm run check-production-readiness
```
