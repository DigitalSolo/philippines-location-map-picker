const ids = ['mode','mountId','formId','formAction','assetBaseUrl','apiUrl','dataBaseUrl','theme','size','density','pinMode','requirePin','mapHeight'];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const htmlOutput = document.getElementById('htmlOutput');
const jsonOutput = document.getElementById('jsonOutput');
const copyStatus = document.getElementById('copyStatus');

function value(id) {
  return String(elements[id].value || '').trim();
}

function bool(id) {
  return value(id) === 'true';
}

function numberOrString(raw) {
  const text = String(raw || '').trim();
  const number = Number(text);
  return Number.isFinite(number) ? number : text;
}

function settings() {
  const mode = value('mode');
  const mount = `#${value('mountId') || 'locationPicker'}`;
  const pickerOptions = {
    ui: {
      theme: value('theme'),
      size: value('size'),
      density: value('density'),
      selectedLabelFormat: 'city_barangay'
    },
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: bool('requirePin')
    },
    map: {
      defaultCenter: { lat: 12.8797, lng: 121.7740 },
      defaultZoom: 6,
      pinMode: value('pinMode'),
      mapHeight: numberOrString(value('mapHeight'))
    }
  };

  const options = {
    mount,
    provider: mode,
    pickerOptions
  };

  if (mode === 'api') {
    options.apiUrl = value('apiUrl');
  } else if (mode === 'hybrid') {
    options.baseUrl = value('dataBaseUrl');
    options.apiUrl = value('apiUrl');
  } else {
    options.baseUrl = value('dataBaseUrl');
  }

  return {
    helper: 'mountLocationMapPickerField',
    options
  };
}

function render() {
  const assetBaseUrl = value('assetBaseUrl').replace(/\/+$/, '');
  const formId = value('formId') || 'deliveryAddressForm';
  const mountId = value('mountId') || 'locationPicker';
  const current = settings();
  const optionsJson = JSON.stringify(current.options, null, 2)
    .replace(/"([^"\\]+)":/g, '$1:')
    .replace(/"#([^"\\]+)"/g, "'#$1'")
    .replace(/"\/([^"\\]+)"/g, "'/$1'")
    .replace(/"([a-zA-Z_][a-zA-Z0-9_-]*)"/g, "'$1'");

  htmlOutput.textContent = `<link rel="stylesheet" href="${assetBaseUrl}/dist/location-map-picker.css">\n\n<form id="${formId}" method="post" action="${value('formAction')}">\n  <div id="${mountId}"></div>\n  <button type="submit">Save address</button>\n</form>\n\n<script src="${assetBaseUrl}/dist/location-map-picker.umd.js"></script>\n<script>\nPhilippinesLocationMapPicker.${current.helper}(${optionsJson});\n</script>`;
  jsonOutput.textContent = JSON.stringify(current.options, null, 2);
}

function copyOutput(id) {
  const target = document.getElementById(id);
  navigator.clipboard.writeText(target.textContent).then(() => {
    copyStatus.textContent = 'Copied.';
    window.setTimeout(() => { copyStatus.textContent = ''; }, 1500);
  }).catch(() => {
    copyStatus.textContent = 'Copy failed. Select the box and copy manually.';
  });
}

ids.forEach((id) => elements[id].addEventListener('input', render));
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', () => copyOutput(button.getAttribute('data-copy')));
});
render();
