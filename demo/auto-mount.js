import { autoMountLocationMapPickers } from '../src/index.js';

const controllers = autoMountLocationMapPickers();
const form = document.getElementById('demo_form');
const output = document.getElementById('payload_output');
const showPayload = document.getElementById('show_payload');

function formPayload() {
  const data = new FormData(form);
  const payload = {};
  for (const [key, value] of data.entries()) {
    payload[key] = value;
  }
  return payload;
}

function renderPayload() {
  controllers.forEach((controller) => {
    if (controller.binding) {
      controller.updatePayload();
    }
  });
  output.textContent = JSON.stringify(formPayload(), null, 2);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderPayload();
});

showPayload.addEventListener('click', renderPayload);
