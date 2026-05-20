import { mountLocationMapPickerField } from './mountLocationMapPickerField.js';

const DEFAULT_SELECTOR = '[data-location-map-picker]';
const CONTROLLER_KEY = '__philippinesLocationMapPickerController';
const MOUNTED_ATTR = 'data-location-map-picker-mounted';

const TOP_LEVEL_DATASET_KEYS = new Set([
  'provider',
  'mode',
  'providerMode',
  'baseUrl',
  'dataBaseUrl',
  'hierarchyBaseUrl',
  'geometryBaseUrl',
  'apiUrl',
  'geometryApiUrl',
  'fieldPrefix',
  'fieldNameStyle'
]);

const JSON_DATASET_KEYS = Object.freeze({
  fieldNames: 'fieldNames',
  providerOptions: 'providerOptions',
  staticProviderOptions: 'staticProviderOptions',
  apiProviderOptions: 'apiProviderOptions',
  pickerOptions: 'pickerOptions',
  formBinding: 'formBinding',
  controls: 'controls',
  initialValue: 'initialValue'
});

const UI_DATASET_KEYS = Object.freeze({
  displayMode: 'displayMode',
  theme: 'theme',
  size: 'size',
  density: 'density',
  selectedLabelFormat: 'selectedLabelFormat',
  title: 'title',
  subtitle: 'subtitle',
  triggerLabel: 'triggerLabel',
  triggerActionLabel: 'triggerActionLabel',
  saveLabel: 'saveLabel',
  cancelLabel: 'cancelLabel',
  clearLabel: 'clearLabel',
  searchPlaceholder: 'searchPlaceholder'
});

const LOCATION_DATASET_KEYS = Object.freeze({
  requiredLevel: 'requiredLevel'
});

const VALIDATION_DATASET_KEYS = Object.freeze({
  requiredLocationLevel: 'requiredLocationLevel',
  requirePin: 'requirePin'
});

const MAP_DATASET_KEYS = Object.freeze({
  pinMode: 'pinMode',
  showBoundary: 'showBoundary',
  fitBoundaryOnSelection: 'fitBoundaryOnSelection',
  tileUrlTemplate: 'tileUrlTemplate',
  mapHeight: 'mapHeight',
  height: 'height',
  mapMinHeight: 'mapMinHeight',
  minHeight: 'minHeight',
  mapMaxHeight: 'mapMaxHeight',
  maxHeight: 'maxHeight'
});

const REVERSE_DATASET_KEYS = Object.freeze({
  reverseEnabled: 'enabled',
  reverseFailOnNoMatch: 'failOnNoMatch'
});

function hasDocument() {
  return typeof document !== 'undefined' && document && typeof document.querySelectorAll === 'function';
}

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function hasValue(value) {
  return cleanText(value) !== '';
}

function isElement(value) {
  return value && typeof value === 'object' && value.nodeType === 1;
}

function isRootLike(value) {
  return value && typeof value === 'object' && typeof value.querySelectorAll === 'function';
}

function resolveRoot(root) {
  if (!root) {
    if (!hasDocument()) {
      throw new Error('autoMountLocationMapPickers requires a root when document is unavailable.');
    }
    return document;
  }

  if (typeof root === 'string') {
    if (!hasDocument()) {
      throw new Error('autoMountLocationMapPickers selector root requires document.');
    }
    const element = document.querySelector(root);
    if (!element) {
      throw new Error(`autoMountLocationMapPickers root was not found: ${root}`);
    }
    return element;
  }

  if (isRootLike(root)) {
    return root;
  }

  throw new Error('autoMountLocationMapPickers root must be a selector, Element, Document, or DocumentFragment.');
}

function findMountElements(root, selector) {
  const targetSelector = cleanText(selector || DEFAULT_SELECTOR) || DEFAULT_SELECTOR;
  const elements = [];

  if (isElement(root) && typeof root.matches === 'function' && root.matches(targetSelector)) {
    elements.push(root);
  }

  if (typeof root.querySelectorAll === 'function') {
    root.querySelectorAll(targetSelector).forEach((element) => elements.push(element));
  }

  return elements;
}

function parseBoolean(value) {
  const normalized = cleanText(value).toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return null;
}

function parseAutoValue(value) {
  const text = cleanText(value);
  if (text === '') {
    return '';
  }

  const booleanValue = parseBoolean(text);
  if (booleanValue !== null) {
    return booleanValue;
  }

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text);
  }

  return text;
}

function parseJsonOption(element, datasetKey) {
  const raw = element.dataset[datasetKey];
  if (!hasValue(raw)) {
    return undefined;
  }

  try {
    const decoded = JSON.parse(raw);
    if (decoded == null || typeof decoded !== 'object' || Array.isArray(decoded)) {
      throw new Error('JSON value must be an object.');
    }
    return decoded;
  } catch (error) {
    const id = element.id ? `#${element.id}` : element.tagName.toLowerCase();
    throw new Error(`Invalid JSON in data-${datasetKey.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase())} on ${id}: ${error.message}`);
  }
}

function copyDatasetValues(sourceDataset, keyMap) {
  const target = {};

  Object.entries(keyMap).forEach(([datasetKey, optionKey]) => {
    if (hasValue(sourceDataset[datasetKey])) {
      target[optionKey] = parseAutoValue(sourceDataset[datasetKey]);
    }
  });

  return target;
}

function mergeNestedOptions(options, nestedKey, values) {
  if (Object.keys(values).length === 0) {
    return;
  }

  options.pickerOptions = {
    ...(options.pickerOptions || {}),
    [nestedKey]: {
      ...((options.pickerOptions && options.pickerOptions[nestedKey]) || {}),
      ...values
    }
  };
}

function buildElementOptions(element, defaults = {}) {
  const dataset = element.dataset || {};
  const options = { ...defaults };

  TOP_LEVEL_DATASET_KEYS.forEach((key) => {
    if (hasValue(dataset[key])) {
      options[key] = parseAutoValue(dataset[key]);
    }
  });

  Object.entries(JSON_DATASET_KEYS).forEach(([datasetKey, optionKey]) => {
    const parsed = parseJsonOption(element, datasetKey);
    if (parsed !== undefined) {
      options[optionKey] = parsed;
    }
  });

  if (hasValue(dataset.form)) {
    options.form = dataset.form;
  }
  if (hasValue(dataset.autoBindForm)) {
    options.autoBindForm = parseBoolean(dataset.autoBindForm) !== false;
  }
  if (hasValue(dataset.openOnMount)) {
    options.openOnMount = parseBoolean(dataset.openOnMount) === true;
  }

  mergeNestedOptions(options, 'ui', copyDatasetValues(dataset, UI_DATASET_KEYS));
  mergeNestedOptions(options, 'location', copyDatasetValues(dataset, LOCATION_DATASET_KEYS));
  mergeNestedOptions(options, 'validation', copyDatasetValues(dataset, VALIDATION_DATASET_KEYS));
  mergeNestedOptions(options, 'map', copyDatasetValues(dataset, MAP_DATASET_KEYS));
  mergeNestedOptions(options, 'reverse', copyDatasetValues(dataset, REVERSE_DATASET_KEYS));

  return options;
}

function mountElement(element, defaults = {}, options = {}) {
  if (!isElement(element)) {
    throw new Error('autoMountLocationMapPickers can only mount on Element nodes.');
  }

  const force = options.force === true;
  if (!force && element[CONTROLLER_KEY]) {
    return element[CONTROLLER_KEY];
  }

  if (force && element[CONTROLLER_KEY] && typeof element[CONTROLLER_KEY].destroy === 'function') {
    element[CONTROLLER_KEY].destroy();
  }

  const elementOptions = buildElementOptions(element, defaults);
  const controller = mountLocationMapPickerField(element, elementOptions);
  element[CONTROLLER_KEY] = controller;
  element.setAttribute(MOUNTED_ATTR, 'true');
  return controller;
}

/**
 * Mounts every element marked with data-location-map-picker.
 *
 * The element may declare provider/data/API/form options using data attributes.
 * Missing submit fields are created automatically when the mount is inside a form.
 */
export function autoMountLocationMapPickers(rootOrOptions = undefined, maybeOptions = {}) {
  let root = rootOrOptions;
  let options = maybeOptions || {};

  if (rootOrOptions && typeof rootOrOptions === 'object' && !isRootLike(rootOrOptions) && !isElement(rootOrOptions)) {
    options = rootOrOptions;
    root = options.root;
  }

  const resolvedRoot = resolveRoot(root);
  const selector = options.selector || DEFAULT_SELECTOR;
  const defaults = options.defaults && typeof options.defaults === 'object' ? options.defaults : {};
  const continueOnError = options.continueOnError === true;
  const controllers = [];
  const errors = [];

  findMountElements(resolvedRoot, selector).forEach((element) => {
    try {
      controllers.push(mountElement(element, defaults, options));
    } catch (error) {
      if (!continueOnError) {
        throw error;
      }
      errors.push({ element, error });
      if (typeof options.onError === 'function') {
        options.onError(error, element);
      }
    }
  });

  controllers.errors = errors;
  return controllers;
}

export function destroyAutoMountedLocationMapPickers(rootOrOptions = undefined, maybeOptions = {}) {
  let root = rootOrOptions;
  let options = maybeOptions || {};

  if (rootOrOptions && typeof rootOrOptions === 'object' && !isRootLike(rootOrOptions) && !isElement(rootOrOptions)) {
    options = rootOrOptions;
    root = options.root;
  }

  const resolvedRoot = resolveRoot(root);
  const selector = options.selector || DEFAULT_SELECTOR;
  const destroyed = [];

  findMountElements(resolvedRoot, selector).forEach((element) => {
    const controller = element[CONTROLLER_KEY];
    if (controller && typeof controller.destroy === 'function') {
      controller.destroy();
      destroyed.push(controller);
    }
    delete element[CONTROLLER_KEY];
    element.removeAttribute(MOUNTED_ATTR);
  });

  return destroyed;
}

export function locationMapPickerAutoMountSelector() {
  return DEFAULT_SELECTOR;
}
