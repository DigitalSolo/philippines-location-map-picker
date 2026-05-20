# Auto Mount Integration

Auto mount is the shortest host-page integration path.

It lets the page contain one normal mount element. PLMP reads configuration from `data-*` attributes, mounts the picker, binds the nearest parent form, and creates the package-owned hidden submit fields automatically.

## API mode

```html
<form method="post" action="/account/save">
  <div
    data-location-map-picker
    data-provider="api"
    data-api-url="/api/location-map-picker"
    data-field-prefix="delivery_location"
    data-required-location-level="barangay"
    data-require-pin="true"
    data-theme="light"
  ></div>

  <button type="submit">Save</button>
</form>

<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">
<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
  PhilippinesLocationMapPicker.autoMountLocationMapPickers();
</script>
```

No hand-written hidden fields are required.

## Static fixture mode

```html
<div
  data-location-map-picker
  data-provider="static"
  data-base-url="/packages/philippines-location-map-picker/data/fixtures/daet"
  data-field-prefix="customer_location"
></div>
```

## Hybrid mode

```html
<div
  data-location-map-picker
  data-provider="hybrid"
  data-base-url="/packages/philippines-location-map-picker/data/static"
  data-api-url="/api/location-map-picker"
  data-field-prefix="customer_location"
></div>
```

Hybrid mode uses static JSON for hierarchy lists and the API/database for reverse lookup and geometry.

## Common attributes

| Attribute | Purpose |
|---|---|
| `data-provider` | `static`, `api`, or `hybrid` |
| `data-base-url` | Static data base URL |
| `data-api-url` | Host API base URL |
| `data-field-prefix` | Prefix for auto-created hidden fields |
| `data-field-name-style` | `underscore`, `bracket`, `php`, or `array` |
| `data-required-location-level` | Usually `barangay` |
| `data-require-pin` | `true` or `false` |
| `data-theme` | `light`, `dark`, or `auto` |
| `data-size` | `compact`, `comfortable`, or `spacious` |
| `data-density` | `tight`, `normal`, or `relaxed` |
| `data-display-mode` | `embedded` or `modal` |
| `data-map-height` | CSS length such as `420px` |
| `data-open-on-mount` | `true` opens the picker immediately |
| `data-auto-bind-form` | `false` disables nearest-form binding |

## JSON attributes

These attributes accept JSON objects:

| Attribute | Option |
|---|---|
| `data-field-names` | Explicit field-name map |
| `data-provider-options` | Provider options |
| `data-static-provider-options` | Static provider options |
| `data-api-provider-options` | API provider options |
| `data-picker-options` | Full picker options |
| `data-form-binding` | Form binding options |
| `data-controls` | External control binding options |
| `data-initial-value` | Initial picker value |

Invalid JSON throws a clear error by default.

## Multiple pickers

```js
const controllers = PhilippinesLocationMapPicker.autoMountLocationMapPickers();
```

The returned value is an array of controllers. Each controller has:

```js
controller.picker
controller.binding
controller.ready
controller.open()
controller.close()
controller.updatePayload()
controller.destroy()
```

## Re-mounting after DOM replacement

```js
PhilippinesLocationMapPicker.destroyAutoMountedLocationMapPickers();
PhilippinesLocationMapPicker.autoMountLocationMapPickers({ force: true });
```

Use `force: true` when replacing or re-rendering an existing mounted element.
