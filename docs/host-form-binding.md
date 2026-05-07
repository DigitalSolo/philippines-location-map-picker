# Host Form Binding

`bindLocationMapPickerForm()` wires a `LocationMapPicker` instance to a normal host form submit event.

The binding only owns package fields:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

It does not validate or save host-owned fields such as customer name, phone number, delivery notes, default-address flags, saved-address IDs, delivery-zone membership, shipping fee rules, vendor/RDC assignment, or account ownership.

## Basic usage

```js
import {
  bindLocationMapPickerForm,
  createStaticLocationMapPicker
} from 'philippines-location-map-picker';

const picker = createStaticLocationMapPicker({
  mount: '#addressPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data'
});

await picker.ready;

const binding = bindLocationMapPickerForm({
  form: '#shippingAddressForm',
  picker,
  focusOnBlocked: true
});
```

When the form submits, the binding:

1. Calls `createLocationMapPickerSubmitResult(picker)`.
2. Writes the package payload into hidden fields.
3. Blocks the submit if the picker is invalid, busy, disabled, or read-only.
4. Writes the blocked message into the picker status area unless `setStatus: false` is used.
5. Allows the submit to continue when the picker is valid.

## Custom field names

Use `fieldNames` when the host form has different endpoint names.

```js
bindLocationMapPickerForm({
  form: '#shippingAddressForm',
  picker,
  fieldNames: {
    barangay_id: 'delivery_barangay_id',
    pin_lat: 'delivery_pin_lat',
    pin_lng: 'delivery_pin_lng',
    location_picker_value_json: 'delivery_location_picker_value_json',
    location_picker_validation_json: 'delivery_location_picker_validation_json'
  }
});
```

Set a field name to an empty string to skip writing that field.

## Host callbacks

```js
bindLocationMapPickerForm({
  form: '#shippingAddressForm',
  picker,
  onBlocked(result) {
    console.warn(result.code, result.messages);
  },
  onValid(result) {
    console.info('Picker payload is ready.', result.payload);
  }
});
```

`onValid` does not mean the full host form is valid. It only means the picker-owned fields are valid.

## Manual payload write

Use `writeLocationMapPickerSubmitPayloadToForm()` when a host app already has its own submit controller but still wants the package to create/update hidden fields.

```js
import {
  createLocationMapPickerSubmitResult,
  writeLocationMapPickerSubmitPayloadToForm
} from 'philippines-location-map-picker';

form.addEventListener('submit', (event) => {
  const result = createLocationMapPickerSubmitResult(picker);

  writeLocationMapPickerSubmitPayloadToForm(form, result.payload);

  if (result.blocked) {
    event.preventDefault();
    picker.setStatus('error', result.message, result.code);
    return;
  }

  // Continue with host-owned validation here.
});
```

## Cleanup

The binding returns a small controller.

```js
const binding = bindLocationMapPickerForm({ form, picker });

binding.updatePayload();
binding.destroy();
```

`destroy()` removes only the form submit listener created by the binding. It does not destroy the picker.
