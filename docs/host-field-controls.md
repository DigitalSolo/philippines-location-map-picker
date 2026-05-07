# Host Field Controls

`bindLocationMapPickerFieldControls()` wires external host-page controls to an existing `LocationMapPicker` instance.

This helper is for host pages that want their own compact address row, icon button, or card summary outside the package-rendered picker. The package still owns only the location picker state. The host application still owns address labels, customer/account fields, delivery rules, and saved-address IDs.

## Basic usage

```html
<button type="button" data-address-open>📍 Choose address</button>
<button type="button" data-address-clear disabled>Clear</button>
<span data-address-summary>Select City → Barangay</span>
<p data-address-status hidden></p>
<div id="shippingLocationPicker"></div>
```

```js
import {
  createStaticLocationMapPicker,
  bindLocationMapPickerFieldControls
} from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const picker = createStaticLocationMapPicker({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  ui: {
    selectedLabelFormat: 'city_barangay'
  }
});

const controls = bindLocationMapPickerFieldControls({
  picker,
  openButton: '[data-address-open]',
  clearButton: '[data-address-clear]',
  summary: '[data-address-summary]',
  status: '[data-address-status]',
  emptyLabel: 'Select City → Barangay'
});
```

The summary defaults to the integration label contract:

```text
City → Barangay
```

## One-call field controller usage

`mountStaticLocationMapPickerField()` can create the same control binding through its `controls` option.

```js
const field = mountStaticLocationMapPickerField({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  form: '#shippingAddressForm',
  controls: {
    openButton: '[data-address-open]',
    clearButton: '[data-address-clear]',
    summary: '[data-address-summary]',
    status: '[data-address-status]',
    emptyLabel: 'Select City → Barangay'
  }
});

await field.ready;
```

`field.controls` is either the controls binding or `null` when no `controls` option is provided.

## Formatting labels without DOM binding

Use `formatLocationMapPickerValueLabel()` when the host only needs a display string.

```js
const label = formatLocationMapPickerValueLabel(picker.value(), {
  selectedLabelFormat: 'city_barangay',
  emptyLabel: 'Select City → Barangay'
});
```

Supported formats:

```text
region_province_city_barangay
province_city_barangay
city_barangay
barangay_only
```

## Bound control behavior

The binding:

- opens the picker when the open control is clicked;
- closes the picker when the close control is clicked;
- clears the selected location and pin when the clear control is clicked;
- updates `aria-expanded` on open and close controls;
- disables open controls while the picker is disabled, read-only, or busy;
- disables close controls when the picker is closed;
- disables clear controls while the picker cannot be edited or has no location/pin value;
- updates summary text after picker changes;
- toggles selected and invalid classes on the summary/open controls;
- infers selected/unselected display state from the picker required location level;
- writes `data-selected-level` to the summary element for host styling/debugging;
- writes `data-clearable` to the summary element for host styling/debugging;
- mirrors picker status into an optional status element.


## Clear controls

Bind one or more host-owned clear buttons with `clearButton` or `clearControl`.

```js
const controls = bindLocationMapPickerFieldControls({
  picker,
  openButton: '[data-address-open]',
  clearButton: '[data-address-clear]',
  summary: '[data-address-summary]'
});
```

The clear control calls `picker.clear(true)`, so it clears both the PSGC selection and the map pin, emits the normal change event, and lets any form binding rewrite blank submit fields on the next submit or `updatePayload()` call. The button is disabled when the picker is disabled, read-only, busy, or already empty.

## Selection state

The selected class is no longer hard-coded to barangay-only selection. The binding reads the picker validation contract and treats the address as selected when the location value reaches the configured required location level.

For example, a city-required picker is selected when `city_id` is present, even when `barangay_id` is intentionally empty. Full submit validity is still controlled by `picker.validate()`, so required pin and other validation failures continue to set the invalid class.

Override only the visual selection threshold when needed:

```js
const controls = bindLocationMapPickerFieldControls({
  picker,
  openButton: '[data-address-open]',
  clearButton: '[data-address-clear]',
  summary: '[data-address-summary]',
  selectionRequiredLevel: 'city'
});
```

See `docs/host-selection-state.md` for the standalone helper functions.

## Cleanup

```js
controls.destroy();
```

When using `mountStaticLocationMapPickerField()`, `field.destroy()` destroys controls, form binding, and picker in the correct order.

`controls.destroy()` also unregisters the picker `change`, `busychange`, `dirtychange`, `openchange`, and `statuschange` handlers that the controls binding installed, and removes open, close, and clear button click handlers. This keeps repeated host-page mounts from accumulating stale callbacks.
