# Host Selection State

`hasLocationMapPickerSelection()` and `selectedLocationMapPickerLevel()` give host applications a strict way to decide whether an address field currently has a selected administrative location.

These helpers are intentionally separate from submit validation:

- selection state answers: "does the location portion have a usable selected level?";
- validation answers: "can this picker be submitted right now?";
- pin requirements remain validation-only.

## Selected level

```js
import {
  selectedLocationMapPickerLevel
} from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const level = selectedLocationMapPickerLevel(picker.value());
```

Return values:

```text
barangay
city
province
region
''
```

The deepest populated location ID wins.

## Required-level selection check

```js
import {
  hasLocationMapPickerSelection
} from '/assets/vendor/philippines-location-map-picker/dist/location-map-picker.es.js';

const selected = hasLocationMapPickerSelection(picker.value(), {
  requiredLocationLevel: 'city'
});
```

This returns `true` when the value has a selected location at or below the required level.

Examples:

| Required level | Region selected | Province selected | City selected | Barangay selected |
|---|---:|---:|---:|---:|
| region | true | true | true | true |
| province | false | true | true | true |
| city | false | false | true | true |
| barangay | false | false | false | true |

## Field controls integration

`bindLocationMapPickerFieldControls()` now uses the picker validation contract to infer the current required location level. This prevents host summaries from treating a valid city-level picker as unselected just because there is no barangay.

Override the display-selection requirement only when the host field intentionally wants different visual behavior than submit validation:

```js
const controls = bindLocationMapPickerFieldControls({
  picker,
  openButton: '[data-address-open]',
  summary: '[data-address-summary]',
  selectionRequiredLevel: 'city'
});
```

The summary element receives:

```text
data-selected="true|false"
data-selected-level="region|province|city|barangay|"
data-valid="true|false"
```

`data-selected` is location-level only. `data-valid` still reflects full picker validation, including required pin when configured.
