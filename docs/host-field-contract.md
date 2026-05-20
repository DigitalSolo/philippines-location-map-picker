# Host Field Contract

The package owns only the location-picker submit fields. Host applications own all account, customer, delivery-zone, and fulfillment rules.

When `mountStaticLocationMapPicker` is mounted inside a form, it automatically creates and updates these hidden fields:

```text
barangay_id
pin_lat
pin_lng
location_picker_value_json
location_picker_validation_json
```

## Field meanings

- `barangay_id`: authoritative PSGC barangay id selected by the picker.
- `pin_lat`: latitude of the selected map pin.
- `pin_lng`: longitude of the selected map pin.
- `location_picker_value_json`: complete normalized location, pin, and geometry payload.
- `location_picker_validation_json`: validation result for the picker-owned fields.

## Custom names

Use `formBinding.fieldNames` when a host application needs different field names.
