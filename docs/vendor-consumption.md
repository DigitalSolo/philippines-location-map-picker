# Vendor Consumption Guide

## Public path

Recommended public document-root placement:

```text
www/packages/philippines-location-map-picker/
```

Recommended browser path:

```text
/packages/philippines-location-map-picker/
```

## Reusable component

```html
<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">

<form id="deliveryAddressForm" method="post">
  <div id="locationPicker"></div>
  <button type="submit">Save address</button>
</form>

<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
window.PhilippinesLocationMapPicker.mountStaticLocationMapPicker({
  mount: '#locationPicker',
  baseUrl: '/packages/philippines-location-map-picker/data'
});
</script>
```

## Host configuration helper

`createLocationMapPickerHostConfig` remains available for applications that want to centralize field names and default picker settings before mounting.

## Auto-created submit fields

The reusable component creates these fields automatically in the nearest parent form:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```
