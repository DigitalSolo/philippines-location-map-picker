# Philippines Address Picker v2

A dependency-free Philippine address form component backed by bundled PSA PSGC data.

## Install

Copy this folder to your website without changing the `dist/` and `data/` relationship, then add:

```html
<script src="/path/to/philippines-address-picker-v2/dist/philippines-address-picker.js" defer></script>
<div data-ph-address-picker></div>
```

That is enough. The script automatically loads its CSS and the local PSGC data files.

No framework, API key, map library, or initialization code is required.


## Test locally with the built-in server

The package includes a dependency-free Node.js test server. No Apache, PHP, Vite, or `npm install` is required.

On Windows, double-click:

```text
start-server.bat
```

It starts the server and opens:

```text
http://127.0.0.1:5173/example.html
```

Or from Command Prompt / PowerShell in this folder:

```text
npm run dev
```

Press `Ctrl+C` in the server window when you are finished.

## What it collects

- House/building and street
- Subdivision / sitio / purok / landmark (optional)
- Region
- Province, independent/highly urbanized city, or special administrative area
- City/municipality where applicable
- Manila district/submunicipality where applicable
- Barangay
- Postal / ZIP code (optional, stored as text)
- Browser coordinates and current-location PSGC autofill (optional)
- PSGC codes and display names
- A complete JSON payload

The bundled administrative dataset is PSGC 2Q 2026, as of 30 June 2026.

## Forms

Placed inside a `<form>`, the component writes normal named form inputs. It validates required administrative fields before submission.

Use a prefix when a page has more than one address:

```html
<div data-ph-address-picker data-prefix="shipping"></div>
<div data-ph-address-picker data-prefix="billing"></div>
```

This produces names such as `shipping_address_line1`, `shipping_barangay_psgc`, and `shipping_address_json`.

## Options

Most websites only need the two-line install. Optional data attributes include:

```html
<div
  data-ph-address-picker
  data-prefix="shipping"
  data-title="Shipping address"
  data-required="true"
  data-require-line1="true"
  data-require-postal-code="false"
  data-geolocation="true"
  data-compact="false">
</div>
```

`data-geolocation="true"` shows a **Use my current location** button. On a secure page (HTTPS, `localhost`, or `127.0.0.1`) it:

1. asks the browser for the device's current coordinates;
2. performs a client-side place lookup; and
3. conservatively matches the returned names back to the bundled PSGC hierarchy.

By default the client-side lookup uses BigDataCloud's free browser reverse-geocoding endpoint. No API key is required. The component only auto-selects PSGC levels that match; uncertain levels stay unselected for the user to verify. It never invents a house/street address from GPS.

To capture coordinates **without** sending them to a reverse-geocoding provider:

```html
<div data-ph-address-picker data-location-lookup-provider="none"></div>
```

Or disable current-location autofill while keeping the button:

```html
<div data-ph-address-picker data-auto-fill-current-location="false"></div>
```

When the default BigDataCloud lookup is enabled, clicking the button sends the browser-provided current coordinates directly from that browser to BigDataCloud. Review its current free-client API/fair-use and privacy terms before deploying on a public site. You can also provide your own `locationLookup` JavaScript function instead.

## JavaScript API

```js
const picker = PhilippinesAddressPicker.mount('#address', {
  prefix: 'shipping'
});

await picker.ready;
console.log(picker.value());
console.log(picker.validate());
```

Available methods include `value()`, `setValue()`, `validate()`, `geolocate()`, `clearCoordinates()`, and `destroy()`. `geolocate()` now returns the browser position plus lookup/match information when available.

The element emits `ph-address-change` whenever its value changes.

## Accuracy model

Administrative names and PSGC codes are constrained by the bundled official hierarchy. Street/building details remain user-entered because PSGC is not a street-address database. Current-location lookup is an assistive shortcut: the returned place names are reconciled against the bundled PSGC list, and the user should verify the result. Coordinates remain supporting metadata rather than a substitute for the administrative address.

This avoids the main failure mode of the original map-first component: nationwide pin-to-barangay reverse matching was not backed by nationwide barangay boundary geometry.

See `example.html` for a working form example. Serve the folder over HTTP(S); browsers normally do not allow the JSON fetches from arbitrary `file://` paths.
