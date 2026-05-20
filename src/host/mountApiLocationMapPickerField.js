import { createApiLocationMapPicker } from './createApiLocationMapPicker.js';
import { bindLocationMapPickerForm } from './bindLocationMapPickerForm.js';
import { bindLocationMapPickerFieldControls } from './bindLocationMapPickerFieldControls.js';

function objectOption(value, name) {
  if (value == null) {
    return {};
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`mountApiLocationMapPickerField ${name} must be an object.`);
  }

  return value;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function isElementLike(value) {
  return value && typeof value === 'object' && (value.nodeType === 1 || typeof value.querySelector === 'function');
}

function normalizeMountArguments(first, second = {}) {
  if (typeof first === 'string' || isElementLike(first)) {
    return {
      ...(second && typeof second === 'object' && !Array.isArray(second) ? second : {}),
      mount: first
    };
  }

  return first || {};
}

function resolveElement(value, name) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const element = document.querySelector(value);
    if (!element) {
      throw new Error(`mountApiLocationMapPickerField ${name} was not found: ${value}`);
    }
    return element;
  }

  return value;
}

function resolveForm(options) {
  if (options.form === false || options.autoBindForm === false) {
    return null;
  }

  if (options.form) {
    return resolveElement(options.form, 'form');
  }

  const mount = resolveElement(options.mount, 'mount');
  return mount && typeof mount.closest === 'function' ? mount.closest('form') : null;
}

function requireFieldOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('mountApiLocationMapPickerField requires an options object.');
  }

  if (!hasOwn(options, 'mount')) {
    throw new Error('mountApiLocationMapPickerField requires mount.');
  }

  if (!hasOwn(options, 'apiUrl') && !hasOwn(options, 'baseUrl')) {
    throw new Error('mountApiLocationMapPickerField requires apiUrl or baseUrl.');
  }

  return options;
}

function createPickerOptions(options) {
  return {
    ...objectOption(options.pickerOptions, 'pickerOptions'),
    mount: options.mount,
    apiUrl: options.apiUrl || options.baseUrl,
    providerOptions: objectOption(options.providerOptions, 'providerOptions')
  };
}

function createBinding(options, picker) {
  const form = resolveForm(options);

  if (!form) {
    if (hasOwn(options, 'formBinding')) {
      throw new Error('mountApiLocationMapPickerField formBinding requires form or a mount inside a form.');
    }
    return null;
  }

  return bindLocationMapPickerForm({
    fieldPrefix: options.fieldPrefix,
    fieldNameStyle: options.fieldNameStyle,
    fieldNames: options.fieldNames,
    ...objectOption(options.formBinding, 'formBinding'),
    form,
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
 * Mounts the database/API-backed picker as a reusable host field controller.
 *
 * If the mount element is inside a form, the package automatically creates and
 * updates its hidden submit fields. Pass form: false to disable form binding.
 */
export function mountApiLocationMapPickerField(mountOrOptions = {}, options = {}) {
  const fieldOptions = requireFieldOptions(normalizeMountArguments(mountOrOptions, options));
  const picker = createApiLocationMapPicker(createPickerOptions(fieldOptions));
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
        throw new Error('mountApiLocationMapPickerField updatePayload requires form binding.');
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
