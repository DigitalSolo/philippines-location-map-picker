# Host Field Contract

The package owns only address-selection, pin-selection, validation, and serialization fields. Host applications own customer, delivery, billing, and business-rule fields.

## Core submit fields

- `region_id`
- `province_id`
- `city_id`
- `barangay_id`
- `pin_lat`
- `pin_lng`
- `location_picker_value_json`
- `location_picker_validation_json`
- `location_picker_dirty_json`
- `location_picker_touched_json`
- `location_picker_status_json`

`barangay_id` is the authoritative administrative location key when barangay-level selection is required. `pin_lat` and `pin_lng` are precision coordinates and must not replace the PSGC key.
