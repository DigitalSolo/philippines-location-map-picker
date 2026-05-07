# Host Field Controller

`mountStaticLocationMapPickerField()` is the package-level host field controller for pages that want one setup call instead of separate picker, saved-value hydration, and form-binding code.

It is still package-only. The host application remains responsible for customer/account fields, delivery-zone checks, shipping fees, RDC/vendor assignment, saved-address IDs, and ownership checks.

## Basic usage

```js
import { mountStaticLocationMapPickerField } from 'philippines-location-map-picker';

const field = mountStaticLocationMapPickerField({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  form: '#shippingAddressForm',
  formBinding: {
    focusOnBlocked: true
  },
  controls: {
    openButton: '[data-address-open]',
    summary: '[data-address-summary]',
    status: '[data-address-status]',
    emptyLabel: 'Select City → Barangay'
  },
  pickerOptions: {
    ui: {
      displayMode: 'modal',
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
  }
});

await field.ready;
```

When `form` is provided, the controller creates a `bindLocationMapPickerForm()` binding. On submit, the package-owned hidden fields are written and invalid picker states are blocked. When `controls` is provided, the controller also creates a `bindLocationMapPickerFieldControls()` binding for host-owned open buttons, summary text, and status text.

## Saved address edit form

Use `initialValue` to hydrate a saved address as the clean baseline.

```js
const field = mountStaticLocationMapPickerField({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  form: '#shippingAddressForm',
  initialValue: {
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
  }
});

await field.ready;
field.picker.isDirty(); // false
```

`resetDirtyOnInitialValue` defaults to `true`. Set it to `false` only when the host deliberately wants the initial programmatic value to remain outside the clean baseline.

## External controls

The controller exposes explicit modal controls.

```js
document.querySelector('[data-edit-address]').addEventListener('click', () => {
  field.open();
});

document.querySelector('[data-close-address]').addEventListener('click', () => {
  field.close();
});
```

`open()` and `close()` forward to the underlying `LocationMapPicker` instance. The underlying picker exposes `picker.open()`, `picker.close()`, and `picker.isOpen()` directly. Host controls can also be bound declaratively through the controller-level `controls` option; see `docs/host-field-controls.md`.

## Manual payload refresh

```js
const result = field.updatePayload();

if (result.blocked) {
  console.warn(result.code, result.message);
}
```

`updatePayload()` requires `form`. When a controller was created without `form`, calling `updatePayload()` throws instead of silently doing nothing.

## Cleanup

```js
field.destroy();
```

`destroy()` removes the controls binding, removes the form binding, then destroys the picker instance.
