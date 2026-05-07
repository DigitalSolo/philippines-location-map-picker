# Philippines Location Map Picker

Standalone Philippine PSGC location picker with static hierarchy, cached geometry, map pin placement, and reverse boundary matching.

Working path:

```text
C:\www\packages\philippines-location-map-picker
```

Production direction:

```text
Package first
→ stable local demo
→ static/cached PSGC hierarchy
→ static/cached geometry
→ host application integration
```

Use static or backend-served PSGC and geometry data for production checkout/address flows. Do not depend on live third-party GIS services at runtime for customer checkout or address saving.

## Build

```powershell
cd C:\www\packages\philippines-location-map-picker
npm install
npm run build
```

## Demo

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run dev
```

Open:

```text
http://127.0.0.1:5173/demo/
```

The dev server runs from the package root so the demo can load `/data/psgc/...` and `/data/geo/...`. The demo also includes a **Sample settings for this page** panel that updates from the current scenario/provider/theme/map settings and copies a host-page starter snippet. See `docs/demo-sample-settings.md`.

## Static data commands

```powershell
npm run cache-psgc -- --out data\psgc
npm run cache-arcgis -- --province 0501600000 --out data\geo --precision 6 --simplify-step 3
npm run audit-geometry -- --psgc data\psgc --geo data\geo
npm run reconcile-geometry -- --psgc data\psgc --geo data\geo
npm run audit-static-data
npm run verify-static-data
```

Expected generated paths:

```text
data/psgc/regions.json
data/psgc/provinces/{region_id}.json
data/psgc/cities/{province_or_region_id}.json
data/psgc/barangays/{city_id}.json
data/geo/bounds/*.json
data/geo/centroids/*.json
data/geo/polygons/barangays/{city_id}/{barangay_id}.json
data/geo/geometry-coverage-report.json
data/geo/psgc-geometry-reconciliation-report.json
data/static-data-report.json
data/static-data-verification-report.json
```

## Static data verification

```powershell
npm run verify-static-data
```

This command runs geometry coverage, PSGC/geometry reconciliation, and static cache auditing, then writes `data/static-data-verification-report.json`. Strict mode is on by default and fails when PSGC rows, geometry rows, or matched geometry components are missing. Use `-- --strict 0` only when generating diagnostic reports during data work.

See `docs/static-data-tooling.md` for the full static-data gate.


## Production data readiness

There are now two separate readiness gates:

```powershell
npm run check-pilot-readiness
npm run check-production-readiness
npm run check-production-readiness:full-geometry
```

`check-pilot-readiness` confirms the bundled package/demo cache is internally consistent.

`check-production-readiness` is stricter. It requires nationwide PSGC hierarchy coverage before this package should be published as production-ready for normal address capture. The default production policy is **limited geometry**: Region / Province / City / Barangay selection must be nationwide, while reverse-fill from pin is allowed only where cached geometry exists.

`check-production-readiness:full-geometry` requires nationwide PSGC hierarchy plus nationwide barangay geometry coverage. Use this only when reverse-fill from pin is intended to work nationally.

The bundled demo cache is intentionally small. It is valid for package QA, but it is not a nationwide production cache. A production host must either ship a complete static PSGC cache or serve the same hierarchy from its backend.

## Copy into a host app

```powershell
npm run build
npm run copy-public -- C:\www\sukimart\public_html\assets\vendor\philippines-location-map-picker
```

The copy command exports `dist/` and `data/`.

See `docs/host-integration.md` for the host-page save contract, static asset paths, form-submit validation gate, and saved-address hydration pattern. See `docs/host-submit-payload.md` for the normalized JSON payload helper, `docs/host-form-binding.md` for the normal form-post adapter, `docs/host-field-controller.md` for the one-call static field controller, `docs/host-field-controls.md` for external host controls and display labels, and `docs/demo-sample-settings.md` for the copyable demo-generated starter settings.

## Basic usage

```html
<link rel="stylesheet" href="/assets/vendor/philippines-location-map-picker/dist/location-map-picker.css">
<div id="locationPicker"></div>
<script type="module">
import { createStaticLocationMapPicker } from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const picker = createStaticLocationMapPicker({
  mount: document.getElementById('locationPicker'),
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  ui: {
    theme: 'light',
    size: 'comfortable',
    density: 'normal',
    selectedLabelFormat: 'city_barangay'
  },
  validation: {
    requiredLocationLevel: 'barangay',
    requirePin: true
  },
  map: {
    pinMode: 'centered',
    mapHeight: 420
  },
  hiddenInputs: {
    barangayId: '#barangay_id',
    pinLat: '#pin_lat',
    pinLng: '#pin_lng',
    valueJson: '#location_picker_value_json',
    validationJson: '#location_picker_validation_json'
  }
});
</script>
```

## Core API surface

```js
picker.open();
picker.close();
picker.isOpen();
picker.value();
picker.validate();
picker.isValid();
await picker.reverseFillFromPin(true);
picker.setDisabled(true);
picker.setReadOnly(true);
picker.setBusy(true, 'Saving address...');
picker.setBusy(false);
picker.isDirty();
picker.dirtyState();
picker.resetDirty(true);
picker.statusState();
picker.debugState();
createLocationMapPickerSubmitPayload(picker);
createLocationMapPickerSubmitResult(picker);
blockInvalidLocationMapPickerSubmit(picker);
bindLocationMapPickerForm({ form, picker });
writeLocationMapPickerSubmitPayloadToForm(form, payload);
mountStaticLocationMapPickerField({ mount, baseUrl, form });
bindLocationMapPickerFieldControls({ picker, openButton, summary, status });
formatLocationMapPickerValueLabel(picker.value());
```

Load a saved value as the clean baseline:

```js
await picker.setValue({
  location: {
    region_id: '05',
    province_id: '0516',
    city_id: '051611',
    barangay_id: '051611004'
  },
  pin: { lat: 14.143, lng: 122.954 }
}, true, { resetDirty: true });
```

Use `trackDirty: true` when a programmatic value change should count as a user-visible change.

## Demo QA matrix

| Scenario | Purpose |
|---|---|
| Static default | Production-oriented static hierarchy + geometry path |
| Live centered pin | Live hierarchy + live geometry development path |
| Live free pin | Free-pin behavior with live providers |
| Dark compact | Theme, compact size, and tight density smoke test |
| Modal tall map | Modal shell class and tall map sizing |
| Responsive map | Responsive clamp sizing |
| Read-only saved address | Initial saved value hydration without edit permissions |
| Disabled saved address | Disabled state propagation |
| Validation: pin required | Required barangay + pin validation |
| GeoIP hint mock | GeoIP backfill contract without external network dependency |
| Hidden input form post | Hidden input serialization and dirty/touched form guard |

## Final package QA checklist

- Static mode loads without console errors.
- Static mode makes no third-party hierarchy or geometry calls.
- Mixed/live modes are visibly marked as development/testing modes.
- Region → Province → City/Municipality → Barangay selection works.
- Province-less regions can load cities/municipalities through region-level city files.
- Centered pin mode and free pin mode both work.
- Zoom buttons do not place or move the pin.
- Mouse-wheel zoom stays centered under the pointer.
- Map resize options apply without requiring a page reload.
- The demo sample-settings panel updates when the current page settings change and its copy button copies the visible starter config.
- Reverse-fill locks interaction while the lookup is running.
- Reverse-fill no-match is clear and non-destructive.
- Saved initial values hydrate without marking the picker dirty.
- `setValue(..., { resetDirty: true })` creates a clean baseline.
- `setValue(..., { trackDirty: true })` marks a programmatic change dirty.
- `validate()` and `isValid()` agree for each required level.
- Required pin validation blocks form submission when no pin exists.
- Hidden inputs update for scalar IDs/names, pin values, JSON value, validation, dirty/touched state, status, last error, and debug state.
- Disabled, read-only, and busy states propagate to both picker and map.
- CSS remains isolated under package classes and variables.
- `npm run build` completes successfully.

## Current release notes

### 1.0.50

- Included the generated root static-data report files in the demo route/data fix delta so `/data/static-data-report.json` and `/data/static-data-verification-report.json` resolve during local Vite QA.
- Updated the demo QA export package version to `1.0.50`.

### 1.0.49

- Restored the root `README.md` and `docs/*.md` files into the releasable package tree.
- Added `docs/release-cleanup.md` as the final package-file checklist before SukiMart integration.
- Kept the 1.0.48 demo route fix contract: root `/` redirects to `/demo/`, and `demo/index.html` loads `./demo.js`.

### 1.0.48

- Added root `index.html` to redirect local startup from `/` to `/demo/`.
- Changed the demo script include to `./demo.js` so `/demo/demo.js` resolves correctly from Vite.
- Updated the dev script to open `/demo/`.

### 1.0.46

- Added a demo **Sample settings for this page** panel that reflects the current scenario/provider/theme/density/display/pin/map/debug settings.
- Added a copy button for the visible host-page starter snippet.
- Documented the sample-settings panel in `docs/demo-sample-settings.md`.



### 1.0.44

- Added `clearButton` / `clearControl` support to `bindLocationMapPickerFieldControls()` for host-owned compact address rows.
- Clear controls now call `picker.clear(true)`, removing both the location selection and map pin through the normal picker change flow.
- Clear controls are disabled while the picker is disabled, read-only, busy, or already empty.
- Summary elements now receive `data-clearable` for host styling/debugging.

### 1.0.43

- Added `selectedLocationMapPickerLevel()` and `hasLocationMapPickerSelection()` for host-side selected/unselected display logic.
- Updated field controls so selected state follows the picker required location level instead of assuming barangay-only selection.
- Summary elements now receive `data-selected-level` for host styling/debugging.
- Added `docs/host-selection-state.md` for selection-state contracts separate from full submit validation.

### 1.0.42

- Added `off(eventName, handler)` to `LocationPicker`, `MapPicker`, and `LocationMapPicker` so host apps can remove event listeners explicitly.
- `off(eventName)` now clears all handlers for that event name.
- Updated `bindLocationMapPickerFieldControls().destroy()` to unregister picker event handlers, preventing stale summary/status callbacks after host-side field teardown.
- Added `docs/event-subscription.md` for framework/admin-grid cleanup patterns.


### 1.0.41

- Added `bindLocationMapPickerFieldControls()` for host-owned open buttons, close buttons, summary text, and status text.
- Added `formatLocationMapPickerValueLabel()` so host apps can render the same City → Barangay label without duplicating package formatting rules.
- Added open/close/openchange events on `LocationPicker` and `LocationMapPicker` so external controls stay synchronized.
- Extended `mountStaticLocationMapPickerField()` with an optional `controls` binding.
- Added `docs/host-field-controls.md` for compact host address-row integration.

### 1.0.40

- Added `LocationMapPicker.open()`, `LocationMapPicker.close()`, and `LocationMapPicker.isOpen()` for explicit host-side modal control.
- Added `mountStaticLocationMapPickerField()` as a one-call host field controller for static picker mounting, optional saved-value hydration, optional form binding, and external open/close controls.
- Added `docs/host-field-controller.md` for reusable host UI mounting/opening patterns.

### 1.0.39

- Added `bindLocationMapPickerForm()` for normal host form submit flows.
- Added `writeLocationMapPickerSubmitPayloadToForm()` to create/update the exact package-owned hidden fields.
- Added `docs/host-form-binding.md` with callbacks, custom field names, manual payload writing, and cleanup guidance.


### 1.0.38

- Added `createLocationMapPickerSubmitResult()` for strict host submit decisions.
- Added `blockInvalidLocationMapPickerSubmit()` to block invalid/busy/disabled/read-only picker submissions and set picker status.
- Documented explicit submit guard codes: `picker_valid`, `picker_invalid`, `picker_busy`, `picker_disabled`, and `picker_readonly`.


### 1.0.37

- Added `createLocationMapPickerSubmitPayload()` for host address-save endpoints.
- Added `createLocationMapPickerSubmitPayloadFromValue()` for tests and value-only serialization.
- Added `docs/host-submit-payload.md` with the exact payload contract: `barangay_id`, `pin_lat`, `pin_lng`, `location_picker_value_json`, and `location_picker_validation_json`.

### 1.0.36

- Added `createStaticLocationMapPicker()` for host applications that want the production static provider stack without repeating setup code.
- Added `docs/host-integration.md` with explicit host asset paths, form-submit validation gating, saved-address hydration, and address-save field contract.
- Kept SukiMart/business rules outside the package; this package still returns location, pin, validation, dirty/touched, status, and debug state only.

### 1.0.35

- Added `npm run verify-static-data` as the static-data release gate.
- Added a consolidated static-data verification report at `data/static-data-verification-report.json`.
- Documented strict-mode cache confirmation before SukiMart or other host-app integration.

### 1.0.34

- Hardened the demo as a QA harness with saved-address, read-only, disabled, pin-required, mock GeoIP, hidden-input, dirty/touched, and form-submit scenarios.
- Corrected the local dev server/demo path contract so `/data` is served from the package root and the demo runs from `/demo/`.
- Added final QA and demo coverage documentation.
- Fixed the geometry coverage audit city grouping for legacy PSGC IDs versus ten-digit PSGC IDs.


## Host Initial Value Helper

Saved edit forms can call `createLocationMapPickerInitialValueFromForm(form)` to restore the package-owned address payload before mounting a picker field. See `docs/host-initial-value.md`.


### 1.0.51 Demo static reports

The demo now ships static coverage reports in both `data/` and `demo/data/` so `/data/static-data-report.json` resolves whether the Vite server is launched from the package root or the demo folder.


## 1.0.52 Exact Demo Rebase

This release is intended to be applied as a full rebase rather than a delta patch.

The demo now resolves its PSGC, geometry, and coverage JSON files relative to `demo/demo.js` using `import.meta.url`. This prevents the `/data/*.json` path drift that can happen when Vite is launched from the package root versus the `demo` folder.

For a clean local reset, remove the existing package folder and extract this ZIP so the resulting directory is exactly:

```text
C:\www\packages\philippines-location-map-picker
```

Then run:

```text
npm install
npm run dev
```


## 1.0.53 Demo Rebase Notes

- Candidate PSGC code lookup order now prefers the code format already used by the cached JSON files, eliminating noisy static-provider 404s for the bundled demo paths.
- The bundled demo data now supports both the province-backed Region V path and the province-less NCR city path through Barangay selection.
- The offline map canvas has a visible local grid background so the demo map remains visible without third-party tile calls.

## 1.0.54 Demo Map Tile Fix

- The demo now uses OpenStreetMap raster tiles by default so the map is a recognizable, zoomable map during browser QA.
- The existing local grid remains as a fallback background if tiles are unavailable.
- The reusable package still does not require runtime map tiles unless the host passes `map.tileUrlTemplate`.
- `map.tileAttribution` is supported so host/demo pages can display the required tile attribution.


## 1.0.55 Production Data Contract Cleanup

- Added `npm run check-production-readiness` as the production gate for nationwide PSGC hierarchy coverage with limited-geometry reverse-fill.
- Added `npm run check-production-readiness:full-geometry` for nationwide PSGC plus nationwide barangay geometry.
- Expanded static-data reports with explicit `productionHierarchyReady`, `productionReverseFillReady`, release-mode flags, thresholds, and blockers.
- Updated the demo coverage panel so it clearly separates pilot/demo validity from production readiness.
- Documented the production data contract and the safe SukiMart path: nationwide PSGC first, limited geometry allowed, reverse-fill only where cached geometry exists.

## Production PSGC cache command

The bundled data may be pilot/demo-sized. Before publishing a production release, build and verify a production PSGC hierarchy:

```powershell
npm run build-production-psgc-cache
npm run refresh-data-reports
npm run check-production-readiness
```

Production readiness intentionally fails until the cached hierarchy meets nationwide coverage thresholds. Reverse-fill may still be limited by geometry coverage unless full-geometry mode is used.

## Production PSGC flat-file import

If the production PSGC hierarchy is available as a CSV or JSON file, import it without depending on a live API:

```powershell
npm run build-production-psgc-cache:file -- --input C:\path\to\psgc.csv
npm run refresh-data-reports
npm run check-production-readiness
```

The importer writes the static provider structure under `data/psgc/` and records details in `data/psgc/import-psgc-report.json`.

## PSGC source validation

Before importing production PSGC data from a local file, validate the source:

```powershell
npm run validate-psgc-source -- --input C:\path\to\psgc.csv
```

The production cache builder now validates file-based PSGC sources before import. To test the parser without production data:

```powershell
npm run smoke-psgc-source
```

The smoke file is intentionally small and must not be treated as production coverage.

## Production PSGC thresholds

Production readiness now uses the PSA 31 March 2026 PSGC count contract:

```text
18 regions
82 provinces
1,642 cities/municipalities
42,010 barangays
```

The threshold definitions live in `tools/production-thresholds.js` so audit, validation, and production cache tooling share one source of truth.

## GitHub publishing gate

Repository and release checks are separated:

```powershell
npm run check-publish-readiness:pilot
```

checks the package/repo shape for normal GitHub branch work, while:

```powershell
npm run check-publish-readiness
```

is the production release gate and fails until production PSGC readiness passes.

## PSGC Cloud rate limiting and resume

`npm run build-production-psgc-cache` now resumes a failed PSGC Cloud cache run instead of deleting partial progress when a previous PSGC Cloud production-cache report exists.

Use the normal command after a 429/rate-limit failure:

```powershell
npm run resume-production-psgc-cache
npm run refresh-data-reports
npm run check-production-readiness
```

For a completely clean rebuild, explicitly run:

```powershell
npm run build-production-psgc-cache:fresh
```

The PSGC Cloud cache command retries HTTP 429 and transient 5xx/network failures with exponential backoff. The default cloud delay is intentionally conservative.

## 1.0.62 official PSA hierarchy baseline

Version 1.0.62 includes a production hierarchy cache generated from the Philippine Statistics Authority PSGC 1Q 2026 Publication Datafile. The production gate passes for hierarchy-first / limited-geometry mode.

Production scope in this package:

```text
PSGC address hierarchy: production-ready
Map pin placement: available through configured map tiles
Reverse-fill from pin: limited to cached geometry areas
Delivery/serviceability logic: host application responsibility
```

Full reverse-fill certification still requires nationwide barangay geometry and `npm run check-production-readiness:full-geometry`.

## GitHub release handoff

This package is ready for a GitHub release as a production PSGC hierarchy baseline with limited geometry.

Run before pushing:

```powershell
npm run check-github-release
```

Release notes:

```text
docs/release-notes-v1.0.65.md
```

GitHub handoff checklist:

```text
docs/github-release-handoff.md
```
