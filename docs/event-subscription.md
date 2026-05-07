# Event Subscription Contract

The picker classes expose matching `on()` and `off()` methods so host pages can attach temporary listeners without leaving stale callbacks behind.

This matters for host frameworks, repeated modal mounting, admin grids, and address forms that may create/destroy picker instances during partial page updates.

## LocationMapPicker

```js
function handleChange(value) {
  console.log(value.location.barangay_id);
}

picker.on('change', handleChange);
picker.off('change', handleChange);
```

Calling `off(eventName, handler)` removes only that exact handler reference.

```js
picker.off('change', handleChange);
```

Calling `off(eventName)` removes every handler registered for that event name.

```js
picker.off('change');
```

## LocationPicker and MapPicker

The same unsubscribe contract is available on the lower-level classes.

```js
locationPicker.on('openchange', handleOpenChange);
locationPicker.off('openchange', handleOpenChange);

mapPicker.on('pinchange', handlePinChange);
mapPicker.off('pinchange', handlePinChange);
```

## Bound field controls cleanup

`bindLocationMapPickerFieldControls()` now unregisters its picker event handlers during cleanup.

```js
const controls = bindLocationMapPickerFieldControls({
  picker,
  openButton: '[data-address-open]',
  summary: '[data-address-summary]'
});

controls.destroy();
```

When using the one-call field controller, `field.destroy()` still destroys controls, form binding, and picker in the correct order.

```js
const field = mountStaticLocationMapPickerField({
  mount: '#shippingLocationPicker',
  baseUrl: '/assets/vendor/philippines-location-map-picker/data',
  controls: {
    openButton: '[data-address-open]',
    summary: '[data-address-summary]'
  }
});

field.destroy();
```

## Integration rule

Host apps should keep handler references if they plan to unsubscribe later.

```js
const onStatusChange = (status) => {
  console.log(status.message);
};

picker.on('statuschange', onStatusChange);
picker.off('statuschange', onStatusChange);
```

Avoid anonymous inline handlers when the host page needs deterministic cleanup.
