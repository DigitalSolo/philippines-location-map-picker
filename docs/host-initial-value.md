# Host Initial Value Contract

This package owns only the saved picker payload fields:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

Host applications own customer records, shipping labels, delivery-zone checks, and account logic.

## Reading a Saved Form Payload

Use `readLocationMapPickerSubmitPayloadFromForm()` when an edit form already contains the package-owned hidden fields.

```js
import {
  readLocationMapPickerSubmitPayloadFromForm
} from 'philippines-location-map-picker';

const payload = readLocationMapPickerSubmitPayloadFromForm(addressForm);
```

The helper reads only the field names above. It does not search for alternate names.

## Creating an initialValue

Use `createLocationMapPickerInitialValueFromForm()` before mounting a saved address field.

```js
import {
  createLocationMapPickerInitialValueFromForm,
  mountStaticLocationMapPickerField
} from 'philippines-location-map-picker';

const initialValue = createLocationMapPickerInitialValueFromForm(addressForm);

const addressField = mountStaticLocationMapPickerField({
  mount: '#address-picker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  form: addressForm,
  initialValue,
  controls: {
    openButton: '[data-address-picker-open]',
    clearButton: '[data-address-picker-clear]',
    summary: '[data-address-picker-summary]',
    status: '[data-address-picker-status]'
  }
});
```

## JSON vs Scalar Fallback

The helper prefers `location_picker_value_json` when it is present. That field preserves the full location names and pin state.

If `location_picker_value_json` is blank, the helper uses:

```text
barangay_id
pin_lat
pin_lng
```

A scalar-only value can still hydrate names through the provider when the picker loads.

## Hard Failure Rules

The helper throws explicit errors for invalid package-owned data:

- malformed `location_picker_value_json`
- JSON payloads that are not objects
- non-numeric pin coordinates
- only one of `pin_lat` / `pin_lng` being present

This keeps edit forms from silently loading corrupt saved address payloads.
