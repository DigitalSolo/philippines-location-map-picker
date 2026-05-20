# Field Binding

The package owns its submit fields. Host pages should mount the picker on one DOM element and let the package create the hidden inputs.

## One element quick start

```html
<form method="post">
  <div id="delivery_location_picker"></div>
  <button type="submit">Save</button>
</form>

<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
PhilippinesLocationMapPicker.mountLocationMapPickerField('#delivery_location_picker', {
  provider: 'api',
  apiUrl: '/api/location-map-picker',
  fieldPrefix: 'delivery_location'
});
</script>
```

With the default underscore style, `fieldPrefix: 'delivery_location'` creates these hidden fields when the mount is inside a form:

```text
delivery_location_barangay_id
delivery_location_pin_lat
delivery_location_pin_lng
delivery_location_location_picker_value_json
delivery_location_location_picker_validation_json
```

## PHP-style names

```js
PhilippinesLocationMapPicker.mountLocationMapPickerField('#delivery_location_picker', {
  provider: 'api',
  apiUrl: '/api/location-map-picker',
  fieldPrefix: 'delivery_location',
  fieldNameStyle: 'bracket'
});
```

This creates:

```text
delivery_location[barangay_id]
delivery_location[pin_lat]
delivery_location[pin_lng]
delivery_location[location_picker_value_json]
delivery_location[location_picker_validation_json]
```

## Explicit field names

Explicit `fieldNames` override the generated prefix names:

```js
PhilippinesLocationMapPicker.mountLocationMapPickerField('#delivery_location_picker', {
  provider: 'api',
  apiUrl: '/api/location-map-picker',
  fieldPrefix: 'delivery_location',
  fieldNames: {
    barangay_id: 'customer_barangay_id',
    pin_lat: 'customer_latitude',
    pin_lng: 'customer_longitude'
  }
});
```

Only the package-owned fields are created. Existing host fields with the same names are reused.
