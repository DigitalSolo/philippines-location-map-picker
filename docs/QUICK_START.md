# Quick Start: UMD Browser Integration

This is the fastest path for a normal PHP, Laravel, WordPress, or plain HTML page. It does not require a bundler, `npm import`, React, Vue, or a build step.

## 1. Copy the package into the document root

Recommended public path:

```text
www/packages/philippines-location-map-picker/
```

The browser must be able to load both of these:

```text
/packages/philippines-location-map-picker/dist/location-map-picker.css
/packages/philippines-location-map-picker/dist/location-map-picker.umd.js
/packages/philippines-location-map-picker/data/
```

## 2. Add one mount element inside your form

```html
<form id="deliveryAddressForm" method="post" action="/account/address-save.php">
  <div id="locationPicker"></div>
  <button type="submit">Save address</button>
</form>
```

You do not need to hand-code hidden inputs. The reusable component creates the package-owned hidden fields automatically.

## 3. Include the CSS and UMD script

```html
<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
```

## 4. Mount the reusable component

```html
<script>
(function () {
  const pickerApi = window.PhilippinesLocationMapPicker;

  if (!pickerApi || typeof pickerApi.mountStaticLocationMapPicker !== 'function') {
    throw new Error('Philippines Location Map Picker UMD script is not loaded.');
  }

  pickerApi.mountStaticLocationMapPicker({
    mount: '#locationPicker',
    baseUrl: '/packages/philippines-location-map-picker/data',
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: true
    },
    map: {
      defaultCenter: { lat: 12.8797, lng: 121.7740 },
      defaultZoom: 6,
      pinMode: 'centered'
    }
  });
})();
</script>
```

## 5. Read the posted fields on the server

The component auto-creates these fields in the nearest parent form:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

`location_picker_value_json` contains the complete location, pin, and geometry status payload. `location_picker_validation_json` contains the picker validation result.

## Optional: custom field names

```html
<script>
window.PhilippinesLocationMapPicker.mountStaticLocationMapPicker({
  mount: '#locationPicker',
  baseUrl: '/packages/philippines-location-map-picker/data',
  formBinding: {
    fieldNames: {
      barangay_id: 'delivery_barangay_id',
      pin_lat: 'delivery_pin_lat',
      pin_lng: 'delivery_pin_lng',
      location_picker_value_json: 'delivery_location_json',
      location_picker_validation_json: 'delivery_location_validation_json'
    }
  }
});
</script>
```

## Static reverse-fill note

Static reverse-fill depends on the cached barangay geometry in `data/geo`. If a pin is outside cached geometry, the component cannot honestly infer the barangay from the pin alone. In that case, the streamlined static behavior is:

1. If the user already selected a barangay, keep that selected barangay and save the exact pin.
2. If no barangay is selected, ask the user to select the barangay manually.
3. For automatic nationwide pin-to-barangay matching, expand the static geometry cache or route reverse matching through a backend/live geometry provider.
