# SukiMart Production Integration Notes

Use this package as a vendor dependency after publishing or copying from the `v1.0.63` GitHub tag.

## Recommended integration order

1. Customer saved-address form.
2. Checkout delivery address form.
3. Vendor address form.
4. RDC / warehouse address form.
5. Admin address edit form.

## Stored fields

Minimum host fields:

```text
region_id
region_name
province_id
province_name
city_id
city_name
barangay_id
barangay_name
latitude
longitude
location_json
```

## Authority rule

`barangay_id` is the authoritative saved address key.

Latitude and longitude are pin precision fields, not replacements for PSGC selection.

## Reverse-fill rule

Reverse-fill is optional. It can help users, but it must never be the only way to save an address because geometry is intentionally limited in this package release.

## Delivery-zone rule

Do not put SukiMart delivery-zone logic inside this package.

The package returns a normalized location value. SukiMart decides whether that location is serviceable.
