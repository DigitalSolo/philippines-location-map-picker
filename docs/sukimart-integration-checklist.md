# SukiMart Integration Checklist

## Vendor path

Copy the package to:

```text
/assets/vendor/philippines-location-map-picker
```

The static data base URL for SukiMart pages should be:

```text
/assets/vendor/philippines-location-map-picker/data
```

## Storage contract

- Save `barangay_id` as the authoritative administrative location key.
- Save `pin_lat` and `pin_lng` only when precision is required.
- Store `location_picker_value_json` for audit/debug if the host form needs full replay.
- Validate with the package submit guard before saving.
- Keep delivery-zone, serviceability, shipping fee, and vendor/RDC business rules outside the package.

## Rollout order

1. Customer shipping addresses.
2. Vendor addresses.
3. RDC/service facility addresses.
4. Admin-maintained coverage and delivery-zone screens.
