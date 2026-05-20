# SukiMart Integration Checklist

## Public package path

Place the package under:

```text
www/packages/philippines-location-map-picker/
```

Serve it as:

```text
/packages/philippines-location-map-picker/
```

## Address form

Use one mount element inside the address form. Do not hand-code package hidden fields unless there is a special host requirement.

## Server-side storage

Use `barangay_id` as the authoritative selected barangay id. Store `pin_lat` and `pin_lng` as the precise delivery pin coordinates. Store or inspect `location_picker_value_json` when the full normalized picker payload is needed.

## Business rules

Keep SukiMart delivery-zone, RDC, vendor coverage, serviceability, and pricing rules outside this package.
