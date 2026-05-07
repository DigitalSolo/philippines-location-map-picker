# Vendor Consumption

Use the package from a local vendor path and provide an explicit data `baseUrl`. Do not hard-code the host path inside package source.

```js
import {
  createLocationMapPickerHostConfig,
  createStaticLocationMapPicker
} from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const hostConfig = createLocationMapPickerHostConfig({
  baseUrl: '/assets/vendor/philippines-location-map-picker/data'
});

const picker = createStaticLocationMapPicker({
  mount: document.getElementById('locationPicker'),
  ...hostConfig
});
```

Post the package-owned fields documented in `docs/host-field-contract.md`. Keep delivery coverage, serviceability, shipping fees, RDC assignment, and vendor workflow rules in the host application.
