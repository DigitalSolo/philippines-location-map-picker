# Host Application Integration

This package should be integrated into host applications as a static-data component first. The host app serves the built package assets and cached data. Customer checkout/address-save flows should not depend on live PSGC or third-party GIS calls.

## Required host files

Copy the package public bundle into the host app:

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run build
npm run copy-public -- C:\www\sukimart\public_html\assets\vendor\philippines-location-map-picker
```

The host app must serve these paths:

```text
/assets/vendor/philippines-location-map-picker/dist/location-map-picker.css
/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js
/assets/vendor/philippines-location-map-picker/data/psgc/regions.json
/assets/vendor/philippines-location-map-picker/data/geo/bounds/barangays.json
/assets/vendor/philippines-location-map-picker/data/geo/centroids/barangays.json
/assets/vendor/philippines-location-map-picker/data/geo/polygons/barangays/{city_id}/{barangay_id}.json
```

Run this before copying data into a host app:

```powershell
npm run verify-static-data
```

## Recommended factory

Use `createStaticLocationMapPicker()` for host pages. It requires an explicit `baseUrl`, which prevents the package from silently guessing the host application's asset path.

```html
<link rel="stylesheet" href="/assets/vendor/philippines-location-map-picker/dist/location-map-picker.css">
<div id="shippingLocationPicker"></div>

<input type="hidden" id="barangay_id" name="barangay_id">
<input type="hidden" id="pin_lat" name="pin_lat">
<input type="hidden" id="pin_lng" name="pin_lng">
<input type="hidden" id="location_picker_value_json" name="location_picker_value_json">
<input type="hidden" id="location_picker_validation_json" name="location_picker_validation_json">
```

```js
import { createStaticLocationMapPicker } from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const picker = createStaticLocationMapPicker({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  hiddenInputs: {
    barangayId: '#barangay_id',
    pinLat: '#pin_lat',
    pinLng: '#pin_lng',
    valueJson: '#location_picker_value_json',
    validationJson: '#location_picker_validation_json'
  },
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
  }
});

await picker.ready;
```


## One-call field controller

Use `mountStaticLocationMapPickerField()` when a host page wants the static picker, optional edit-form hydration, optional form binding, and explicit open/close methods through one controller.

```js
import { mountStaticLocationMapPickerField } from 'philippines-location-map-picker';

const field = mountStaticLocationMapPickerField({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  form: '#shippingForm',
  formBinding: {
    focusOnBlocked: true
  },
  controls: {
    openButton: '[data-address-open]',
    clearButton: '[data-address-clear]',
    summary: '[data-address-summary]',
    status: '[data-address-status]'
  },
  pickerOptions: {
    ui: {
      displayMode: 'modal',
      selectedLabelFormat: 'city_barangay'
    },
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: true
    }
  }
});

await field.ready;
```

The controller exposes `field.open()`, `field.close()`, `field.isOpen()`, `field.updatePayload()`, `field.resize()`, and `field.destroy()`. External field controls can include open, close, clear, summary, and status targets. See `docs/host-field-controller.md` and `docs/host-field-controls.md` for the full contract.

## Form-submit gate

Use `bindLocationMapPickerForm()` for normal address-save forms. It writes the package-owned hidden fields and blocks picker-owned invalid states before the host form is allowed to continue.

```js
import {
  bindLocationMapPickerForm,
  createStaticLocationMapPicker
} from 'philippines-location-map-picker';

const picker = createStaticLocationMapPicker({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data'
});

await picker.ready;

bindLocationMapPickerForm({
  form: '#shippingForm',
  picker,
  focusOnBlocked: true
});
```

The host application must still validate customer/account fields and all business rules after the picker returns `picker_valid`.


## Saved address hydration

Load saved values as a clean baseline so edit pages do not appear dirty immediately.

```js
await picker.setValue({
  location: {
    region_id: '05',
    province_id: '0516',
    city_id: '051611',
    barangay_id: '051611004'
  },
  pin: {
    lat: 14.143000,
    lng: 122.954000
  }
}, false, { resetDirty: true });
```

## Host submit payload helper

Use `createLocationMapPickerSubmitPayload(picker)` when saving through `fetch()` instead of relying on hidden inputs. It returns the same exact package-owned fields documented below. See `docs/host-submit-payload.md` for a complete example. For normal form posts, prefer `bindLocationMapPickerForm()` and see `docs/host-form-binding.md`.

## Host save contract

For an address save endpoint, store these explicit fields from the host form:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

The host application owns delivery-zone rules, serviceability, shipping cost calculations, and account/customer persistence. Keep those outside this package.


## Host form submit guard

For standard address-save forms, use `blockInvalidLocationMapPickerSubmit(picker)` before reading the payload. It blocks picker-owned failure states and writes the failure message into the picker status area.

Blocked codes are `picker_invalid`, `picker_busy`, `picker_disabled`, and `picker_readonly`. A successful picker state returns `picker_valid`.

The host app must still validate customer/account fields and all business rules after the picker returns `picker_valid`.


## Event cleanup

Host pages that attach picker event listeners should call `off(eventName, handler)` during teardown. See `docs/event-subscription.md` for the explicit unsubscribe contract.

## Selection-state helpers

Use `hasLocationMapPickerSelection()` and `selectedLocationMapPickerLevel()` when host pages need display-only selected/unselected state without duplicating location-level checks. See `docs/host-selection-state.md`.

## Clear controls

Use `clearButton` / `clearControl` in `bindLocationMapPickerFieldControls()` when compact host address rows need a dedicated clear action. The button clears both location and pin through `picker.clear(true)` and is disabled when the picker cannot be edited or already has no value. See `docs/host-field-controls.md`.


## Saved Edit Forms

For host edit screens, use `createLocationMapPickerInitialValueFromForm()` to read the package-owned hidden fields and pass the result as `initialValue` to `mountStaticLocationMapPickerField()`.

The initial-value reader prefers `location_picker_value_json` when present, then falls back to the exact scalar field names used by the submit payload contract. Invalid JSON or partial pin coordinates fail loudly instead of silently mounting a corrupt saved address.

See `docs/host-initial-value.md`.

## Optional Map Tile Background

The picker does not require third-party map tiles. A host app can leave `map.tileUrlTemplate` blank and use the local grid/boundary overlay, or it can provide a raster tile URL template such as `https://tile.openstreetmap.org/{z}/{x}/{y}.png` for a recognizable background map.

When a tile provider is used, set `map.tileAttribution` to the attribution required by that provider.

## Production data gate

Before a host app consumes this package as production-ready, run:

```powershell
npm run check-production-readiness
```

The first SukiMart integration should use the limited-geometry production policy:

- Save `barangay_id` as the authoritative location key.
- Save `pin_lat` and `pin_lng` when the user places a pin.
- Treat reverse-fill as a helper only where cached geometry exists.
- Keep delivery-zone, coverage, fee, and serviceability rules in SukiMart.

Do not block manual address selection just because reverse-fill geometry is unavailable for a barangay.
