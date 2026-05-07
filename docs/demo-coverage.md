# Demo Coverage Notes

The demo is the package QA harness. It should prove the standalone package contract before any host application, checkout workflow, RDC address form, or customer account page uses it.

Run:

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run dev
```

Open:

```text
http://127.0.0.1:5173/demo/
```

## Required walkthrough

- Static default: loads `/data/psgc` and `/data/geo` with no third-party runtime calls.
- Live centered pin: uses live PSGC hierarchy and live ArcGIS geometry, with visible third-party warning.
- Live free pin: validates free-pin behavior with live providers.
- Dark compact: applies dark theme, compact size, and tight density.
- Modal tall map: validates modal display class and tall map sizing.
- Responsive map: validates CSS clamp map sizing and resize stability.
- Read-only saved address: hydrates Talisay → Poblacion without marking dirty and prevents edits.
- Disabled saved address: disables picker/map controls while preserving hidden input serialization.
- Validation: pin required: blocks simulated form submit when barangay or pin is missing.
- GeoIP hint mock: uses an in-demo lookup only, backfills Talisay → Poblacion, and does not call an external GeoIP service.
- Hidden input form post: wires scalar, JSON, validation, dirty/touched, status, last-error, and debug hidden inputs.

## Manual assertions

- Reverse-fill shows busy overlay and progress cursor while it runs.
- Reverse-fill no-match keeps the previous location intact.
- Browser location works on HTTPS or localhost when permission is granted.
- Clearing the picker marks the `clear` touched flag.
- Resetting dirty baseline clears dirty state without changing current value.
- Loading saved value with `resetDirty` produces a clean baseline.
- Changing provider/theme/size/density/map size rebuilds the component cleanly.
- Destroy/rebuild does not leave stale modal-open classes on `<html>`.

## Demo Map Surface

The demo uses OpenStreetMap raster tiles by default so QA testers can visually confirm panning, zooming, pin placement, and boundary focus against a recognizable map. The component still supports an offline grid fallback when `map.tileUrlTemplate` is blank or when a host app intentionally avoids third-party tile calls.
