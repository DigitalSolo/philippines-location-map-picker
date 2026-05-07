# Host Submit Payload

Use `createLocationMapPickerSubmitPayload()` when a host application needs a normalized address-save payload from a `LocationMapPicker` instance.

The helper deliberately serializes only the package-owned fields. It does not include customer, account, service-area, shipping, RDC, delivery-zone, or pricing fields.

## Exact payload fields

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

## Fetch example

```js
import {
  createStaticLocationMapPicker,
  createLocationMapPickerSubmitPayload
} from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const picker = createStaticLocationMapPicker({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
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

document.querySelector('#shippingForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const validation = picker.validate();
  if (!validation.valid) {
    picker.setMessage(validation.messages.join(' '), 'warning', 'host_validation_failed');
    return;
  }

  picker.setBusy(true, 'Saving address...');
  try {
    const payload = createLocationMapPickerSubmitPayload(picker);

    await fetch('/account/address/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    picker.resetDirty(true);
    picker.setMessage('Address saved.', 'success', 'host_address_saved');
  } finally {
    picker.setBusy(false);
  }
});
```

## Value-only example

Use `createLocationMapPickerSubmitPayloadFromValue()` when the host already has a serialized value and validation result.

```js
const payload = createLocationMapPickerSubmitPayloadFromValue(value, validation);
```

This is useful for tests and server-rendered saved-address forms that are hydrated before the picker is created.


## Normal form binding

For standard host form posts, prefer `bindLocationMapPickerForm()` so hidden-field writing and picker-owned blocking stay in one place. See `docs/host-form-binding.md`.

```js
import { bindLocationMapPickerForm } from 'philippines-location-map-picker';

bindLocationMapPickerForm({
  form: '#shippingForm',
  picker,
  focusOnBlocked: true
});
```

## Submit result helper

Use `blockInvalidLocationMapPickerSubmit()` when the host form should block submission and show the picker-owned validation message inside the picker status area.

```js
import {
  blockInvalidLocationMapPickerSubmit,
  createLocationMapPickerSubmitPayload
} from 'philippines-location-map-picker';

form.addEventListener('submit', (event) => {
  const result = blockInvalidLocationMapPickerSubmit(picker);

  if (result.blocked) {
    event.preventDefault();
    return;
  }

  const payload = createLocationMapPickerSubmitPayload(picker);
  form.elements.barangay_id.value = payload.barangay_id;
  form.elements.pin_lat.value = payload.pin_lat;
  form.elements.pin_lng.value = payload.pin_lng;
  form.elements.location_picker_value_json.value = payload.location_picker_value_json;
  form.elements.location_picker_validation_json.value = payload.location_picker_validation_json;
});
```

`createLocationMapPickerSubmitResult()` returns the same decision object without setting picker status.

```js
{
  valid: true,
  blocked: false,
  code: 'picker_valid',
  message: '',
  messages: [],
  missing: [],
  validation: picker.validate(),
  payload: createLocationMapPickerSubmitPayload(picker)
}
```

Blocked codes are explicit and stable:

```text
picker_invalid
picker_busy
picker_disabled
picker_readonly
```

The helper does not validate host-owned fields such as customer name, phone number, delivery notes, default-address flags, delivery zones, fee rules, account ownership, or saved-address IDs.
