# SukiMart Production Integration

## Public placement

Copy the package to:

```text
www/packages/philippines-location-map-picker/
```

Serve package assets from:

```text
/packages/philippines-location-map-picker/
```

## Address picker mount

Use one mount element inside the customer address form:

```html
<div id="locationPicker"></div>
```

Mount through the UMD helper:

```js
window.PhilippinesLocationMapPicker.mountStaticLocationMapPicker({
  mount: '#locationPicker',
  baseUrl: '/packages/philippines-location-map-picker/data'
});
```

## Posted fields

The reusable component automatically creates:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

Use `barangay_id` as the authoritative selected barangay id. Keep delivery-zone, RDC, vendor coverage, and pricing rules in SukiMart.
