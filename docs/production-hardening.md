# Production Hardening Notes

## Runtime assets

Host the package locally under the public document root:

```text
www/packages/philippines-location-map-picker/
```

Do not rely on CDN copies of the JavaScript, CSS, PSGC hierarchy, or geometry cache.

## Preferred host integration

Use the UMD reusable component:

```js
window.PhilippinesLocationMapPicker.mountStaticLocationMapPicker({
  mount: '#locationPicker',
  baseUrl: '/packages/philippines-location-map-picker/data'
});
```

Place the mount element inside the host form. The component automatically creates the package-owned hidden submit fields.

## Static reverse-fill

Static reverse-fill is only as complete as `data/geo`. If a selected barangay has no cached geometry, the picker keeps the selected barangay and saves the exact pin instead of blocking the user with an internal geometry-cache message.

For full automatic pin-to-barangay matching, expand the cached geometry data or provide a backend/live geometry provider.

## Accessibility

Modal handling uses `inert` for background content and avoids `aria-hidden` on ancestors of focused elements.

## Host-owned rules

The package validates only location and pin fields. The host app owns account, customer, delivery-zone, fulfillment, fraud, and address-label policy checks.
