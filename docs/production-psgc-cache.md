# Production PSGC Cache

`data/psgc/` contains the static hierarchy used by the production-oriented static provider.

The reusable component should be mounted with:

```js
window.PhilippinesLocationMapPicker.mountStaticLocationMapPicker({
  mount: '#locationPicker',
  baseUrl: '/packages/philippines-location-map-picker/data'
});
```

The PSGC hierarchy cache is the source for region, province, city/municipality, and barangay dropdowns.
