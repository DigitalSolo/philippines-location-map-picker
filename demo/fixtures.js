import '../src/css/location-map-picker.css';
import { mountLocationMapPickerField } from '../src/index.js';

const fixtureBaseUrl = new URL('../data/fixtures/daet', import.meta.url).toString().replace(/\/+$/, '');
const statusEl = document.getElementById('status');
const form = document.getElementById('fixtureForm');
const fieldOutput = document.getElementById('fieldOutput');
const valueOutput = document.getElementById('valueOutput');
const reverseButton = document.getElementById('reverseButton');
const validateButton = document.getElementById('validateButton');

function readField(name) {
  return form.elements[name] ? form.elements[name].value : '';
}

function safeJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function updateOutput(controller) {
  const validation = safeJson(readField('location_picker_validation_json'), {});
  const payload = {
    barangay_id: readField('barangay_id'),
    pin_lat: readField('pin_lat'),
    pin_lng: readField('pin_lng'),
    location_picker_value_json: safeJson(readField('location_picker_value_json'), {}),
    location_picker_validation_json: validation
  };

  fieldOutput.textContent = JSON.stringify(payload, null, 2);
  valueOutput.textContent = JSON.stringify(controller.picker.value(), null, 2);
}

function setStatus(message, level = '') {
  statusEl.textContent = message;
  statusEl.className = `status${level ? ` is-${level}` : ''}`;
}

const controller = mountLocationMapPickerField({
  mount: '#fixturePicker',
  provider: 'static',
  baseUrl: fixtureBaseUrl,
  form: '#fixtureForm',
  pickerOptions: {
    ui: {
      theme: 'light',
      size: 'comfortable',
      density: 'normal',
      selectedLabelFormat: 'city_barangay',
      className: 'demo-location-instance'
    },
    location: {
      requiredLevel: 'barangay'
    },
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: true
    },
    map: {
      defaultCenter: { lat: 14.112, lng: 122.955 },
      defaultZoom: 12,
      pinMode: 'centered',
      showBoundary: true,
      fitBoundaryOnSelection: true
    },
    reverse: {
      enabled: true,
      failOnNoMatch: false
    }
  }
});

controller.ready.then(() => {
  controller.updatePayload();
  updateOutput(controller);
  setStatus('Ready. Select a Daet barangay or place the pin inside the fixture bounds.', 'success');
});

controller.picker.on('change', () => {
  controller.updatePayload();
  updateOutput(controller);
});

controller.picker.on('statuschange', (status) => {
  if (status.message) {
    setStatus(status.message, status.level === 'error' ? 'warning' : status.level);
  }
});

reverseButton.addEventListener('click', async () => {
  const value = await controller.picker.reverseFillFromPin(true);
  controller.updatePayload();
  updateOutput(controller);
  if (value) {
    setStatus('Reverse-fill matched a fixture barangay.', 'success');
  } else {
    setStatus('No fixture boundary matched that pin. Move the map inside the Daet fixture grid.', 'warning');
  }
});

validateButton.addEventListener('click', () => {
  const validation = controller.picker.validate();
  controller.updatePayload();
  updateOutput(controller);
  setStatus(validation.valid ? 'Validation passed.' : `Validation failed: ${validation.messages.join(' ')}`, validation.valid ? 'success' : 'warning');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = controller.updatePayload();
  updateOutput(controller);
  setStatus(result.blocked ? result.message : 'Submit passed. Package-owned hidden fields are populated.', result.blocked ? 'warning' : 'success');
});
