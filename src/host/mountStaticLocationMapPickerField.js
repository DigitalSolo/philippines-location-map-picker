import { createStaticLocationMapPicker } from './createStaticLocationMapPicker.js';
import { bindLocationMapPickerForm } from './bindLocationMapPickerForm.js';
import { bindLocationMapPickerFieldControls } from './bindLocationMapPickerFieldControls.js';

function objectOption(value, name) {
  if (value == null) {
    return {};
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`mountStaticLocationMapPickerField ${name} must be an object.`);
  }

  return value;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function requireFieldOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('mountStaticLocationMapPickerField requires an options object.');
  }

  if (!hasOwn(options, 'mount')) {
    throw new Error('mountStaticLocationMapPickerField requires mount.');
  }

  if (!hasOwn(options, 'baseUrl')) {
    throw new Error('mountStaticLocationMapPickerField requires baseUrl.');
  }

  if (!options.form && hasOwn(options, 'formBinding')) {
    throw new Error('mountStaticLocationMapPickerField formBinding requires form.');
  }

  return options;
}

function createPickerOptions(options) {
  return {
    ...objectOption(options.pickerOptions, 'pickerOptions'),
    mount: options.mount,
    baseUrl: options.baseUrl
  };
}

function createBinding(options, picker) {
  if (!options.form) {
    return null;
  }

  return bindLocationMapPickerForm({
    ...objectOption(options.formBinding, 'formBinding'),
    form: options.form,
    picker
  });
}

function createControls(options, picker) {
  if (!options.controls) {
    return null;
  }

  return bindLocationMapPickerFieldControls({
    ...objectOption(options.controls, 'controls'),
    picker
  });
}

async function applyInitialValue(controller, options) {
  await controller.picker.ready;

  if (hasOwn(options, 'initialValue')) {
    await controller.picker.setValue(options.initialValue || {}, false, {
      resetDirty: options.resetDirtyOnInitialValue !== false,
      trackDirty: options.trackDirtyOnInitialValue === true
    });
  }

  if (options.openOnMount === true) {
    controller.open();
  }

  return controller;
}

/**
 * Mounts the static picker as a reusable host field controller.
 *
 * This helper combines the static-data factory, optional saved-value hydration,
 * optional form binding, and explicit open/close controls for host pages.
 */
export function mountStaticLocationMapPickerField(options = {}) {
  const fieldOptions = requireFieldOptions(options);
  const picker = createStaticLocationMapPicker(createPickerOptions(fieldOptions));
  const binding = createBinding(fieldOptions, picker);
  const controls = createControls(fieldOptions, picker);
  let destroyed = false;

  const controller = {
    picker,
    binding,
    controls,
    ready: null,
    open() {
      if (!destroyed && typeof picker.open === 'function') {
        picker.open();
      }
      return controller;
    },
    close() {
      if (!destroyed && typeof picker.close === 'function') {
        picker.close();
      }
      return controller;
    },
    isOpen() {
      return !destroyed && typeof picker.isOpen === 'function' ? picker.isOpen() : false;
    },
    updatePayload() {
      if (!binding) {
        throw new Error('mountStaticLocationMapPickerField updatePayload requires form.');
      }
      return binding.updatePayload();
    },
    resize() {
      if (!destroyed && typeof picker.resize === 'function') {
        picker.resize();
      }
      return controller;
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      if (controls && typeof controls.destroy === 'function') {
        controls.destroy();
      }
      if (binding && typeof binding.destroy === 'function') {
        binding.destroy();
      }
      picker.destroy();
    }
  };

  controller.ready = applyInitialValue(controller, fieldOptions);

  return controller;
}
